"use client";

import styles from "@/app/page.module.css";

export default function LotteryBalls({
  normals,
  bonusball,
  pending = false,
  normalMatch = null,
  bonusMatch = null,
}) {
  const nums = normals?.length === 5 ? normals : [null, null, null, null, null];

  return (
    <div className={styles.lotteryBallsRow}>
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
