"use client";

import styles from "@/app/page.module.css";
import useWalletHistory from "@/hooks/useWalletHistory";
import { formatTimestamp } from "@/lib/format";
import { BASESCAN_TX_URL } from "@/lib/constants";
import {
  TicketIcon,
  TrophyIcon,
  DepositIcon,
  WithdrawIcon,
  ExternalLinkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@/components/Icons";

const TYPE_ICONS = {
  tickets: TicketIcon,
  claim: TrophyIcon,
  deposit: DepositIcon,
  withdraw: WithdrawIcon,
};

export default function WalletHistoryCard({ address, isConnected }) {
  const {
    transactions,
    page,
    totalPages,
    nextPage,
    prevPage,
    isLoading,
    error,
    timestampMode,
    toggleTimestampMode,
    allTransactions,
  } = useWalletHistory(address);

  const hasTransactions = allTransactions.length > 0;

  return (
    <div className={`${styles.card} ${styles.cardFullWidth}`}>
      <div className={styles.cardHeader}>
        <h2>Wallet History</h2>
      </div>

      {!isConnected ? (
        <p className={styles.muted}>Connect wallet to view history</p>
      ) : isLoading ? (
        <div className={styles.historyLoading}>
          <span className={styles.muted}>Loading transactions...</span>
        </div>
      ) : error ? (
        <p className={styles.muted}>{error}</p>
      ) : !hasTransactions ? (
        <p className={styles.muted}>No app activity yet</p>
      ) : (
        <>
          <div className={styles.historyTableWrapper}>
            <table className={styles.historyTable}>
              <thead>
                <tr>
                  <th>Event</th>
                  <th>Amount</th>
                  <th className={styles.hideOnMobile}>Tx</th>
                  <th
                    className={styles.historyHeaderClickable}
                    onClick={toggleTimestampMode}
                    title="Click to toggle relative/absolute time"
                  >
                    Time
                  </th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => {
                  const Icon = TYPE_ICONS[tx.type] || TicketIcon;
                  const txUrl = `${BASESCAN_TX_URL}/${tx.hash}`;

                  // Full labels for desktop
                  let fullLabel = tx.label;
                  if (tx.type === "tickets" && tx.ticketCount) {
                    fullLabel = `Bought ${tx.ticketCount} ticket${tx.ticketCount !== 1 ? "s" : ""}`;
                  }

                  // Compact labels for mobile
                  let mobileLabel = tx.label;
                  if (tx.type === "tickets" && tx.ticketCount) {
                    mobileLabel = `${tx.ticketCount} ticket${tx.ticketCount !== 1 ? "s" : ""}`;
                  } else if (tx.type === "claim") {
                    mobileLabel = "Claimed";
                  } else if (tx.type === "deposit") {
                    mobileLabel = "Deposit";
                  } else if (tx.type === "withdraw") {
                    mobileLabel = "Withdraw";
                  }

                  return (
                    <tr key={tx.hash}>
                      <td>
                        <a
                          href={txUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.historyEventLink}
                        >
                          <Icon size={16} className={styles.historyIcon} />
                          <span className={styles.hideOnMobile}>{fullLabel}</span>
                          <span className={styles.showOnMobile}>{mobileLabel}</span>
                        </a>
                      </td>
                      <td>
                        {tx.amount !== null
                          ? `${tx.amount.toFixed(2)} USDC`
                          : "--"}
                      </td>
                      <td className={styles.hideOnMobile}>
                        <a
                          href={txUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.historyTxLink}
                          title="View on Basescan"
                        >
                          <ExternalLinkIcon size={14} />
                        </a>
                      </td>
                      <td>
                        <span className={styles.hideOnMobile}>
                          {formatTimestamp(tx.timestamp, timestampMode, false)}
                        </span>
                        <span className={styles.showOnMobile}>
                          {formatTimestamp(tx.timestamp, timestampMode, true)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className={styles.historyPagination}>
              <button
                className={styles.paginationButton}
                onClick={prevPage}
                disabled={page === 0}
                aria-label="Previous page"
              >
                <ChevronLeftIcon size={16} />
              </button>
              <span className={styles.paginationInfo}>
                {page + 1} of {totalPages}
              </span>
              <button
                className={styles.paginationButton}
                onClick={nextPage}
                disabled={page >= totalPages - 1}
                aria-label="Next page"
              >
                <ChevronRightIcon size={16} />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
