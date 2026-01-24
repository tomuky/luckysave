"use client";

import { useEffect, useState } from "react";
import { formatUnits } from "viem";
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
import EarnInterestCard from "@/components/EarnInterestCard";
import PlayLotteryCard from "@/components/PlayLotteryCard";
import DepositModal from "@/components/DepositModal";
import WithdrawModal from "@/components/WithdrawModal";
import BuyTicketsModal from "@/components/BuyTicketsModal";
import {
  AAVE_POOL_ADDRESS,
  AAVE_USDC_ATOKEN,
  BASE_CHAIN_ID,
  MEGAPOT_ADDRESS,
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

  // Modal states
  const [walletOpen, setWalletOpen] = useState(false);
  const [depositModalOpen, setDepositModalOpen] = useState(false);
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);
  const [ticketModalOpen, setTicketModalOpen] = useState(false);

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

  // Contract reads
  const { data: usdcBalance, refetch: refetchUsdcBalance } = useReadContract({
    address: USDC_ADDRESS,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: Boolean(address) },
  });

  const { data: aTokenBalance, refetch: refetchATokenBalance } = useReadContract({
    address: AAVE_USDC_ATOKEN,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: Boolean(address && AAVE_USDC_ATOKEN) },
  });

  const { data: usersInfo, refetch: refetchUsersInfo } = useReadContract({
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

  // Megapot jackpot pool reads
  const { data: lpPoolTotal } = useReadContract({
    address: MEGAPOT_ADDRESS,
    abi: megapotAbi,
    functionName: "lpPoolTotal",
    query: { enabled: true },
  });

  const { data: userPoolTotal } = useReadContract({
    address: MEGAPOT_ADDRESS,
    abi: megapotAbi,
    functionName: "userPoolTotal",
    query: { enabled: true },
  });

  // Sync entered state and winnings from on-chain usersInfo
  useEffect(() => {
    if (!usersInfo) return;

    const [ticketsPurchasedTotalBps, winningsClaimable, active] = usersInfo;

    // Sync "entered" with on-chain active status
    setEntered(active);

    // Format winnings for display
    if (winningsClaimable > 0n) {
      const formatted = currency.format(
        Number(formatUnits(winningsClaimable, USDC_DECIMALS))
      );
      setLastResult(formatted);
    } else {
      setLastResult(null);
    }
  }, [usersInfo, setEntered, setLastResult]);

  // Formatted values
  const usdcBalanceNum = Number(formatUnits(usdcBalance || 0n, USDC_DECIMALS));
  const aTokenBalanceNum = Number(formatUnits(aTokenBalance || 0n, USDC_DECIMALS));

  const usdcBalanceLabel = address ? currency.format(usdcBalanceNum) : "--";
  const depositedLabel = address ? currency.format(aTokenBalanceNum) : "--";

  // APY from reserve data
  const currentLiquidityRate = reserveData?.currentLiquidityRate;
  const supplyApyLabel = formatApy(currentLiquidityRate);

  // Check if user has deposit
  const hasDeposit = aTokenBalanceNum > 0;

  // Winnings
  const winningsClaimable = usersInfo?.[1] || 0n;
  const hasWinnings = winningsClaimable > 0n;
  const winningsLabel = hasWinnings
    ? currency.format(Number(formatUnits(winningsClaimable, USDC_DECIMALS)))
    : null;

  // Ticket count (convert from bps - assuming 1 ticket = 100 bps = $1)
  const ticketsPurchasedBps = usersInfo?.[0] || 0n;
  const ticketCount = Number(ticketsPurchasedBps) / 100;

  // Jackpot = max(lpPoolTotal, userPoolTotal)
  const lpPool = lpPoolTotal || 0n;
  const userPool = userPoolTotal || 0n;
  const jackpotAmount = lpPool > userPool ? lpPool : userPool;
  const jackpotNum = Number(formatUnits(jackpotAmount, USDC_DECIMALS));
  const jackpotLabel = currency.format(jackpotNum);

  // Handlers
  const handleClaimWinnings = async () => {
    if (!address || !hasWinnings) return;
    try {
      await writeContractAsync({
        address: MEGAPOT_ADDRESS,
        abi: megapotAbi,
        functionName: "claimWinnings",
        args: [],
      });
      refetchUsersInfo();
      refetchUsdcBalance();
    } catch (error) {
      console.error("Claim failed:", error);
    }
  };

  const handleDepositSuccess = () => {
    refetchUsdcBalance();
    refetchATokenBalance();
  };

  const handleWithdrawSuccess = () => {
    refetchUsdcBalance();
    refetchATokenBalance();
  };

  const handleTicketSuccess = () => {
    refetchUsdcBalance();
    refetchUsersInfo();
    setEntered(true);
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
          <EarnInterestCard
            apyLabel={supplyApyLabel}
            depositBalance={depositedLabel}
            hasDeposit={hasDeposit}
            onDepositClick={() => setDepositModalOpen(true)}
            onWithdrawClick={() => setWithdrawModalOpen(true)}
            isConnected={isReadyForActions && isOnBase}
          />
          <PlayLotteryCard
            jackpotLabel={jackpotLabel}
            entered={entered}
            ticketCount={ticketCount}
            countdown={countdown}
            winningsLabel={winningsLabel}
            hasWinnings={hasWinnings}
            onBuyTicketsClick={() => setTicketModalOpen(true)}
            onClaimClick={handleClaimWinnings}
            isConnected={isReadyForActions && isOnBase}
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

      {/* Wallet Modal */}
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

      {/* Deposit Modal */}
      <DepositModal
        isOpen={depositModalOpen}
        onClose={() => setDepositModalOpen(false)}
        usdcBalance={usdcBalance}
        usdcBalanceLabel={usdcBalanceLabel}
        apyLabel={supplyApyLabel}
        onSuccess={handleDepositSuccess}
      />

      {/* Withdraw Modal */}
      <WithdrawModal
        isOpen={withdrawModalOpen}
        onClose={() => setWithdrawModalOpen(false)}
        depositBalance={aTokenBalance}
        depositBalanceLabel={depositedLabel}
        onSuccess={handleWithdrawSuccess}
      />

      {/* Buy Tickets Modal */}
      <BuyTicketsModal
        isOpen={ticketModalOpen}
        onClose={() => setTicketModalOpen(false)}
        usdcBalance={usdcBalance}
        usdcBalanceLabel={usdcBalanceLabel}
        onSuccess={handleTicketSuccess}
      />
    </div>
  );
}
