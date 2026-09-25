import type { Metadata } from "next";
import Image from "next/image";
import { redirect } from "next/navigation";

import { getAdmin } from "@/lib/auth";

import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in" };

const ERRORS: Record<string, string> = {
  "no-access": "This account doesn't have admin access.",
};

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  if (await getAdmin()) redirect("/");

  const params = await searchParams;
  const next = typeof params.next === "string" ? params.next : "/";
  const errorKey = typeof params.error === "string" ? params.error : "";

  return (
    <main className="grid min-h-svh lg:grid-cols-[1.15fr_1fr]">
      {/* Visual */}
      <section className="relative hidden overflow-hidden lg:block">
        <Image
          src="/login.jpg"
          alt=""
          fill
          preload
          sizes="60vw"
          className="scale-105 object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-background/20" />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent to-background/80" />
        <div className="pointer-events-none absolute -bottom-40 left-1/3 size-[40rem] rounded-full bg-primary/10 blur-[160px]" />
        <div className="relative flex h-full flex-col justify-between p-12 xl:p-16">
          <span className="font-display text-lg tracking-[0.42em]">GILVERO</span>
          <div className="reveal max-w-lg">
            <p className="eyebrow">Studio Admin</p>
            <h1 className="mt-6 text-5xl leading-[1] xl:text-6xl">
              Capture. Create.
              <br />
              <span className="gold-text">Inspire.</span>
            </h1>
            <p className="mt-6 text-base leading-relaxed text-muted-foreground">
              Everything on gilvero.com — the work, the words and the frames — managed from one place.
            </p>
          </div>
        </div>
      </section>

      {/* Form */}
      <section className="gold-wash relative flex items-center justify-center px-5 py-16 sm:px-10">
        <div className="reveal w-full max-w-sm">
          <span className="font-display text-base tracking-[0.42em] lg:hidden">GILVERO</span>
          <p className="eyebrow mt-10 lg:mt-0">Welcome back</p>
          <h2 className="mt-4 text-3xl">Sign in to the studio</h2>
          <p className="mt-3 text-sm text-muted-foreground">Use the admin account issued to you.</p>

          <div className="glass mt-10 rounded-[1.75rem] p-7 sm:p-8">
            <LoginForm next={next} initialError={ERRORS[errorKey] ?? null} />
          </div>

          <p className="mt-8 text-center text-xs text-muted-foreground/70">
            Trouble signing in? Ask the studio owner to reset your access.
          </p>
        </div>
      </section>
    </main>
  );
}
