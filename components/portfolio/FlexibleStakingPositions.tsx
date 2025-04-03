// components/FlexibleStakingPositions.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { useAccount, useChainId, usePublicClient } from 'wagmi';
import { formatBigInt } from '@/utils/format';
import { 
  useUserFlexibleStakingInfo, 
  batchGetFlexibleStakingInfo, 
  useRequestUnstakeFlexible, 
  usePendingWithdrawals,
  useClaimWithdrawal
} from '@/hooks/useFlexibleStaking';
import { getContractAddresses } from '@/config/contracts';
import { toast } from 'react-toastify';
import { FlexibleStakeStatus }  from '@/types/contracts'

interface FlexibleStakeInfo {
  sharesAmount: bigint;
  hskAmount: bigint;
  currentHskValue: bigint;
  stakeBlock: bigint;
  stakingStatus: number;
  reward: bigint;
}

interface FlexibleStakingPositionsProps {
  queryAddress: string;
  isViewingOwnPortfolio: boolean;
  onTotalRewardsChange: (rewards: bigint) => void;
  isLoadingPositions: boolean;
  setIsLoadingPositions: (loading: boolean) => void;
  processingStakeId: number | null;
  setProcessingStakeId: (id: number | null) => void;
  getFlexibleAPR: () => string;
}

// 格式化剩余时间
const formatTimeRemaining = (endTime: bigint) => {
    const remaining = Number(endTime);
    if (remaining <= 0) return 'Unlocked';

    const days = Math.floor(remaining / 86400);
    const hours = Math.floor((remaining % 86400) / 3600);

    if (days > 0) {
        return `${days} days ${hours} hrs`;
    } else if (hours > 0) {
        const minutes = Math.floor((remaining % 3600) / 60);
        return `${hours} hrs ${minutes} mins`;
    } else {
        const minutes = Math.floor(remaining / 60);
        const seconds = remaining % 60;
        return `${minutes} mins ${seconds} sec`;
    }
};

