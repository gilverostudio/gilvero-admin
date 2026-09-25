/**
 * Create (or promote) an admin user.
 *
 *   npm run admin:create -- --email you@gilvero.com --password "..." --name "Hamza Gill" [--role owner|editor]
 *
 * If the email already exists in Supabase Auth, the password is updated and the
 * user is (re)linked to admin_users. The first admin should be an `owner`.
 */
import { createAdminClient } from "./lib/supabase-admin";

function arg(name: string) {
  const index = process.argv.indexOf(`--${name}`);
  return index > -1 ? process.argv[index + 1] : undefined;
}

async function main() {
  const email = arg("email")?.trim().toLowerCase();
  const password = arg("password");
  const fullName = arg("name") ?? null;
  const role = (arg("role") ?? "owner") as "owner" | "editor";

  if (!email || !password) throw new Error('Usage: npm run admin:create -- --email x@y.com --password "..." [--name "..."] [--role owner|editor]');
  if (password.length < 10) throw new Error("Use a password of at least 10 characters.");
  if (!["owner", "editor"].includes(role)) throw new Error("--role must be owner or editor");

  const supabase = createAdminClient();

  // Find an existing auth user with this email.
  let userId: string | undefined;
  for (let page = 1; !userId; page++) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    userId = data.users.find((u) => u.email?.toLowerCase() === email)?.id;
    if (data.users.length < 200) break;
  }

  if (userId) {
    const { error } = await supabase.auth.admin.updateUserById(userId, { password, email_confirm: true });
    if (error) throw error;
    console.log(`• Existing user found — password updated`);
  } else {
    const { data, error } = await supabase.auth.admin.createUser({ email, password, email_confirm: true });
    if (error) throw error;
    userId = data.user.id;
    console.log(`• Auth user created`);
  }

  const { error } = await supabase
    .from("admin_users")
    .upsert({ id: userId, email, full_name: fullName, role }, { onConflict: "id" });
  if (error) throw error;

  console.log(`✓ ${email} is now an admin (${role})`);
}

main().catch((error) => {
  console.error(`✗ ${error.message ?? error}`);
  process.exit(1);
});
