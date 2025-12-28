"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";

export function AuthButtons() {
  const { data } = useSession();

  if (!data?.user) {
    return (
      <div className="flex gap-3">
        <Link href="/signin" className="underline">
          Sign in
        </Link>
        <Link href="/signup" className="underline">
          Sign up
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-muted-foreground">{data.user.email}</span>
      <Button variant="outline" onClick={() => signOut({ callbackUrl: "/" })}>
        Sign out
      </Button>
    </div>
  );
}
