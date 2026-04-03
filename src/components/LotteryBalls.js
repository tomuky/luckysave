"use client";

import styles from "./LotteryBalls.module.css";

export default function LotteryBalls({
  normals,
  bonusball,
  pending = false,
  normalMatch = null,
  bonusMatch = null,
  placeholders = false,
  inPanel = false,
}) {
  const rowClass = inPanel
    ? `${styles.lotteryBallsRow} ${styles.rowInPanel}`
    : styles.lotteryBallsRow;

  if (placeholders) {
    return (
      <div className={rowClass}>
        {[0, 1, 2, 3, 4].map((i) => (
          <span
            key={i}
            className={`${styles.lotteryBall} ${styles.lotteryBallAwaiting} ${styles.lotteryBallMystery}`}
          >
            ?
          </span>
        ))}
        <span
          className={`${styles.lotteryBall} ${styles.lotteryBallBonus} ${styles.lotteryBallAwaiting} ${styles.lotteryBallMystery}`}
        >
          ?
        </span>
      </div>
    );
  }

  const nums = normals?.length === 5 ? normals : [null, null, null, null, null];

  return (
    <div className={rowClass}>
      {nums.map((n, i) => (
        <span
          key={i}
          className={`${styles.lotteryBall} ${
            pending ? styles.lotteryBallAwaiting : ""
          } ${normalMatch?.[i] ? styles.lotteryBallMatch : ""}`}
        >
          {n ?? "–"}
        </span>
      ))}
      <span
        className={`${styles.lotteryBall} ${styles.lotteryBallBonus} ${
          pending ? styles.lotteryBallAwaiting : ""
        } ${bonusMatch ? styles.lotteryBallMatch : ""}`}
      >
        {bonusball ?? "–"}
      </span>
    </div>
  );
}
