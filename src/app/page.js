"use client";

import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
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
import NeedWalletCard from "@/components/NeedWalletCard";
import DepositModal from "@/components/DepositModal";
import WithdrawModal from "@/components/WithdrawModal";
import BuyTicketsModal from "@/components/BuyTicketsModal";
import WalletHistoryCard from "@/components/WalletHistoryCard";
import MegapotDrawPanel from "@/components/MegapotDrawPanel";
import {
  AAVE_POOL_ADDRESS,
  AAVE_USDC_ATOKEN,
  BASE_CHAIN_ID,
  MEGAPOT_JACKPOT_ADDRESS,
  MEGAPOT_TICKET_NFT_ADDRESS,
  USDC_ADDRESS,
  USDC_DECIMALS,
} from "@/lib/constants";
import { aavePoolAbi, erc20Abi } from "@/lib/abis";
import { megapotJackpotAbi, megapotTicketNftAbi } from "@/lib/megapotV2Abi";
import { currency, currencyWhole, formatApy } from "@/lib/format";
import useNextDrawCountdown from "@/hooks/useNextDrawCountdown";
import useWalletLabel from "@/hooks/useWalletLabel";
import useReferralInviter from "@/hooks/useReferralInviter";
import useMegapotClaimScan from "@/hooks/useMegapotClaimScan";
import { USER_TICKET_DRAWING_IDS_QUERY_KEY } from "@/hooks/useMegapotUserTicketDrawingIds";
import { TICKET_OUTCOMES_QUERY_KEY } from "@/hooks/useMegapotTicketOutcomes";

const CLAIM_CHUNK = 75;

