import styles from "@/app/page.module.css";
import { ClockIcon, SparkleIcon } from "./Icons";
import AnimatedNumber from "./AnimatedNumber";
import Skeleton from "./Skeleton";

const formatDrawTime = (timestamp) => {
  if (!timestamp) return null;
  const date = new Date(timestamp);
  const timeStr = date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  });
  return timeStr;
};

export default function PlayLotteryCard({
  jackpotLabel,
  entered,
  ticketCount,
  countdown,
  nextDrawAt,
  winningsLabel,
  hasWinnings,
  onBuyTicketsClick,
  onClaimClick,
  isConnected,
  isWriting,
  isLoadingJackpot,
  isLoadingUserData,
  isLoadingCountdown,
}) {
  const drawTimeLabel = formatDrawTime(nextDrawAt);

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <h2>Play Lottery</h2>
        <span className={styles.poweredBy}>
          Powered by{" "}
          <a href="https://docs.megapot.io/" target="_blank" rel="noopener noreferrer">
            Megapot.io
          </a>
        </span>
      </div>

      <div className={styles.heroStat}>
        <span className={styles.heroLabel}>Jackpot</span>
        <span className={styles.heroValueLarge}>
          {isLoadingJackpot ? (
            <Skeleton variant="valueLarge" />
          ) : (
            jackpotLabel
          )}
        </span>
      </div>

      <button
        className={styles.buttonPrimary}
        onClick={onBuyTicketsClick}
        disabled={!isConnected}
      >
        Buy Tickets
      </button>

      <div className={styles.countdownRow}>
        <div className={styles.countdownSection}>
          <div className={styles.countdownLabel}>
            <ClockIcon size={14} className={styles.countdownIcon} />
            <span className={styles.muted}>
              Next Drawing: {drawTimeLabel || "–"}
            </span>
          </div>
          <span className={styles.countdown}>
            {isLoadingCountdown || !countdown ? (
              <Skeleton variant="heading" width="110px" />
            ) : (
              <AnimatedNumber value={countdown} duration={300} />
            )}
          </span>
        </div>
        <span className={styles.entryPill}>
          {isConnected && !isLoadingUserData && (
            <span className={`${styles.pill} ${entered ? "" : styles.warning}`}>
              {entered
                ? `${ticketCount} ticket${ticketCount !== 1 ? "s" : ""} entered`
                : "Not entered"}
            </span>
          )}
        </span>
      </div>

      {hasWinnings ? (
        <div className={styles.winningsAlert}>
          <div className={styles.winningsInfo}>
            <SparkleIcon size={16} className={styles.winningsIcon} />
            <span>
              <strong>{winningsLabel}</strong> to claim
            </span>
          </div>
          <button
            className={styles.buttonSmall}
            onClick={onClaimClick}
            disabled={!isConnected || isWriting}
          >
            Claim
          </button>
        </div>
      ) : (
        <span className={styles.muted}>No winnings to claim</span>
      )}
    </div>
  );
}
