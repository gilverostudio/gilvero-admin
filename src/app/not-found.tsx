import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="gold-wash flex min-h-svh flex-col items-center justify-center px-5 text-center">
      <p className="eyebrow">Error 404</p>
      <h1 className="mt-5 text-4xl sm:text-5xl">This frame doesn&apos;t exist.</h1>
      <p className="mt-4 text-muted-foreground">The page you&apos;re after isn&apos;t part of the admin.</p>
      <Button asChild className="mt-10">
        <Link href="/">Back to dashboard</Link>
      </Button>
    </main>
  );
}
