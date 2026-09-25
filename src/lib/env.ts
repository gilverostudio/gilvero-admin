/** Typed access to environment variables, with a clear error when one is missing. */
function required(name: string, value: string | undefined): string {
  if (!value) throw new Error(`Missing environment variable ${name} — see .env.example`);
  return value;
}

export const env = {
  // Referenced literally so Next.js can inline NEXT_PUBLIC_* values into client bundles.
  supabaseUrl: () => required("NEXT_PUBLIC_SUPABASE_URL", process.env.NEXT_PUBLIC_SUPABASE_URL),
  supabaseAnonKey: () => required("NEXT_PUBLIC_SUPABASE_ANON_KEY", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
  websiteUrl: () => process.env.NEXT_PUBLIC_WEBSITE_URL ?? "https://gilvero.com",
  revalidateSecret: () => process.env.WEBSITE_REVALIDATE_SECRET,
};
