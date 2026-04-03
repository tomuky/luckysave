"use client";

import styles from "./LotteryBalls.module.css";

export default function LotteryBalls({
  normals,
  bonusball,
  pending = false,
  normalMatch = null,
  bonusMatch = null,
  bonusComparable = false,
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

  const compareResults =
    !pending && Array.isArray(normalMatch) && normalMatch.length === 5;

  const normalClassForIndex = (i) => {
    if (pending) return styles.lotteryBallAwaiting;
    if (!compareResults) return "";
    return normalMatch[i]
      ? styles.lotteryBallMatch
      : styles.lotteryBallMiss;
  };

  const bonusExtraClass = () => {
    if (pending) return styles.lotteryBallAwaiting;
    if (!compareResults) {
      return bonusMatch ? styles.lotteryBallMatch : "";
    }
    if (bonusComparable) {
      return bonusMatch ? styles.lotteryBallMatch : styles.lotteryBallMiss;
    }
    return bonusMatch ? styles.lotteryBallMatch : "";
  };

  return (
    <div className={rowClass}>
      {nums.map((n, i) => (
        <span
          key={i}
          className={`${styles.lotteryBall} ${normalClassForIndex(i)}`}
        >
          {n ?? "–"}
        </span>
      ))}
      <span
        className={`${styles.lotteryBall} ${styles.lotteryBallBonus} ${bonusExtraClass()}`}
      >
        {bonusball ?? "–"}
      </span>
    </div>
  );
}
