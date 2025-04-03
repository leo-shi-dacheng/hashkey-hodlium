'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import MainLayout from './main-layout';
import { useAccount, useChainId, usePublicClient } from 'wagmi';
import { LockedStakeInfo } from '@/types/contracts';
import { formatBigInt } from '@/utils/format';
import { useUnstakeLocked, useUserStakingInfo, batchGetStakingInfo, useAllStakingAPRs } from '@/hooks/useStakingContracts';
import { getContractAddresses } from '@/config/contracts';
import { toast } from 'react-toastify';
import FlexibleStakingPositions from '@/components/portfolio/FlexibleStakingPositions';
import OldStakingPositions from '@/components/portfolio/OldLockedStakingPositions';
import { useUserFlexibleStakingInfo } from '@/hooks/useFlexibleStaking';

export default function PortfolioPage() {
  const { address, isConnected } = useAccount();
  const { lockedStakeCount, activeLockedStakes, isLoading: loadingInfo } = useUserStakingInfo();
  const { unstakeLocked, isPending: unstakePending, isConfirming: unstakeConfirming } = useUnstakeLocked();
  const [stakedPositions, setStakedPositions] = useState<Array<{ id: number, info: LockedStakeInfo }>>([]);
  const [isLoadingPositions, setIsLoadingPositions] = useState(false);
  const [processingStakeId, setProcessingStakeId] = useState<number | null>(null);
  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null);
  const chainId = useChainId();
  const contractAddress = getContractAddresses(chainId).stakingContract;
  const publicClient = usePublicClient();
  const [totalRewards, setTotalRewards] = useState<bigint>(BigInt(0));
  const { estimatedAPRs, isLoading: aprsLoading } = useAllStakingAPRs();
  const [aprDataSource, setAprDataSource] = useState<'contract' | 'loading'>('loading');
  const { flexibleStakeCount, activeFlexibleStakes, isLoading: loadingFlexibleInfo } = useUserFlexibleStakingInfo();

  const [showUnstakeModal, setShowUnstakeModal] = useState(false);
  const [unstakingPosition, setUnstakingPosition] = useState<number | null>(null);

  const [queryAddress, setQueryAddress] = useState<string>('');
  const [inputAddress, setInputAddress] = useState<string>('');
  const [isValidAddress, setIsValidAddress] = useState<boolean>(true);

  const validateAddress = (address: string): boolean => {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  };

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputAddress(value);
    if (value) {
      setIsValidAddress(validateAddress(value));
    } else {
      setIsValidAddress(true);
    }
  };

  const handleSearch = () => {
    if (inputAddress && validateAddress(inputAddress)) {
      setQueryAddress(inputAddress);
      fetchStakedPositions(inputAddress);
    } else if (inputAddress) {
      toast.error('Please enter a valid Ethereum address');
    }
  };

  const resetToConnectedWallet = () => {
    if (address) {
      setInputAddress('');
      setQueryAddress('');
      fetchStakedPositions(address);
    } else {
      toast.error('Please connect your wallet first');
    }
  };

  useEffect(() => {
    if (!aprsLoading && estimatedAPRs) {
      setAprDataSource('contract');
    } else {
      setAprDataSource('loading');
    }
  }, [aprsLoading, estimatedAPRs]);

  const fetchStakedPositions = useCallback(async (targetAddress?: string) => {
    const addressToUse = targetAddress || queryAddress || address;
    if (!addressToUse || !publicClient) return;

    setIsLoadingPositions(true);

    try {
      const stakeIds = Array.from({ length: 100 }, (_, i) => i);

      const stakesInfo = await batchGetStakingInfo(contractAddress, publicClient, stakeIds, addressToUse);

      const confirmedTotalReward = stakesInfo
        .filter(info => !info.error && !info.isWithdrawn)
        .reduce((sum, info) => sum + (info.currentHskValue - info.hskAmount), BigInt(0));

      setTotalRewards(confirmedTotalReward);

      const positions = stakesInfo
        .filter(info => !info.error)
        .map(info => ({
          id: info.id,
          info: {
            sharesAmount: info.sharesAmount,
            hskAmount: info.hskAmount,
            currentHskValue: info.currentHskValue,
            lockEndTime: info.lockEndTime,
            isWithdrawn: info.isWithdrawn,
            isLocked: info.isLocked,
            actualReward: info.actualReward
          }
        }));

      setStakedPositions(positions);
      setLastUpdateTime(new Date());

    } catch (error) {
      console.error('Failed to fetch staked positions:', error);
      toast.error('Failed to load stakes');
    } finally {
      setIsLoadingPositions(false);
    }
  }, [publicClient, contractAddress]);

  const openUnstakeConfirmation = (stakeId: number) => {
    const position = stakedPositions.find(pos => pos.id === stakeId);
    if (!position) return;

    setUnstakingPosition(stakeId);
    setShowUnstakeModal(true);
  };

  const handleRefresh = () => {
    fetchStakedPositions();
    toast.info('Refreshing stake information...');
  };

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

  const getFlexibleAPR = () => {
    if (!estimatedAPRs || aprsLoading) return 'Loading...';
    return estimatedAPRs[4] ? `${(Number(estimatedAPRs[4]) / 100).toFixed(2)}%` : 'N/A';
  };

  const totalStakedValue = useMemo(() => {
    if (!stakedPositions.length) return BigInt(0);
    return stakedPositions
      .filter(pos => !pos.info.isWithdrawn)
      .reduce((sum, pos) => sum + pos.info.currentHskValue, BigInt(0));
  }, [stakedPositions]);
  // 获取质押期APR值 - 使用useMemo避免重复计算
  const getAPRForStakePeriod = useCallback((lockEndTime: bigint) => {
    if (!estimatedAPRs || aprsLoading) {
      return 'Loading...';
    }
    
    const now = Math.floor(Date.now() / 1000);
    const remainingTime = Number(lockEndTime) - now;
    
    // 将合约返回的APR值除以100转换为百分比
    const apr30 = Number(estimatedAPRs[0] || BigInt(0)) / 100;
    const apr90 = Number(estimatedAPRs[1] || BigInt(0)) / 100;
    const apr180 = Number(estimatedAPRs[2] || BigInt(0)) / 100;
    const apr365 = Number(estimatedAPRs[3] || BigInt(0)) / 100;
    
    if (remainingTime <= 0) {
      return `${apr30.toFixed(2)}%`; // 已解锁的质押
    } else if (remainingTime <= 30 * 24 * 3600) {
      return `${apr30.toFixed(2)}%`; // 30天锁定
    } else if (remainingTime <= 90 * 24 * 3600) {
      return `${apr90.toFixed(2)}%`; // 90天锁定
    } else if (remainingTime <= 180 * 24 * 3600) {
      return `${apr180.toFixed(2)}%`; // 180天锁定
    } else {
      return `${apr365.toFixed(2)}%`; // 365天锁定
    }
  }, [estimatedAPRs, aprsLoading]);
  return (
    <MainLayout>
      <div className="min-h-screen">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-8">
              <h1 className="text-4xl font-light text-white">User Stakes</h1>
              <button 
                onClick={handleRefresh}
                disabled={isLoadingPositions}
                className="px-4 py-2 rounded bg-slate-700 hover:bg-slate-600 transition-colors disabled:bg-slate-800 disabled:cursor-not-allowed flex items-center"
              >
                {isLoadingPositions ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Loading...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Refresh
                  </>
                )}
              </button>
            </div>

            <div className="mb-6 bg-slate-800/30 backdrop-blur-sm rounded-xl border border-slate-700/50 p-4">
              <div className="flex flex-col md:flex-row md:items-end gap-4">
                <div className="flex-grow">
                  <label htmlFor="addressInput" className="block text-sm font-medium text-slate-400 mb-1">
                    Search Address
                  </label>
                  <div className="flex">
                    <input
                      id="addressInput"
                      type="text"
                      value={inputAddress}
                      onChange={handleAddressChange}
                      placeholder="Enter wallet address (0x...)"
                      className={`w-full bg-slate-900/50 border ${
                        isValidAddress ? 'border-slate-600' : 'border-red-500'
                      } rounded-l px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-primary`}
                    />
                    <button
                      onClick={handleSearch}
                      disabled={!inputAddress || !isValidAddress}
                      className="bg-primary hover:bg-primary-dark px-4 py-2 rounded-r text-white disabled:bg-slate-700 disabled:cursor-not-allowed transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </button>
                  </div>
                  {!isValidAddress && inputAddress && (
                    <p className="mt-1 text-xs text-red-500">Please enter a valid wallet address</p>
                  )}
                </div>
                {address && (
                  <button
                    onClick={resetToConnectedWallet}
                    className="px-4 py-2 rounded bg-slate-700 hover:bg-slate-600 text-white transition-colors text-sm"
                  >
                    View My Stakes
                  </button>
                )}
              </div>

              {(address || queryAddress) && (
                <div className="mt-3 p-2 bg-slate-700/30 rounded flex items-center justify-between">
                  <div className="flex items-center">
                    <span className="text-sm text-slate-400 mr-2">Viewing:</span>
                    <span className="text-sm font-mono text-white">
                      {(queryAddress || address).slice(0, 6)}...{(queryAddress || address).slice(-4)}
                    </span>
                    {(queryAddress || address) === address && (
                      <span className="ml-2 px-2 py-0.5 text-xs bg-green-500/20 text-green-400 rounded">
                        You
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-4 mb-4 text-sm">
              <span className="text-slate-400">
                APR Data Source: {' '}
                {aprDataSource === 'contract' ? (
                  <span className="text-green-500">Contract (Live Data)</span>
                ) : (
                  <span className="text-yellow-500">Loading...</span>
                )}
              </span>
              {lastUpdateTime && (
                <span className="text-slate-400">
                  Last update: {lastUpdateTime.toLocaleTimeString()}
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
              <div className="bg-slate-800/30 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6">
                <div className="flex items-center gap-2 mb-3">
                  <svg className="w-5 h-5 text-primary/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                  <h3 className="text-sm font-medium text-primary/80">Total Staked</h3>
                </div>
                <p className="text-2xl font-medium text-white">
                  {isLoadingPositions ? (
                    <span className="inline-block w-24 h-7 bg-slate-700 rounded animate-pulse"></span>
                  ) : (
                    formatBigInt(totalStakedValue, 18, 4) + ' HSK'
                  )}
                </p>
              </div>

              <div className="bg-slate-800/30 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6">
                <div className="flex items-center gap-2 mb-3">
                  <svg className="w-5 h-5 text-primary/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <h3 className="text-sm font-medium text-primary/80">Active Stakes</h3>
                </div>
                <div className="flex flex-col">
                  <p className="text-2xl font-medium text-white">
                    {loadingInfo || loadingFlexibleInfo ? (
                      <span className="inline-block w-10 h-7 bg-slate-700 rounded animate-pulse"></span>
                    ) : (
                      Number(activeLockedStakes || 0) + Number(activeFlexibleStakes || 0)
                    )}
                  </p>
                  <div className="flex gap-2 text-sm text-slate-400 mt-1">
                    <span>Locked: {Number(activeLockedStakes || 0)}</span>
                    <span>•</span>
                    <span>Flexible: {Number(activeFlexibleStakes || 0)}</span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-800/30 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6">
                <div className="flex items-center gap-2 mb-3">
                  <svg className="w-5 h-5 text-primary/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h3 className="text-sm font-medium text-primary/80">Total Rewards</h3>
                </div>
                <p className="text-2xl font-medium text-green-500">
                  {isLoadingPositions ? (
                    <span className="inline-block w-24 h-7 bg-slate-700 rounded animate-pulse"></span>
                  ) : (
                    `+${formatBigInt(totalRewards, 18, 4)} HSK`
                  )}
                </p>
              </div>

              <div className="bg-slate-800/30 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6">
                <div className="flex items-center gap-2 mb-3">
                  <svg className="w-5 h-5 text-primary/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                  <h3 className="text-sm font-medium text-primary/80">APY Range</h3>
                </div>
                <div className="flex flex-col">
                  <p className="text-2xl font-medium text-white">
                    {aprsLoading ? (
                      <span className="inline-block w-24 h-7 bg-slate-700 rounded animate-pulse"></span>
                    ) : (
                      `${(Number(estimatedAPRs?.[0] || 0) / 100).toFixed(2)}% - ${(Number(estimatedAPRs?.[3] || 0) / 100).toFixed(2)}%`
                    )}
                  </p>
                  <p className="text-sm text-slate-400 mt-1">
                    Flexible: {getFlexibleAPR()}
                  </p>
                </div>
              </div>
            </div>

            {stakedPositions.length > 0 ? (
              <div className="space-y-4">
                {stakedPositions
                  .filter(position => !position.info.isWithdrawn)
                  .map((position) => (
                    <div key={position.id} className="bg-slate-800/30 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
                      {/* Main Info */}
                      <div className="flex flex-wrap justify-between mb-6">
                        <div className="w-full sm:w-auto mb-4 sm:mb-0">
                          <h3 className="text-sm text-slate-400 mb-1">Stake #{position.id}</h3>
                          <div className="flex items-center">
                            <p className="text-xl font-medium text-white">
                              {formatBigInt(position.info.sharesAmount)} stHSK
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
                            {formatBigInt(position.info.currentHskValue)} HSK
                          </p>
                        </div>
                        <div className="w-full sm:w-auto mb-4 sm:mb-0 sm:mx-4">
                          <p className="text-sm text-slate-400 mb-1">Actual Reward</p>
                          <p className="text-xl font-medium text-green-500">
                            {formatBigInt(position.info.actualReward, 18, 4)} HSK
                          </p>
                        </div>
                        {/* <div className="w-full sm:w-auto mb-4 sm:mb-0">
                          <p className="text-sm text-slate-400 mb-1">APY</p>
                          <p className="text-xl font-medium text-green-500">
                            {getAPRForStakePeriod(position.info.lockEndTime)}
                          </p>
                        </div> */}
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

                      {/* Detailed Info */}
                      <div className="mt-4 border-t border-slate-700/50 pt-4"></div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="text-slate-400">Initial Stake</p>
                            <p className="text-white font-medium">{formatBigInt(position.info.hskAmount)} HSK</p>
                          </div>
                          <div>
                            <p className="text-slate-400">Lock End Date</p>
                            <p className="text-white font-medium">
                              {new Date(Number(position.info.lockEndTime) * 1000).toLocaleDateString()} {new Date(Number(position.info.lockEndTime) * 1000).toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                      </div>
                  )
          
                  )}
              </div>
            ) : null}

            <FlexibleStakingPositions
              queryAddress={queryAddress || address}
              isViewingOwnPortfolio={(queryAddress || address) === address}
              onTotalRewardsChange={(rewards) => setTotalRewards((prev) => prev + rewards)}
              isLoadingPositions={isLoadingPositions}
              setIsLoadingPositions={setIsLoadingPositions}
              processingStakeId={processingStakeId}
              setProcessingStakeId={setProcessingStakeId}
              getFlexibleAPR={getFlexibleAPR}
            />
            <OldStakingPositions 
              queryAddress={queryAddress || address}
              isViewingOwnPortfolio={(queryAddress || address) === address}
            />
          </div>
        </div>
      </div>
      </MainLayout>
  );
}
    