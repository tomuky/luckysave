import styles from "@/app/page.module.css";

/**
 * Skeleton loader component with shimmer animation.
 * Use for elegant loading states that match the content layout.
 *
 * @param {string} variant - "text" | "heading" | "value" | "pill" | "row"
 * @param {string} width - CSS width (e.g., "100px", "80%")
 * @param {string} height - CSS height override
 * @param {string} className - Additional CSS class
 */
export default function Skeleton({
  variant = "text",
  width,
  height,
  className = "",
}) {
  const variantClass = {
    text: styles.skeletonText,
    heading: styles.skeletonHeading,
    value: styles.skeletonValue,
    valueLarge: styles.skeletonValueLarge,
    pill: styles.skeletonPill,
    row: styles.skeletonRow,
    balance: styles.skeletonBalance,
  }[variant] || styles.skeletonText;

  const style = {};
  if (width) style.width = width;
  if (height) style.height = height;

  return (
    <span
      className={`${styles.skeleton} ${variantClass} ${className}`}
      style={style}
    />
  );
}

/**
 * Skeleton row for table loading states
 */
export function SkeletonTableRow({ columns = 4 }) {
  return (
    <tr className={styles.skeletonTableRow}>
      <td>
        <div className={styles.skeletonEvent}>
          <Skeleton variant="pill" width="20px" height="20px" />
          <Skeleton variant="text" width="100px" />
        </div>
      </td>
      <td>
        <Skeleton variant="text" width="70px" />
      </td>
      {columns >= 3 && (
        <td className={styles.hideOnMobile}>
          <Skeleton variant="pill" width="28px" height="28px" />
        </td>
      )}
      <td>
        <Skeleton variant="text" width="60px" />
      </td>
    </tr>
  );
}
