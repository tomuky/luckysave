"use client";

import { useState, useMemo } from "react";
import { parseUnits } from "viem";
import { useAccount, useReadContract, useWriteContract } from "wagmi";
import styles from "@/app/page.module.css";
import StepIndicator from "./StepIndicator";
import { CheckIcon, CloseIcon, PlusIcon, MinusIcon } from "./Icons";
import {
  MEGAPOT_ADDRESS,
  MEGAPOT_REFERRER,
  USDC_ADDRESS,
  USDC_DECIMALS,
} from "@/lib/constants";
import { erc20Abi, megapotAbi } from "@/lib/abis";

const STEPS = [
  { id: "tickets", label: "Tickets" },
  { id: "approve", label: "Approve" },
  { id: "buy", label: "Buy" },
  { id: "done", label: "Done" },
];

const TICKET_PRICE = 1; // $1 per ticket

export default function BuyTicketsModal({
  isOpen,
  onClose,
  usdcBalance,
  usdcBalanceLabel,
  jackpotAmount,
  onSuccess,
}) {
  const { address } = useAccount();
  const { writeContractAsync, isPending: isWriting } = useWriteContract();

  const [currentStep, setCurrentStep] = useState(0);
  const [ticketCount, setTicketCount] = useState(1);
  const [error, setError] = useState("");

  const { data: allowance } = useReadContract({
    address: USDC_ADDRESS,
    abi: erc20Abi,
    functionName: "allowance",
    args: address ? [address, MEGAPOT_ADDRESS] : undefined,
    query: { enabled: Boolean(address) },
  });

  const totalPrice = ticketCount * TICKET_PRICE;
  const parsedAmount = useMemo(() => {
    try {
      return parseUnits(totalPrice.toString(), USDC_DECIMALS);
    } catch {
      return 0n;
    }
  }, [totalPrice]);

  const maxTickets = usdcBalance
    ? Math.floor(Number(usdcBalance) / 10 ** USDC_DECIMALS / TICKET_PRICE)
    : 100;

  // Odds formula from Megapot docs: odds = jackpot / (0.7 × tickets)
  const oddsRatio = jackpotAmount > 0 && ticketCount > 0
    ? Math.round(jackpotAmount / (0.7 * ticketCount))
    : null;
  const oddsLabel = oddsRatio
    ? `1 in ${oddsRatio.toLocaleString()}`
    : null;

  const needsApproval = !allowance || allowance < parsedAmount;
  const canContinue =
    ticketCount > 0 && (!usdcBalance || usdcBalance >= parsedAmount);

  const handleIncrement = () => {
    if (ticketCount < maxTickets) {
      setTicketCount((c) => c + 1);
    }
  };

  const handleDecrement = () => {
    if (ticketCount > 1) {
      setTicketCount((c) => c - 1);
    }
  };

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
        args: [MEGAPOT_ADDRESS, parsedAmount],
      });
      setCurrentStep(2);
    } catch (err) {
      setError(err?.shortMessage || err?.message || "Approval failed");
    }
  };

  const handleBuy = async () => {
    setError("");
    try {
      await writeContractAsync({
        address: MEGAPOT_ADDRESS,
        abi: megapotAbi,
        functionName: "purchaseTickets",
        args: [MEGAPOT_REFERRER, parsedAmount, address],
      });
      setCurrentStep(3);
      onSuccess?.();
    } catch (err) {
      setError(err?.shortMessage || err?.message || "Purchase failed");
    }
  };

  const handleClose = () => {
    setCurrentStep(0);
    setTicketCount(1);
    setError("");
    onClose();
  };

  if (!isOpen) return null;

  const renderStepContent = () => {
    switch (STEPS[currentStep].id) {
      case "tickets":
        return (
          <div className={styles.stepContent}>
            <h4 className={styles.stepTitle}>Select Tickets</h4>
            <div className={styles.ticketSelector}>
              <button
                type="button"
                className={styles.ticketButton}
                onClick={handleDecrement}
                disabled={ticketCount <= 1}
              >
                <MinusIcon size={16} />
              </button>
              <span className={styles.ticketCount}>{ticketCount}</span>
              <button
                type="button"
                className={styles.ticketButton}
                onClick={handleIncrement}
                disabled={ticketCount >= maxTickets}
              >
                <PlusIcon size={16} />
              </button>
            </div>
            <div className={styles.ticketPriceDisplay}>
              <span className={styles.muted}>${TICKET_PRICE} per ticket</span>
              <span className={styles.ticketTotal}>= ${totalPrice} USDC</span>
            </div>
            <div className={styles.balanceHint}>
              <span className={styles.muted}>Available: {usdcBalanceLabel}</span>
            </div>
            {oddsLabel && (
              <div className={styles.oddsDisplay}>
                <span className={styles.muted}>Your odds:</span>
                <span className={styles.oddsValue}>{oddsLabel}</span>
              </div>
            )}
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
              Allow access to ${totalPrice} USDC for ticket purchase.
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

      case "buy":
        return (
          <div className={styles.stepContent}>
            <h4 className={styles.stepTitle}>Buy Tickets</h4>
            <p className={styles.stepDescription}>
              Purchase {ticketCount} ticket{ticketCount !== 1 ? "s" : ""} for $
              {totalPrice}.
            </p>
            {error && <div className={styles.errorText}>{error}</div>}
            <button
              className={styles.buttonPrimary}
              onClick={handleBuy}
              disabled={isWriting}
            >
              {isWriting ? "Buying..." : "Buy Tickets"}
            </button>
          </div>
        );

      case "done":
        return (
          <div className={styles.stepContent}>
            <div className={styles.successIcon}>
              <CheckIcon size={32} />
            </div>
            <h4 className={styles.stepTitle}>You're In!</h4>
            <p className={styles.stepDescription}>
              Successfully purchased {ticketCount} ticket
              {ticketCount !== 1 ? "s" : ""}.
            </p>
            <p className={styles.stepDescriptionMuted}>
              Good luck in the next drawing!
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
          <h3>Buy Lottery Tickets</h3>
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
