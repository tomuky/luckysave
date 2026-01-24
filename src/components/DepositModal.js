"use client";

import { useState, useMemo } from "react";
import { parseUnits } from "viem";
import { useAccount, useReadContract, useWriteContract } from "wagmi";
import styles from "@/app/page.module.css";
import StepIndicator from "./StepIndicator";
import { CheckIcon, CloseIcon } from "./Icons";
import {
  AAVE_POOL_ADDRESS,
  USDC_ADDRESS,
  USDC_DECIMALS,
} from "@/lib/constants";
import { erc20Abi, aavePoolAbi } from "@/lib/abis";

const STEPS = [
  { id: "amount", label: "Amount" },
  { id: "approve", label: "Approve" },
  { id: "deposit", label: "Deposit" },
  { id: "done", label: "Done" },
];

export default function DepositModal({
  isOpen,
  onClose,
  usdcBalance,
  usdcBalanceLabel,
  apyLabel,
  onSuccess,
}) {
  const { address } = useAccount();
  const { writeContractAsync, isPending: isWriting } = useWriteContract();

  const [currentStep, setCurrentStep] = useState(0);
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");

  const { data: allowance } = useReadContract({
    address: USDC_ADDRESS,
    abi: erc20Abi,
    functionName: "allowance",
    args: address ? [address, AAVE_POOL_ADDRESS] : undefined,
    query: { enabled: Boolean(address) },
  });

  const normalizeInput = (value) => {
    const cleaned = value.replace(/[^\d.]/g, "");
    if (!cleaned) return "";
    const dotIndex = cleaned.indexOf(".");
    if (dotIndex === -1) {
      return cleaned.replace(/^0+(?=\d)/, "0");
    }
    const whole = cleaned.slice(0, dotIndex).replace(/^0+(?=\d)/, "0");
    const fraction = cleaned.slice(dotIndex + 1).replace(/\./g, "");
    return `${whole || "0"}.${fraction.slice(0, USDC_DECIMALS)}`;
  };

  const parsedAmount = useMemo(() => {
    const sanitized = amount?.endsWith(".") ? amount.slice(0, -1) : amount;
    try {
      return parseUnits(sanitized || "0", USDC_DECIMALS);
    } catch {
      return 0n;
    }
  }, [amount]);

  const needsApproval = !allowance || allowance < parsedAmount;
  const canContinue =
    parsedAmount > 0n && (!usdcBalance || usdcBalance >= parsedAmount);

  const handleContinue = () => {
    if (!canContinue) return;
    setError("");
    // Skip approve step if already approved
    setCurrentStep(needsApproval ? 1 : 2);
  };

  const handleApprove = async () => {
    setError("");
    try {
      await writeContractAsync({
        address: USDC_ADDRESS,
        abi: erc20Abi,
        functionName: "approve",
        args: [AAVE_POOL_ADDRESS, parsedAmount],
      });
      setCurrentStep(2);
    } catch (err) {
      setError(err?.shortMessage || err?.message || "Approval failed");
    }
  };

  const handleDeposit = async () => {
    setError("");
    try {
      await writeContractAsync({
        address: AAVE_POOL_ADDRESS,
        abi: aavePoolAbi,
        functionName: "supply",
        args: [USDC_ADDRESS, parsedAmount, address, 0],
      });
      setCurrentStep(3);
      onSuccess?.();
    } catch (err) {
      setError(err?.shortMessage || err?.message || "Deposit failed");
    }
  };

  const handleClose = () => {
    setCurrentStep(0);
    setAmount("");
    setError("");
    onClose();
  };

  if (!isOpen) return null;

  const renderStepContent = () => {
    switch (STEPS[currentStep].id) {
      case "amount":
        return (
          <div className={styles.stepContent}>
            <h4 className={styles.stepTitle}>Enter Amount</h4>
            <label className={styles.inputRow}>
              <input
                value={amount}
                onChange={(e) => setAmount(normalizeInput(e.target.value))}
                placeholder="0.00"
                inputMode="decimal"
                autoFocus
              />
              <span className={styles.muted}>USDC</span>
            </label>
            <div className={styles.balanceHint}>
              <span className={styles.muted}>Available: {usdcBalanceLabel}</span>
              <button
                type="button"
                className={styles.maxButton}
                onClick={() =>
                  usdcBalance &&
                  setAmount((Number(usdcBalance) / 10 ** USDC_DECIMALS).toString())
                }
              >
                Max
              </button>
            </div>
            {error && <div className={styles.errorText}>{error}</div>}
            <button
              className={styles.buttonPrimary}
              onClick={handleContinue}
              disabled={!canContinue}
            >
              Continue
            </button>
          </div>
        );

      case "approve":
        return (
          <div className={styles.stepContent}>
            <h4 className={styles.stepTitle}>Approve USDC</h4>
            <p className={styles.stepDescription}>
              Allow access to {amount} USDC for this deposit.
            </p>
            {error && <div className={styles.errorText}>{error}</div>}
            <button
              className={styles.buttonPrimary}
              onClick={handleApprove}
              disabled={isWriting}
            >
              {isWriting ? "Approving..." : "Approve USDC"}
            </button>
          </div>
        );

      case "deposit":
        return (
          <div className={styles.stepContent}>
            <h4 className={styles.stepTitle}>Deposit USDC</h4>
            <p className={styles.stepDescription}>
              Deposit {amount} USDC to start earning {apyLabel} APY.
            </p>
            {error && <div className={styles.errorText}>{error}</div>}
            <button
              className={styles.buttonPrimary}
              onClick={handleDeposit}
              disabled={isWriting}
            >
              {isWriting ? "Depositing..." : "Deposit USDC"}
            </button>
          </div>
        );

      case "done":
        return (
          <div className={styles.stepContent}>
            <div className={styles.successIcon}>
              <CheckIcon size={32} />
            </div>
            <h4 className={styles.stepTitle}>Successfully Deposited</h4>
            <p className={styles.stepDescription}>
              {amount} USDC is now earning {apyLabel} APY.
            </p>
            <button className={styles.buttonPrimary} onClick={handleClose}>
              Done
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={handleClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3>Deposit USDC</h3>
          <button
            className={styles.modalClose}
            onClick={handleClose}
            type="button"
          >
            <CloseIcon size={16} />
          </button>
        </div>

        <StepIndicator steps={STEPS} currentStepIndex={currentStep} />

        <div className={styles.modalBody}>{renderStepContent()}</div>
      </div>
    </div>
  );
}
