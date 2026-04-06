"use client";

import { useState, useMemo, useEffect } from "react";
import {
  useAccount,
  useConfig,
  useReadContract,
  useWriteContract,
} from "wagmi";
import { waitForTransactionReceipt } from "wagmi/actions";
import { base } from "wagmi/chains";

import modalStyles from "@/components/ui/Modal.module.css";
import formStyles from "@/components/ui/Form.module.css";
import buttonStyles from "@/components/ui/Buttons.module.css";
import textStyles from "@/components/ui/Text.module.css";
import StepIndicator from "./StepIndicator";
import TxStatusHint from "./TxStatusHint";
import { CheckIcon, CloseIcon, PlusIcon, MinusIcon } from "./Icons";
import AnimatedNumber from "./AnimatedNumber";
import {
  MEGAPOT_RANDOM_TICKET_BUYER_ADDRESS,
  MEGAPOT_SOURCE_BYTES32,
  USDC_ADDRESS,
  USDC_DECIMALS,
} from "@/lib/constants";
import { buildReferralTxArgs } from "@/lib/megapotReferral";
import { erc20Abi } from "@/lib/abis";
import { megapotRandomTicketBuyerAbi } from "@/lib/megapotV2Abi";

const MAX_LINES = 10;

const STEPS = [
  { id: "tickets", label: "Tickets" },
  { id: "approve", label: "Approve" },
  { id: "buy", label: "Buy" },
  { id: "done", label: "Done" },
];

