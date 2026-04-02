"use client";

import { useEffect, useState } from "react";
import { getAddress, isAddress } from "viem";

const STORAGE_KEY = "luckysave_megapot_inviter";

export default function useReferralInviter() {
  const [inviterAddress, setInviterAddress] = useState(null);

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const ref = params.get("ref");
      if (ref && isAddress(ref)) {
        const a = getAddress(ref);
        sessionStorage.setItem(STORAGE_KEY, a);
        setInviterAddress(a);
        return;
      }
      const stored = sessionStorage.getItem(STORAGE_KEY);
      if (stored && isAddress(stored)) {
        setInviterAddress(getAddress(stored));
      }
    } catch {
      /* ignore */
    }
  }, []);

  return { inviterAddress };
}
