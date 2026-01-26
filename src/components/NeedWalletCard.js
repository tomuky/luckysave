import styles from "@/app/page.module.css";

export default function NeedWalletCard() {
  return (
    <div className={`${styles.card} ${styles.needWalletCard}`}>
      <span className={styles.needWalletText}>
        Need a wallet?{" "}
        <a
          href="https://fastdefi.xyz"
          target="_blank"
          rel="noreferrer"
          className={styles.needWalletLink}
        >
          FastDeFi.xyz
        </a>
      </span>
    </div>
  );
}