export default function BuyTicketsModal({
  isOpen,
  onClose,
  usdcBalance,
  usdcBalanceLabel,
  ticketPriceWei,
  bonusballMax: _bonusballMax,
  inviterAddress,
  onSuccess,
}) {
  const { address } = useAccount();
  const config = useConfig();
  const { writeContractAsync, isPending: isWriting } = useWriteContract();

  const [stepIdx, setStepIdx] = useState(0);
  const [ticketCount, setTicketCount] = useState(1);
  const [error, setError] = useState("");
  const [awaitingApproveReceipt, setAwaitingApproveReceipt] = useState(false);
  const [approveTxHash, setApproveTxHash] = useState(null);
  const [awaitingBuyReceipt, setAwaitingBuyReceipt] = useState(false);
  const [buyTxHash, setBuyTxHash] = useState(null);

  const spender = MEGAPOT_RANDOM_TICKET_BUYER_ADDRESS;

  const parsedAmount = useMemo(() => {
    if (!ticketPriceWei || ticketCount < 1) return 0n;
    return ticketPriceWei * BigInt(ticketCount);
  }, [ticketPriceWei, ticketCount]);

  const { data: allowance } = useReadContract({
    chainId: base.id,
    address: USDC_ADDRESS,
    abi: erc20Abi,
    functionName: "allowance",
    args: address ? [address, spender] : undefined,
    query: { enabled: Boolean(address && isOpen) },
  });

  const priceLabel = ticketPriceWei
    ? (Number(ticketPriceWei) / 10 ** USDC_DECIMALS).toFixed(2)
    : "–";

  const totalUsdcLabel = useMemo(() => {
    if (!parsedAmount) return "0.00";
    return (Number(parsedAmount) / 10 ** USDC_DECIMALS).toFixed(2);
  }, [parsedAmount]);

  const maxLines = useMemo(() => {
    if (!usdcBalance || !ticketPriceWei || ticketPriceWei === 0n) {
      return MAX_LINES;
    }
    const per = Number(ticketPriceWei);
    const bal = Number(usdcBalance);
    return Math.min(MAX_LINES, Math.max(1, Math.floor(bal / per)));
  }, [usdcBalance, ticketPriceWei]);

  useEffect(() => {
    if (!isOpen) return;
    setStepIdx(0);
    setTicketCount(1);
    setError("");
  }, [isOpen]);

  const needsApproval = !allowance || allowance < parsedAmount;
  const canContinue =
    ticketCount >= 1 &&
    ticketCount <= maxLines &&
    (!usdcBalance || usdcBalance >= parsedAmount);

  const handleContinue = () => {
    setError("");
    setStepIdx(needsApproval ? 1 : 2);
  };

  const handleApprove = async () => {
    setError("");
    setApproveTxHash(null);
    try {
      const hash = await writeContractAsync({
        chainId: base.id,
        address: USDC_ADDRESS,
        abi: erc20Abi,
        functionName: "approve",
        args: [spender, parsedAmount],
      });
      setApproveTxHash(hash);
      setAwaitingApproveReceipt(true);
      await waitForTransactionReceipt(config, { hash, chainId: base.id });
      setStepIdx(2);
    } catch (err) {
      setError(err?.shortMessage || err?.message || "Approval failed");
    } finally {
      setAwaitingApproveReceipt(false);
      setApproveTxHash(null);
    }
  };

  const handleBuy = async () => {
    setError("");
    setBuyTxHash(null);
    const { referrers, referralSplit } = buildReferralTxArgs(
      address,
      inviterAddress
    );
    try {
      const hash = await writeContractAsync({
        chainId: base.id,
        address: MEGAPOT_RANDOM_TICKET_BUYER_ADDRESS,
        abi: megapotRandomTicketBuyerAbi,
        functionName: "buyTickets",
        args: [
          BigInt(ticketCount),
          address,
          referrers,
          referralSplit,
          MEGAPOT_SOURCE_BYTES32,
        ],
      });
      setBuyTxHash(hash);
      setAwaitingBuyReceipt(true);
      await waitForTransactionReceipt(config, { hash, chainId: base.id });
      setStepIdx(3);
      void Promise.resolve(onSuccess?.());
    } catch (err) {
      setError(err?.shortMessage || err?.message || "Purchase failed");
    } finally {
      setAwaitingBuyReceipt(false);
      setBuyTxHash(null);
    }
  };

  const approveBusy = isWriting || awaitingApproveReceipt;
  const buyBusy = isWriting || awaitingBuyReceipt;

  const handleClose = () => onClose();

  if (!isOpen) return null;

  return (
    <div className={modalStyles.modalOverlay} onClick={handleClose}>
      <div className={modalStyles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={modalStyles.modalHeader}>
          <h3>Buy tickets</h3>
          <button className={modalStyles.modalClose} onClick={handleClose} type="button">
            <CloseIcon size={16} />
          </button>
        </div>

        <StepIndicator steps={STEPS} currentStepIndex={stepIdx} />

        <div className={modalStyles.modalBody}>
          {stepIdx === 0 && (
            <div className={formStyles.stepContent}>
              <h4 className={formStyles.stepTitle}>Quick pick</h4>
              <p className={formStyles.stepDescription}>
                Random lines for the current draw (${priceLabel} each, exact
                price from pool).
              </p>
              <div className={formStyles.ticketSelector}>
                <button
                  type="button"
                  className={formStyles.ticketButton}
                  onClick={() => setTicketCount((c) => Math.max(1, c - 1))}
                  disabled={ticketCount <= 1}
                >
                  <MinusIcon size={16} />
                </button>
                <span className={formStyles.ticketCount}>
                  <AnimatedNumber value={ticketCount} duration={300} />
                </span>
                <button
                  type="button"
                  className={formStyles.ticketButton}
                  onClick={() =>
                    setTicketCount((c) => Math.min(maxLines, c + 1))
                  }
                  disabled={ticketCount >= maxLines}
                >
                  <PlusIcon size={16} />
                </button>
              </div>
              <div className={formStyles.ticketPriceDisplay}>
                <span className={textStyles.muted}>${priceLabel} per line</span>
                <span className={formStyles.ticketTotal}>
                  = ${totalUsdcLabel} USDC
                </span>
              </div>
              <div className={formStyles.balanceHint}>
                <span className={textStyles.muted}>Available: {usdcBalanceLabel}</span>
              </div>
              {error && <div className={formStyles.errorText}>{error}</div>}
              <button
                className={buttonStyles.buttonPrimary}
                onClick={handleContinue}
                disabled={!canContinue}
                type="button"
              >
                Continue
              </button>
            </div>
          )}
          {stepIdx === 1 && (
            <div className={formStyles.stepContent}>
              <h4 className={formStyles.stepTitle}>Approve USDC</h4>
              <p className={formStyles.stepDescription}>
                Allow {totalUsdcLabel} USDC for this purchase.
              </p>
              {isWriting && (
                <p className={formStyles.txPendingHint}>
                  Check your wallet to sign the approval.
                </p>
              )}
              {awaitingApproveReceipt && (
                <TxStatusHint chain={base} hash={approveTxHash} />
              )}
              {error && <div className={formStyles.errorText}>{error}</div>}
              <button
                className={buttonStyles.buttonPrimary}
                onClick={handleApprove}
                disabled={approveBusy}
                type="button"
              >
                {isWriting
                  ? "Confirm in wallet…"
                  : awaitingApproveReceipt
                    ? "Confirming on Base…"
                    : "Approve USDC"}
              </button>
            </div>
          )}
          {stepIdx === 2 && (
            <div className={formStyles.stepContent}>
              <h4 className={formStyles.stepTitle}>Buy tickets</h4>
              <p className={formStyles.stepDescription}>
                Confirm {ticketCount} random line{ticketCount !== 1 ? "s" : ""}.
              </p>
              {isWriting && (
                <p className={formStyles.txPendingHint}>
                  Check your wallet to sign the purchase.
                </p>
              )}
              {awaitingBuyReceipt && (
                <TxStatusHint chain={base} hash={buyTxHash} />
              )}
              {error && <div className={formStyles.errorText}>{error}</div>}
              <button
                className={buttonStyles.buttonPrimary}
                onClick={handleBuy}
                disabled={buyBusy}
                type="button"
              >
                {isWriting
                  ? "Confirm in wallet…"
                  : awaitingBuyReceipt
                    ? "Confirming on Base…"
                    : "Buy tickets"}
              </button>
            </div>
          )}
          {stepIdx === 3 && (
            <div className={formStyles.stepContent}>
              <div className={formStyles.successIcon}>
                <CheckIcon size={32} />
              </div>
              <h4 className={formStyles.stepTitle}>You are in!</h4>
              <p className={formStyles.stepDescription}>
                {ticketCount} line{ticketCount !== 1 ? "s" : ""} entered.
              </p>
              <button
                className={buttonStyles.buttonPrimary}
                onClick={handleClose}
                type="button"
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
