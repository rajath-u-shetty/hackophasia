"use client";

import { signIn, useSession } from "next-auth/react";
import Link from "next/link";
import { Button } from "../ui/button";
import { Skeleton } from "../ui/skeleton";

export function SigninButton() {
  const { data: session, status } = useSession();

  return (
    <>
      {status == "loading" ? (
        <Skeleton className="w-[104px] h-9 shrink-0" />
      ) : (
        <>
          {session ? (
            <Link href="/dashboard">
              <Button variant="default">Dashboard</Button>
            </Link>
          ) : (
            <Button
                  className="dark:bg-white dark:text-black"
                  variant="default" onClick={() => signIn()}>
              Sign In
            </Button>
          )}
        </>
      )}
    </>
  );
}
