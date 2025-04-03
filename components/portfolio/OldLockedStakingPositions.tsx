'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useAccount, useChainId, usePublicClient } from 'wagmi';
import { LockedStakeInfo } from '@/types/contracts';
import { formatBigInt } from '@/utils/format';
import { useUserStakingInfo, useUnstakeLocked } from '@/hooks/useOldStakingContracts'; // 请将路径替换为实际 hooks 文件路径
import { getContractAddresses } from '@/config/contracts';
import { toast } from 'react-toastify';
import { HashKeyChainStakingABI } from '@/constants/oldAbi';

// 批量获取老质押信息的函数
const batchGetOldStakingInfo = async (
  contractAddress: string,
  publicClient: any,
  stakeIds: number[],
  userAddress: string
): Promise<Array<{ id: number; error?: string } & Partial<LockedStakeInfo>>> => {
  const results = await Promise.all(
    stakeIds.map(async (id) => {
      try {
        const stakeInfo = (await publicClient.readContract({
          address: contractAddress as `0x${string}`,
          abi: HashKeyChainStakingABI,
          functionName: 'getLockedStakeInfo',
          args: [userAddress, BigInt(id)],
        })) as [bigint, bigint, bigint, bigint, boolean, boolean];

        const reward = stakeInfo[2] - stakeInfo[1];
        const upgradeProfit = stakeInfo[2] > stakeInfo[1] ? reward : BigInt(0); // 简单假设升级利润为正收益

        return {
          id,
          sharesAmount: stakeInfo[0],
          hskAmount: stakeInfo[1],
          currentHskValue: stakeInfo[2],
          lockEndTime: stakeInfo[3],
          isWithdrawn: stakeInfo[4],
          isLocked: stakeInfo[5],
          actualReward: reward,
          upgradeProfit,
        };
      } catch (error) {
        console.error(`Failed to fetch stake info for ID ${id}:`, error);
        return { id, error: 'Failed to fetch stake info' };
      }
    })
  );
  return results;
};

interface OldStakingPositionsProps {
  queryAddress: string;
  isViewingOwnPortfolio: boolean;
}

