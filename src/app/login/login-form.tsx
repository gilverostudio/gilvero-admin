"use client";

import { ArrowRight, Eye, EyeOff, LoaderCircle } from "lucide-react";
import { useActionState, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { signIn, type SignInState } from "./actions";

type LoginFormProps = { next: string; initialError: string | null };

export function LoginForm({ next, initialError }: LoginFormProps) {
  const [state, action, pending] = useActionState<SignInState, FormData>(signIn, {
    error: initialError,
    email: "",
  });
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="next" value={next} />

      <div className="space-y-2">
        <Label htmlFor="email" className="text-xs tracking-wide text-muted-foreground">
          Email
        </Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          defaultValue={state.email}
          placeholder="you@gilvero.com"
          required
          className="h-12 px-5"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password" className="text-xs tracking-wide text-muted-foreground">
          Password
        </Label>
        <div className="relative">
          <Input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            required
            className="h-12 px-5 pr-12"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="absolute inset-y-0 right-0 flex w-12 cursor-pointer items-center justify-center text-muted-foreground transition-colors hover:text-primary"
          >
            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
      </div>

      {state.error ? (
        <p role="alert" className="rounded-2xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive-foreground">
          {state.error}
        </p>
      ) : null}

      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? <LoaderCircle className="animate-spin" /> : null}
        {pending ? "Signing in…" : "Sign in"}
        {pending ? null : <ArrowRight />}
      </Button>
    </form>
  );
}
