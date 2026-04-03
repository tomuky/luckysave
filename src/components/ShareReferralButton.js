"use client";

import { useState, useCallback } from "react";
import styles from "./ShareReferralButton.module.css";

export default function ShareReferralButton({
  address,
  disabled,
  className,
  variant = "header",
}) {
  const [done, setDone] = useState(false);

  const onClick = useCallback(async () => {
    if (!address || disabled) return;
    const origin =
      typeof window !== "undefined" ? window.location.origin : "";
    const link = `${origin}/?ref=${address}`;
    try {
      await navigator.clipboard.writeText(link);
      setDone(true);
      setTimeout(() => setDone(false), 2500);
    } catch {
      window.prompt("Copy your link:", link);
    }
  }, [address, disabled]);

  const cls =
    variant === "header"
      ? styles.shareReferralHeader
      : styles.shareReferralModal;

  return (
    <button
      type="button"
      className={`${cls} ${className || ""}`}
      onClick={onClick}
      disabled={disabled || !address}
    >
      {done ? "Copied!" : "Invite friends"}
    </button>
  );
}