const OldStakingPositions: React.FC<OldStakingPositionsProps> = ({
  queryAddress,
  isViewingOwnPortfolio
}) => {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const publicClient = usePublicClient();
  const oldContractAddress = getContractAddresses(chainId).stakingOldContract;

  const { lockedStakeCount, activeLockedStakes, isLoading: loadingUserInfo } = useUserStakingInfo();
  const { unstakeLocked, isPending: unstakePending, isConfirming: unstakeConfirming } = useUnstakeLocked();
  const [oldStakedPositions, setOldStakedPositions] = useState<
    Array<{ id: number; info: LockedStakeInfo & { upgradeProfit: bigint } }>
  >([]);
  const [isLoadingPositions, setIsLoadingPositions] = useState(false);
  const [processingStakeId, setProcessingStakeId] = useState<number | null>(null);

  // 获取老质押数据的函数
  const fetchOldStakedPositions = useCallback(async () => {
    if (!queryAddress || !publicClient) return;

    setIsLoadingPositions(true);

    try {
      const stakeIds = Array.from({ length: 100 }, (_, i) => i);
      const oldStakesInfo = await batchGetOldStakingInfo(oldContractAddress, publicClient, stakeIds, queryAddress);

      const positions = oldStakesInfo
        .filter((info) => !info.error)
        .map((info) => ({
          id: info.id,
          info: {
            sharesAmount: info.sharesAmount!,
            hskAmount: info.hskAmount!,
            currentHskValue: info.currentHskValue!,
            lockEndTime: info.lockEndTime!,
            isWithdrawn: info.isWithdrawn!,
            isLocked: info.isLocked!,
            actualReward: info.actualReward!,
            // @ts-ignore
            upgradeProfit: info.upgradeProfit || BigInt(0),
          },
        }));

      setOldStakedPositions(positions);
    } catch (error) {
      console.error('Failed to fetch old staked positions:', error);
      toast.error('Failed to load old stakes');
    } finally {
      setIsLoadingPositions(false);
    }
  }, [publicClient, oldContractAddress]);

  // 初始化数据
  useEffect(() => {
    if (queryAddress) {
      fetchOldStakedPositions(); // Only fetch when query address is initially set
    }
  }, [queryAddress]);

  // 处理升级操作
  const handleUpgradeOldClick = async (stakeId: number) => {
    if (processingStakeId !== null) return;
    // 跳转到首页 带参数
    window.location.href = `/?upgradestakes=id${stakeId}`;
    // setProcessingStakeId(stakeId);

    // try {
    //   const success = await unstakeLocked(stakeId);
    //   if (success) {
    //     toast.success('Successfully upgraded your position');
    //     fetchOldStakedPositions(); // 刷新数据
    //   }
    // } catch (error) {
    //   console.error('Failed to upgrade:', error);
    //   toast.error('Failed to upgrade your position');
    // } finally {
    //   setProcessingStakeId(null);
    // }
  };

  // 格式化剩余时间
  const formatTimeRemaining = (endTime: bigint) => {
    const now = Math.floor(Date.now() / 1000);
    const remaining = Number(endTime) - now;

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

  return (
    <div className="mt-12">
      
      {isLoadingPositions || loadingUserInfo ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="bg-slate-800/30 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50 animate-pulse"
            >
              <div className="flex flex-wrap justify-between mb-4">
                <div className="mb-4 w-1/5">
                  <div className="h-5 bg-slate-700 rounded mb-2 w-20"></div>
                  <div className="h-7 bg-slate-700 rounded w-24"></div>
                </div>
                <div className="mb-4 w-1/5">
                  <div className="h-5 bg-slate-700 rounded mb-2 w-20"></div>
                  <div className="h-7 bg-slate-700 rounded w-24"></div>
                </div>
                <div className="mb-4 w-1/5">
                  <div className="h-5 bg-slate-700 rounded mb-2 w-20"></div>
                  <div className="h-7 bg-slate-700 rounded w-24"></div>
                </div>
                <div className="mb-4 w-1/5">
                  <div className="h-5 bg-slate-700 rounded mb-2 w-20"></div>
                  <div className="h-7 bg-slate-700 rounded w-24"></div>
                </div>
                <div className="mb-4 w-1/5">
                  <div className="h-5 bg-slate-700 rounded mb-2 w-20"></div>
                  <div className="h-7 bg-slate-700 rounded w-24"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : oldStakedPositions.length > 0 ? (
        <div className="space-y-4">
          {oldStakedPositions
            .filter((position) => !position.info.isWithdrawn)
            .map((position) => (
              <>
                <h2 className="text-2xl font-light text-white mb-6">Wait Upgrade Stakes </h2>

                <div
                  key={position.id}
                  className="bg-slate-800/30 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50"
                >
                  <div className="flex flex-wrap justify-between mb-6">
                    <div className="w-full sm:w-auto mb-4 sm:mb-0">
                      <h3 className="text-sm text-slate-400 mb-1">Pending Upgrade #{position.id}</h3>
                      <div className="flex items-center">
                        <p className="text-xl font-medium text-white">
                          {`${formatBigInt(position.info.sharesAmount, 18, 4)} HSK`}
                        </p>
                        {position.info.isLocked && (
                          <span className="ml-3 px-2 py-1 text-xs font-medium bg-primary/20 text-primary/90 rounded">
                            Locked
                          </span>
                        )}
                        {!position.info.isLocked && (
                          <span className="ml-3 px-2 py-1 text-xs font-medium bg-green-500/20 text-green-500 rounded">
                            Unlocked
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="w-full sm:w-auto mb-4 sm:mb-0 sm:mx-4">
                      <p className="text-sm text-slate-400 mb-1">Current Value</p>
                      <p className="text-xl font-medium text-white">
                        {`${formatBigInt(position.info.currentHskValue, 18, 4)} HSK`}

                      </p>
                    </div>
                  
                    <div className="w-full sm:w-auto">
                      <p className="text-sm text-slate-400 mb-1">
                        {position.info.isLocked ? 'Time Remaining' : 'Unlocked on'}
                      </p>
                      <p className="text-xl font-medium text-white">
                        {position.info.isLocked
                          ? formatTimeRemaining(position.info.lockEndTime)
                          : new Date(Number(position.info.lockEndTime) * 1000).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  {!position.info.isWithdrawn && isViewingOwnPortfolio && (
                    <div className="flex justify-end">
                      <button
                        onClick={() => handleUpgradeOldClick(position.id)}
                        disabled={processingStakeId === position.id || unstakePending || unstakeConfirming}
                        className="px-6 py-3 rounded-lg bg-gradient-to-r from-primary to-primary-dark hover:from-primary-dark hover:to-primary text-white font-semibold text-sm hover:scale-105 transform transition-all duration-200 shadow-lg hover:shadow-xl disabled:bg-slate-600 disabled:cursor-not-allowed"
                      >
                        {processingStakeId === position.id || unstakePending || unstakeConfirming ? (
                          <>
                            <svg
                              className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline"
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                            >
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                              ></circle>
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                              ></path>
                            </svg>
                            {unstakePending
                              ? 'Awaiting Confirmation...'
                              : unstakeConfirming
                              ? 'Confirming...'
                              : 'Processing...'}
                          </>
                        ) : (
                          'Upgrade Profits'
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </>
            ))}
        </div>
      ) : (
        <div className="bg-slate-800/30 backdrop-blur-sm rounded-xl p-8 border border-slate-700/50 text-center">
          <svg
            className="w-12 h-12 text-slate-500 mx-auto mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1}
              d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <h3 className="text-xl font-medium text-white mb-2">No Upgrade Pending Records</h3>
          <p className="text-slate-400 mb-6">You don't have any pending upgrade records.</p>
        </div>
      )}
    </div>
  );
};

export default OldStakingPositions;
