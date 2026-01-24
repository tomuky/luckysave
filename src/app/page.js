"use client";

import { useEffect, useMemo, useState } from "react";
import { formatUnits, parseUnits } from "viem";
import {
  useAccount,
  useConnect,
  useDisconnect,
  useSwitchChain,
  useReadContract,
  useWriteContract,
} from "wagmi";
import { base, baseSepolia, sepolia } from "wagmi/chains";

import styles from "./page.module.css";
import useAppStore from "@/store/useAppStore";
import Header from "@/components/Header";
import WalletModal from "@/components/WalletModal";
import BalancesCard from "@/components/BalancesCard";
import DepositCard from "@/components/DepositCard";
import MegapotCard from "@/components/MegapotCard";
import {
  AAVE_POOL_ADDRESS,
  AAVE_USDC_ATOKEN,
  BASE_CHAIN_ID,
  MEGAPOT_ADDRESS,
  MEGAPOT_REFERRER,
  USDC_ADDRESS,
  USDC_DECIMALS,
} from "@/lib/constants";
import { aavePoolAbi, erc20Abi, megapotAbi } from "@/lib/abis";
import { currency, formatApy } from "@/lib/format";
import useNextDrawCountdown from "@/hooks/useNextDrawCountdown";
import useWalletLabel from "@/hooks/useWalletLabel";