const FlexibleStakingPositions: React.FC<FlexibleStakingPositionsProps> = ({
  queryAddress,
  isViewingOwnPortfolio,
  onTotalRewardsChange,
  isLoadingPositions,
  setIsLoadingPositions,
  processingStakeId,
  setProcessingStakeId,
  getFlexibleAPR,
}) => {
  const { address, isConnected } = useAccount();
  const { flexibleStakeCount, isLoading: loadingFlexibleInfo } = useUserFlexibleStakingInfo();
  const { requestUnstakeFlexible } = useRequestUnstakeFlexible();
  const { claimWithdrawal } = useClaimWithdrawal();
  const { withdrawals, isLoading: loadingWithdrawals, error: withdrawalsError } = usePendingWithdrawals();
  const [flexibleStakedPositions, setFlexibleStakedPositions] = useState<Array<{ id: number; info: FlexibleStakeInfo }>>([]);
  const chainId = useChainId();
  const contractAddress = getContractAddresses(chainId).stakingContract;
  const publicClient = usePublicClient();

  // 使用 useCallback 避免 fetchFlexiblePositions 频繁更新
  const fetchFlexiblePositions = useCallback(async () => {
    if (!publicClient || !queryAddress) return;
    setIsLoadingPositions(true);
    try {
      const flexibleStakeIds = Array.from({ length: 100 }, (_, i) => i);
      const flexibleStakesInfo = await batchGetFlexibleStakingInfo(contractAddress, publicClient, flexibleStakeIds, queryAddress);
      const flexibleTotalReward = flexibleStakesInfo
        .filter(info => !info.error && info.stakingStatus === FlexibleStakeStatus.ACTIVE)
        .reduce((sum, info) => sum + info.reward, BigInt(0));
      onTotalRewardsChange(flexibleTotalReward);
      const flexiblePositions = flexibleStakesInfo
        .filter(info => !info.error)
        .map(info => ({
          id: info.id,
          info: {
            sharesAmount: info.sharesAmount,
            hskAmount: info.hskAmount,
            currentHskValue: info.currentHskValue,
            stakeBlock: info.stakeBlock,
            stakingStatus: info.stakingStatus,
            reward: info.reward,
          },
        }));
      setFlexibleStakedPositions(flexiblePositions);
    } catch (error) {
      console.error('Failed to fetch flexible staked positions:', error);
      toast.error('Failed to load flexible stakes');
    } finally {
      setIsLoadingPositions(false);
    }
  }, [publicClient, contractAddress]);

  return (
    <div className="space-y-4">
      {/* 显示活跃的 Flexible Stakes */}
      {isLoadingPositions || loadingFlexibleInfo ? (
        <div className="text-center text-slate-400">Loading stakes...</div>
      ) : (
        flexibleStakedPositions
          .filter(position => position.info.stakingStatus === FlexibleStakeStatus.ACTIVE)
          .map((position) => (
            <div key={`flexible-${position.id}`} className="bg-slate-800/30 rounded-xl p-6 border border-slate-700/50">
              <div className="flex flex-wrap justify-between mb-6">
                <div className="w-full sm:w-auto mb-4 sm:mb-0">
                  <h3 className="text-sm text-slate-400 mb-1">Flexible Stake #{position.id}</h3>
                  <div className="flex items-center">
                    <p className="text-xl font-medium text-white">
                      {formatBigInt(position.info.sharesAmount)} stHSK
                    </p>
                    <span className="ml-3 px-2 py-1 text-xs font-medium bg-blue-500/20 text-blue-400 rounded">
                      Flexible
                    </span>
                  </div>
                </div>
                <div className="w-full sm:w-auto mb-4 sm:mb-0 sm:mx-4">
                  <p className="text-sm text-slate-400 mb-1">Current Value</p>
                  <p className="text-xl font-medium text-white">
                    {formatBigInt(position.info.currentHskValue)} HSK
                  </p>
                </div>
                <div className="w-full sm:w-auto mb-4 sm:mb-0 sm:mx-4">
                  <p className="text-sm text-slate-400 mb-1">Actual Reward</p>
                  <p className="text-xl font-medium text-green-500">
                    {formatBigInt(position.info.reward, 18, 4)} HSK
                  </p>
                </div>
                <div className="w-full sm:w-auto mb-4 sm:mb-0">
                  <p className="text-sm text-slate-400 mb-1">APY</p>
                  <p className="text-xl font-medium text-green-500">
                    {getFlexibleAPR()}
                  </p>
                </div>
              </div>
            </div>
          ))
      )}

      {/* Only show Withdrawals section if there are pending withdrawals */}
      {!loadingWithdrawals && withdrawals.length > 0 && (
        <>
          <h2 className="text-lg font-medium text-white mt-6">Pending Withdrawals</h2>
          {withdrawals.map((withdrawal) => (
            <div key={`withdrawal-${withdrawal.id}`} className="bg-slate-800/30 rounded-xl p-6 border border-slate-700/50">
              <div className="flex flex-wrap justify-between mb-6">
                <div className="w-full sm:w-auto mb-4 sm:mb-0">
                  <h3 className="text-sm text-slate-400 mb-1">Withdrawal #{withdrawal.id}</h3>
                  <p className="text-xl font-medium text-white">
                    {formatBigInt(withdrawal.hskAmount)} HSK
                  </p>
                </div>
                <div className="w-full sm:w-auto">
                  <p className="text-sm text-slate-400 mb-1">Claimable in</p>
                  <p className="text-xl font-medium text-white">
                    {formatTimeRemaining(withdrawal!.countdown)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </>
      )}

      {/* Only show action buttons if viewing own portfolio */}
      {isViewingOwnPortfolio && (
        <div className="mt-6">
          {/* Add your action buttons here */}
        </div>
      )}
    </div>
  );
};

export default FlexibleStakingPositions;