export default function Home() {
  const { address, isConnected, chainId } = useAccount();
  const { connectors, connect, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChainAsync, isPending: isSwitching } = useSwitchChain();
  const queryClient = useQueryClient();
  const { writeContractAsync, isPending: isWriting } = useWriteContract();
  const setEntered = useAppStore((state) => state.setEntered);
  const setLastResult = useAppStore((state) => state.setLastResult);
  const triggerRefetch = useAppStore((state) => state.triggerRefetch);

  const [walletOpen, setWalletOpen] = useState(false);
  const [depositModalOpen, setDepositModalOpen] = useState(false);
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);
  const [ticketModalOpen, setTicketModalOpen] = useState(false);
  const { inviterAddress } = useReferralInviter();
  const { countdown, nextDrawAt, isLoading: isLoadingCountdown } =
    useNextDrawCountdown();

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

  const {
    data: usdcBalance,
    refetch: refetchUsdcBalance,
    isLoading: isLoadingUsdcBalance,
    isFetched: isFetchedUsdcBalance,
  } = useReadContract({
    address: USDC_ADDRESS,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: Boolean(address) },
  });

  const {
    data: aTokenBalance,
    refetch: refetchATokenBalance,
    isLoading: isLoadingATokenBalance,
    isFetched: isFetchedATokenBalance,
  } = useReadContract({
    address: AAVE_USDC_ATOKEN,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: Boolean(address && AAVE_USDC_ATOKEN) },
  });

  const {
    data: reserveData,
    isLoading: isLoadingReserveData,
    isFetched: isFetchedReserveData,
  } = useReadContract({
    address: AAVE_POOL_ADDRESS,
    abi: aavePoolAbi,
    functionName: "getReserveData",
    args: [USDC_ADDRESS],
    query: { enabled: true },
  });

  const { data: currentDrawingId, isFetched: isFetchedDrawingId } =
    useReadContract({
      chainId: base.id,
      address: MEGAPOT_JACKPOT_ADDRESS,
      abi: megapotJackpotAbi,
      functionName: "currentDrawingId",
      query: { enabled: true },
    });

  const { data: drawingState, isFetched: isFetchedDrawingState } =
    useReadContract({
      chainId: base.id,
      address: MEGAPOT_JACKPOT_ADDRESS,
      abi: megapotJackpotAbi,
      functionName: "getDrawingState",
      args:
        currentDrawingId !== undefined ? [currentDrawingId] : undefined,
      query: { enabled: currentDrawingId !== undefined },
    });

  const { data: userTickets, refetch: refetchUserTickets } = useReadContract({
    chainId: base.id,
    address: MEGAPOT_TICKET_NFT_ADDRESS,
    abi: megapotTicketNftAbi,
    functionName: "getUserTickets",
    args:
      address && currentDrawingId !== undefined
        ? [address, currentDrawingId]
        : undefined,
    query: {
      enabled: Boolean(address && isOnBase && currentDrawingId !== undefined),
    },
  });

  const lastCompletedDrawingId =
    currentDrawingId !== undefined && currentDrawingId >= 2n
      ? currentDrawingId - 1n
      : undefined;

  const { data: ticketsLastCompletedDraw } = useReadContract({
    chainId: base.id,
    address: MEGAPOT_TICKET_NFT_ADDRESS,
    abi: megapotTicketNftAbi,
    functionName: "getUserTickets",
    args:
      address && lastCompletedDrawingId !== undefined
        ? [address, lastCompletedDrawingId]
        : undefined,
    query: {
      enabled: Boolean(
        address && isOnBase && lastCompletedDrawingId !== undefined
      ),
    },
  });

  const enteredLastCompletedDraw = Boolean(
    ticketsLastCompletedDraw && ticketsLastCompletedDraw.length > 0
  );

  const claimDrawingIds = useMemo(() => {
    if (!currentDrawingId || currentDrawingId < 2n) return [];
    const last = currentDrawingId - 1n;
    if (enteredLastCompletedDraw) {
      return [last];
    }
    return [];
  }, [currentDrawingId, enteredLastCompletedDraw]);

  const claimScanEnabled = Boolean(
    isOnBase && address && claimDrawingIds.length > 0
  );

  const claimQuery = useMegapotClaimScan({
    address: isOnBase ? address : undefined,
    drawingIds: claimDrawingIds,
    enabled: claimScanEnabled,
  });
  const claimData = claimQuery.data;

  const isLoadingJackpot = !isFetchedDrawingState || !drawingState;
  const isLoadingDeposit = address && !isFetchedATokenBalance;
  const isLoadingApy = !isFetchedReserveData;
  const isLoadingWalletBalance = address && !isFetchedUsdcBalance;

  const usdcBalanceNum = Number(formatUnits(usdcBalance || 0n, USDC_DECIMALS));
  const aTokenBalanceNum = Number(formatUnits(aTokenBalance || 0n, USDC_DECIMALS));
  const usdcBalanceLabel = address ? currency.format(usdcBalanceNum) : "--";
  const depositedLabel = address ? currency.format(aTokenBalanceNum) : "--";
  const currentLiquidityRate = reserveData?.currentLiquidityRate;
  const supplyApyLabel = formatApy(currentLiquidityRate);
  const hasDeposit = aTokenBalanceNum > 0;

  const ticketPriceWei = drawingState?.ticketPrice;
  const bonusballMax = drawingState?.bonusballMax
    ? Number(drawingState.bonusballMax)
    : 12;

  const jackpotNum = drawingState?.prizePool
    ? Number(formatUnits(drawingState.prizePool, USDC_DECIMALS))
    : 0;
  const jackpotLabel = currencyWhole.format(Math.round(jackpotNum));

  const ticketCount = userTickets?.length ?? 0;
  const hasWinnings = Boolean(claimData?.ticketIds?.length);
  const winningsLabel = hasWinnings
    ? currency.format(Number(claimData.totalLabel))
    : null;

  useEffect(() => {
    setEntered(Boolean(ticketCount > 0));
  }, [ticketCount, setEntered]);

  useEffect(() => {
    if (hasWinnings && winningsLabel) {
      setLastResult(winningsLabel);
    } else if (!hasWinnings) {
      setLastResult(null);
    }
  }, [hasWinnings, winningsLabel, setLastResult]);

  const handleClaimWinnings = async () => {
    if (!address || !claimData?.ticketIds?.length) return;
    const ids = claimData.ticketIds;
    try {
      for (let i = 0; i < ids.length; i += CLAIM_CHUNK) {
        const slice = ids.slice(i, i + CLAIM_CHUNK);
        await writeContractAsync({
          chainId: base.id,
          address: MEGAPOT_JACKPOT_ADDRESS,
          abi: megapotJackpotAbi,
          functionName: "claimWinnings",
          args: [slice],
        });
      }
      refetchUsdcBalance();
      refetchUserTickets();
      await claimQuery.refetch();
      await queryClient.invalidateQueries({
        queryKey: [USER_TICKET_DRAWING_IDS_QUERY_KEY],
      });
      await queryClient.invalidateQueries({
        queryKey: [TICKET_OUTCOMES_QUERY_KEY],
      });
      triggerRefetch();
    } catch (error) {
      console.error("Claim failed:", error);
    }
  };

  const handleDepositSuccess = () => {
    refetchUsdcBalance();
    refetchATokenBalance();
    triggerRefetch();
  };

  const handleWithdrawSuccess = () => {
    refetchUsdcBalance();
    refetchATokenBalance();
    triggerRefetch();
  };

  const handleTicketSuccess = () => {
    refetchUsdcBalance();
    refetchUserTickets();
    triggerRefetch();
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
          isLoadingBalance={isLoadingWalletBalance}
          shareReferralAddress={isOnBase ? address : undefined}
        />

        <section className={styles.grid}>
          {!isConnected && <NeedWalletCard />}
          <EarnInterestCard
            apyLabel={supplyApyLabel}
            depositBalance={depositedLabel}
            hasDeposit={hasDeposit}
            onDepositClick={() => setDepositModalOpen(true)}
            onWithdrawClick={() => setWithdrawModalOpen(true)}
            isConnected={isReadyForActions && isOnBase}
            isLoadingDeposit={isLoadingDeposit}
            isLoadingApy={isLoadingApy}
          />
          <PlayLotteryCard
            jackpotLabel={jackpotLabel}
            onBuyTicketsClick={() => setTicketModalOpen(true)}
            isConnected={isReadyForActions && isOnBase}
            isLoadingJackpot={isLoadingJackpot}
            countdown={countdown}
            nextDrawAt={nextDrawAt}
            isLoadingCountdown={isLoadingCountdown}
          />
          <MegapotDrawPanel
            address={address}
            isConnected={isConnected}
            isOnBase={isOnBase}
            currentDrawingId={currentDrawingId}
            hasWinnings={hasWinnings}
            winningsLabel={winningsLabel}
            onClaimClick={handleClaimWinnings}
            isWriting={isWriting}
            claimScanLoading={claimQuery.isFetching}
          />
          <WalletHistoryCard
            address={address}
            isConnected={isReadyForActions && isOnBase}
          />
        </section>

        <footer className={styles.disclaimer}>
          This interface does not bypass any geographic or legal restrictions.
          Users are responsible for compliance.
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
          shareReferralAddress={isOnBase ? address : undefined}
        />
      )}

      <DepositModal
        isOpen={depositModalOpen}
        onClose={() => setDepositModalOpen(false)}
        usdcBalance={usdcBalance}
        usdcBalanceLabel={usdcBalanceLabel}
        apyLabel={supplyApyLabel}
        onSuccess={handleDepositSuccess}
      />

      <WithdrawModal
        isOpen={withdrawModalOpen}
        onClose={() => setWithdrawModalOpen(false)}
        depositBalance={aTokenBalance}
        depositBalanceLabel={depositedLabel}
        onSuccess={handleWithdrawSuccess}
      />

      <BuyTicketsModal
        isOpen={ticketModalOpen}
        onClose={() => setTicketModalOpen(false)}
        usdcBalance={usdcBalance}
        usdcBalanceLabel={usdcBalanceLabel}
        ticketPriceWei={ticketPriceWei}
        bonusballMax={bonusballMax}
        inviterAddress={inviterAddress}
        onSuccess={handleTicketSuccess}
      />
    </div>
  );
}