export default function Home() {
  const { address, isConnected, chainId } = useAccount();
  const { connectors, connect, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChainAsync, isPending: isSwitching } = useSwitchChain();
  const { writeContractAsync, isPending: isWriting } = useWriteContract();
  const entered = useAppStore((state) => state.entered);
  const lastResult = useAppStore((state) => state.lastResult);
  const setEntered = useAppStore((state) => state.setEntered);
  const setLastResult = useAppStore((state) => state.setLastResult);

  const [depositAmount, setDepositAmount] = useState("");
  const [entryAmount, setEntryAmount] = useState("");
  const [depositStatus, setDepositStatus] = useState("");
  const [megapotStatus, setMegapotStatus] = useState("");
  const [walletOpen, setWalletOpen] = useState(false);
  const countdown = useNextDrawCountdown();

  const connector = connectors[0];
  const isReadyForActions = Boolean(isConnected && address);
  const isOnBase = chainId === BASE_CHAIN_ID;
  const walletLabel = useWalletLabel(address);
  const currentChainName =
    chainId === base.id
      ? base.name
      : chainId === baseSepolia.id
      ? baseSepolia.name
      : chainId === sepolia.id
      ? sepolia.name
      : chainId
      ? `Chain ${chainId}`
      : "Unknown network";

  const normalizeAmountInput = (value) => {
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

  const safeParseUnits = (value) => {
    const sanitized = value?.endsWith(".") ? value.slice(0, -1) : value;
    try {
      return parseUnits(sanitized || "0", USDC_DECIMALS);
    } catch (error) {
      return 0n;
    }
  };

  const parsedDeposit = useMemo(
    () => safeParseUnits(depositAmount),
    [depositAmount]
  );
  const parsedEntry = useMemo(() => safeParseUnits(entryAmount), [entryAmount]);

  const { data: usdcBalance } = useReadContract({
    address: USDC_ADDRESS,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: Boolean(address) },
  });
  const { data: aTokenBalance } = useReadContract({
    address: AAVE_USDC_ATOKEN,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: Boolean(address && AAVE_USDC_ATOKEN) },
  });
  const { data: usdcAllowance } = useReadContract({
    address: USDC_ADDRESS,
    abi: erc20Abi,
    functionName: "allowance",
    args: address ? [address, AAVE_POOL_ADDRESS] : undefined,
    query: { enabled: Boolean(address) },
  });
  const { data: megapotAllowance } = useReadContract({
    address: USDC_ADDRESS,
    abi: erc20Abi,
    functionName: "allowance",
    args: address ? [address, MEGAPOT_ADDRESS] : undefined,
    query: { enabled: Boolean(address) },
  });
  const { data: usersInfo } = useReadContract({
    address: MEGAPOT_ADDRESS,
    abi: megapotAbi,
    functionName: "usersInfo",
    args: address ? [address] : undefined,
    query: { enabled: Boolean(address && isOnBase) },
  });
  const { data: reserveData } = useReadContract({
    address: AAVE_POOL_ADDRESS,
    abi: aavePoolAbi,
    functionName: "getReserveData",
    args: [USDC_ADDRESS],
    query: { enabled: true },
  });

  // Sync entered state and winnings from on-chain usersInfo
  useEffect(() => {
    if (!usersInfo) return;

    const [, winningsClaimable, active] = usersInfo;

    // Sync "entered" pill with on-chain active status for current round
    setEntered(active);

    // Format winnings for display
    if (winningsClaimable > 0n) {
      const formatted = currency.format(
        Number(formatUnits(winningsClaimable, USDC_DECIMALS))
      );
      setLastResult(`${formatted} to claim!`);
    } else {
      setLastResult("No wins to claim");
    }
  }, [usersInfo, setEntered, setLastResult]);

  const usdcBalanceNum = Number(formatUnits(usdcBalance || 0n, USDC_DECIMALS));
  const aTokenBalanceNum = Number(formatUnits(aTokenBalance || 0n, USDC_DECIMALS));
  const totalValueNum = usdcBalanceNum + aTokenBalanceNum;

  const usdcBalanceLabel = address ? currency.format(usdcBalanceNum) : "--";
  const depositedLabel = address ? currency.format(aTokenBalanceNum) : "--";
  const totalValueLabel = address ? currency.format(totalValueNum) : "--";

  // Extract current liquidity rate (APY) from reserve data
  const currentLiquidityRate = reserveData?.currentLiquidityRate;
  const supplyApyLabel = formatApy(currentLiquidityRate);

  const hasUsdcBalance = typeof usdcBalance === "bigint";
  const hasATokenBalance = typeof aTokenBalance === "bigint";
  const hasParsedDeposit = parsedDeposit > 0n;
  const hasParsedEntry = parsedEntry > 0n;
  const canDeposit =
    isReadyForActions &&
    hasParsedDeposit &&
    (!hasUsdcBalance || usdcBalance >= parsedDeposit);
  const canWithdraw =
    isReadyForActions &&
    hasParsedDeposit &&
    (!hasATokenBalance || aTokenBalance >= parsedDeposit);
  const canEnterMegapot =
    isReadyForActions &&
    hasParsedEntry &&
    (!hasUsdcBalance || usdcBalance >= parsedEntry);

  const formatTxError = (error) => {
    if (!error) return "Unknown error.";
    if (typeof error === "string") return error;
    if (error.shortMessage) return error.shortMessage;
    if (error.message) return error.message;
    return "Transaction failed.";
  };

  const handleApproveAndDeposit = async () => {
    if (!address || !hasParsedDeposit) return;
    setDepositStatus("Approving & depositing...");
    try {
      const amount = parsedDeposit;
      if (!usdcAllowance || usdcAllowance < amount) {
        await writeContractAsync({
          address: USDC_ADDRESS,
          abi: erc20Abi,
          functionName: "approve",
          args: [AAVE_POOL_ADDRESS, amount],
        });
      }
      await writeContractAsync({
        address: AAVE_POOL_ADDRESS,
        abi: aavePoolAbi,
        functionName: "supply",
        args: [USDC_ADDRESS, amount, address, 0],
      });
      setDepositStatus("Deposit submitted.");
    } catch (error) {
      setDepositStatus(formatTxError(error));
    }
  };

  const handleWithdraw = async () => {
    if (!address || !hasParsedDeposit) return;
    setDepositStatus("Withdrawing USDC from Aave...");
    try {
      await writeContractAsync({
        address: AAVE_POOL_ADDRESS,
        abi: aavePoolAbi,
        functionName: "withdraw",
        args: [USDC_ADDRESS, parsedDeposit, address],
      });
      setDepositStatus("Withdraw submitted.");
    } catch (error) {
      setDepositStatus(formatTxError(error));
    }
  };

  const handleEnterMegapot = async () => {
    if (!address || !hasParsedEntry) return;
    setMegapotStatus("Entering Megapot...");
    try {
      if (!megapotAllowance || megapotAllowance < parsedEntry) {
        await writeContractAsync({
          address: USDC_ADDRESS,
          abi: erc20Abi,
          functionName: "approve",
          args: [MEGAPOT_ADDRESS, parsedEntry],
        });
      }
      await writeContractAsync({
        address: MEGAPOT_ADDRESS,
        abi: megapotAbi,
        functionName: "purchaseTickets",
        args: [MEGAPOT_REFERRER, parsedEntry, address],
      });
      setMegapotStatus("Entry submitted.");
      setEntered(true);
      // Last result continues showing previous round's result (won/lost)
      // The approval we just did (if any) will be detected on next render
    } catch (error) {
      setMegapotStatus(formatTxError(error));
      // Don't change entered state on failure - the error message is shown in status
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.shell}>
        <Header
          isConnected={isConnected}
          walletLabel={walletLabel}
          walletBalanceLabel={usdcBalanceLabel}
          isOnBase={isOnBase}
          currentChainName={currentChainName}
          baseChainName={base.name}
          isSwitching={isSwitching}
          onSwitchChain={() => switchChainAsync?.({ chainId: BASE_CHAIN_ID })}
          onWalletClick={() => setWalletOpen(true)}
        />

        <section className={styles.grid}>
          <BalancesCard
            usdcBalanceLabel={usdcBalanceLabel}
            depositedLabel={depositedLabel}
            totalValueLabel={totalValueLabel}
            supplyApyLabel={supplyApyLabel}
          />
          <DepositCard
            depositAmount={depositAmount}
            onDepositAmountChange={(value) =>
              setDepositAmount(normalizeAmountInput(value))
            }
            onApproveAndDeposit={handleApproveAndDeposit}
            onSwitchChain={() => switchChainAsync?.({ chainId: BASE_CHAIN_ID })}
            onWithdraw={handleWithdraw}
            status={depositStatus}
            canDeposit={canDeposit}
            canWithdraw={canWithdraw}
            isOnBase={isOnBase}
            isSwitching={isSwitching}
            isWriting={isWriting}
          />
          <MegapotCard
            entryAmount={entryAmount}
            onEntryAmountChange={(value) =>
              setEntryAmount(normalizeAmountInput(value))
            }
            countdown={countdown}
            entered={entered}
            lastResult={lastResult}
            onEnter={handleEnterMegapot}
            status={megapotStatus}
            canEnter={canEnterMegapot}
            isWriting={isWriting}
          />
        </section>

        <footer className={styles.footer}>
          Need a wallet?{" "}
          <a href="https://fastdefi.xyz" target="_blank" rel="noreferrer">
            FastDeFi.xyz
          </a>
        </footer>
      </div>

      {walletOpen && (
        <WalletModal
          isConnected={isConnected}
          walletLabel={walletLabel}
          isOnBase={isOnBase}
          baseChainName={base.name}
          currentChainName={currentChainName}
          isSwitching={isSwitching}
          onSwitchChain={() => switchChainAsync?.({ chainId: BASE_CHAIN_ID })}
          onClose={() => setWalletOpen(false)}
          onConnect={() => connect({ connector })}
          onDisconnect={() => {
            disconnect();
            setWalletOpen(false);
          }}
          isPending={isPending}
          connectorReady={Boolean(connector)}
          usdcAddress={USDC_ADDRESS}
          aavePoolAddress={AAVE_POOL_ADDRESS}
        />
      )}
    </div>
  );
}
