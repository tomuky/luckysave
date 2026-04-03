"use client";

import cardStyles from "@/components/ui/Card.module.css";
import buttonStyles from "@/components/ui/Buttons.module.css";
import styles from "./PlayLotteryCard.module.css";
import { formatDrawWallClock } from "@/lib/format";
import Skeleton from "./Skeleton";
import AnimatedNumber from "./AnimatedNumber";
import { ClockIcon } from "./Icons";

export default function PlayLotteryCard({
  jackpotLabel,
  onBuyTicketsClick,
  onHowToWinClick,
  isConnected,
  isLoadingJackpot,
  countdown,
  nextDrawAt,
  isLoadingCountdown,
}) {
  const drawTimeLabel = formatDrawWallClock(nextDrawAt);
  const showAnimatedCountdown =
    Boolean(countdown) && countdown !== "Drawing…" && countdown.includes(":");

  return (
    <div className={cardStyles.card}>
      <div className={cardStyles.cardHeader}>
        <h2>Play Lottery</h2>
        <span className={cardStyles.poweredBy}>
          Powered by{" "}
          <a
            href="https://docs.megapot.io/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Megapot.io
          </a>
        </span>
      </div>

      <div className={styles.heroStat}>
        <div className={styles.heroLabelRow}>
          <span className={styles.heroLabel}>Jackpot</span>
          <button
            type="button"
            className={styles.howToWinLink}
            onClick={onHowToWinClick}
          >
            How to win
          </button>
        </div>
        <span className={styles.heroValueLarge}>
          {isLoadingJackpot ? (
            <Skeleton variant="valueLarge" />
          ) : (
            jackpotLabel
          )}
        </span>
      </div>

      <div className={styles.playLotteryCtaRow}>
        <button
          className={buttonStyles.buttonPrimary}
          onClick={onBuyTicketsClick}
          disabled={!isConnected}
          type="button"
        >
          Buy Tickets
        </button>
        <div
          className={styles.playLotteryCountdown}
          aria-live="polite"
          aria-label={
            drawTimeLabel
              ? `Time until next drawing, scheduled ${drawTimeLabel}`
              : "Time until next drawing"
          }
        >
          <div className={styles.playLotteryCountdownLabel}>
            <ClockIcon size={14} className={styles.countdownIcon} />
            <span>
              Next draw{drawTimeLabel ? ` · ${drawTimeLabel}` : ""}
            </span>
          </div>
          <div className={styles.playLotteryCountdownValue}>
            {isLoadingCountdown ? (
              <Skeleton
                variant="heading"
                width="88px"
                height="28px"
                className={styles.playLotteryCountdownSkeleton}
              />
            ) : showAnimatedCountdown ? (
              <span className={styles.playLotteryCountdownDigits}>
                <AnimatedNumber value={countdown} duration={300} />
              </span>
            ) : (
              <span className={styles.playLotteryCountdownDigits}>
                {countdown ?? "–"}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
