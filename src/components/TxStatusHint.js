"use client";

import formStyles from "@/components/ui/Form.module.css";

export function txExplorerHref(chain, hash) {
  if (!hash || !chain?.blockExplorers?.default?.url) return null;
  return `${chain.blockExplorers.default.url}/tx/${hash}`;
}

/** Shown during on-chain confirmation after the wallet has returned a tx hash. */
export default function TxStatusHint({ chain, hash }) {
  const url = txExplorerHref(chain, hash);
  if (!url) return null;
  return (
    <div className={formStyles.txStatusHint}>
      <p className={formStyles.txPendingHint}>
        Hang tight—this usually takes a few seconds.
      </p>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className={formStyles.txExplorerLink}
      >
        View transaction
      </a>
    </div>
  );
}
