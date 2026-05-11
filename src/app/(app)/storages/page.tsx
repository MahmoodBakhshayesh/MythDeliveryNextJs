"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/** @deprecated Use `/distribution-centers`. Kept for bookmarks and Next typed routes cache. */
export default function StoragesRedirectPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/distribution-centers");
  }, [router]);
  return null;
}
