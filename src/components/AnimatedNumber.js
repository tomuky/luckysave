"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./AnimatedNumber.module.css";

/**
 * AnimatedNumber - A slot-machine style animated counter
 * Animates individual digits sliding up/down when values change
 */
export default function AnimatedNumber({
  value,
  className = "",
  prefix = "",
  suffix = "",
  duration = 400,
}) {
  const valueStr = String(value);
  const prevValueRef = useRef(valueStr);
  const [digits, setDigits] = useState(() =>
    valueStr.split("").map((d, i) => ({
      key: i,
      value: d,
      prev: d,
      direction: "none",
    }))
  );

  useEffect(() => {
    const prevStr = prevValueRef.current;
    const newStr = valueStr;

    if (prevStr === newStr) return;

    // Determine if we're going up or down (for animation direction)
    const prevNum = parseFloat(prevStr.replace(/[^0-9.-]/g, "")) || 0;
    const newNum = parseFloat(newStr.replace(/[^0-9.-]/g, "")) || 0;
    const direction = newNum > prevNum ? "up" : "down";

    // Pad the shorter string to align digits from the right
    const maxLen = Math.max(prevStr.length, newStr.length);
    const paddedPrev = prevStr.padStart(maxLen, " ");
    const paddedNew = newStr.padStart(maxLen, " ");

    // Create digit objects with animation state
    const newDigits = paddedNew.split("").map((char, i) => {
      const prevChar = paddedPrev[i] || " ";
      const changed = char !== prevChar;

      return {
        key: `${i}-${Date.now()}`, // Force re-render for animation
        value: char,
        prev: prevChar,
        direction: changed ? direction : "none",
      };
    });

    setDigits(newDigits);
    prevValueRef.current = newStr;
  }, [valueStr]);

  return (
    <span
      className={`${styles.animatedNumber} ${className}`}
      style={{ "--animation-duration": `${duration}ms` }}
    >
      {prefix && <span className={styles.static}>{prefix}</span>}
      <span className={styles.digits}>
        {digits.map((digit) => (
          <AnimatedDigit
            key={digit.key}
            value={digit.value}
            prev={digit.prev}
            direction={digit.direction}
          />
        ))}
      </span>
      {suffix && <span className={styles.static}>{suffix}</span>}
    </span>
  );
}

function AnimatedDigit({ value, prev, direction }) {
  const isAnimating = direction !== "none";

  // For non-numeric characters (spaces, commas, etc.), don't animate
  if (!/[0-9]/.test(value) && !/[0-9]/.test(prev)) {
    return <span className={styles.digit}>{value}</span>;
  }

  if (!isAnimating) {
    return <span className={styles.digit}>{value}</span>;
  }

  return (
    <span className={styles.digitWrapper}>
      <span
        className={`${styles.digitInner} ${
          direction === "up" ? styles.slideUp : styles.slideDown
        }`}
      >
        <span className={styles.digitPrev}>{prev}</span>
        <span className={styles.digitCurrent}>{value}</span>
      </span>
    </span>
  );
}
