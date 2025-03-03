'use client';

import React, { useState, useEffect, useMemo } from 'react';
import MainLayout from '../main-layout';
import { StakeType } from '@/types/contracts';
import { useAccount, useBalance } from 'wagmi';
import { useStakeLocked, useStakingInfo, useAllStakingAPRs } from '@/hooks/useStakingContracts';
import { toast } from 'react-toastify';
import { formatEther } from 'viem';

export default function StakePage() {
  const { address, isConnected } = useAccount();
  const { data: balanceData } = useBalance({
    address: address,
  });
  
  // 使用固定值进行APR计算，避免频繁调用合约
  const simulationAmount = '1000';
  
  // 从合约获取质押信息
  const { stakingStats, minStakeAmount, isLoading: statsLoading } = useStakingInfo(simulationAmount);
  
  // 从合约获取APR数据
  const { estimatedAPRs, maxAPRs, isLoading: aprsLoading } = useAllStakingAPRs(simulationAmount);
  
  const { 
    stakeLocked, 
    isPending,
    isConfirming,
  } = useStakeLocked();
  
  // State to track selected duration and transaction status
  const [selectedDays, setSelectedDays] = useState(30);
  const [stakeAmount, setStakeAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // State to track data source
  const [dataSource, setDataSource] = useState<'contract' | 'loading'>('loading');
  
  // 更新数据源状态
  useEffect(() => {
    if (!statsLoading && !aprsLoading && stakingStats && estimatedAPRs && maxAPRs) {
      setDataSource('contract');
    } else {
      setDataSource('loading');
    }
  }, [statsLoading, aprsLoading, stakingStats, estimatedAPRs, maxAPRs]);
  
  // 从合约数据中提取质押选项
  const stakingOptions = useMemo(() => {
    if (aprsLoading || !estimatedAPRs || !maxAPRs) {
      console.log('APR data is still loading');
      return [];
    }
    
    try {
      console.log('Contract APR data available:', {
        estimatedAPRs: estimatedAPRs.map(apr => apr.toString()),
        maxAPRs: maxAPRs.map(apr => apr.toString())
      });
      
      // 计算格式化的APR值
      const apr30 = Number(estimatedAPRs[0] || BigInt(0)) / 100;
      const apr90 = Number(estimatedAPRs[1] || BigInt(0)) / 100;
      const apr180 = Number(estimatedAPRs[2] || BigInt(0)) / 100;
      const apr365 = Number(estimatedAPRs[3] || BigInt(0)) / 100;
      
      const maxApr30 = Number(maxAPRs[0] || BigInt(0)) / 100;
      const maxApr90 = Number(maxAPRs[1] || BigInt(0)) / 100;
      const maxApr180 = Number(maxAPRs[2] || BigInt(0)) / 100;
      const maxApr365 = Number(maxAPRs[3] || BigInt(0)) / 100;
      
      // 硬编码的bonus值，按照图片中显示的数值
      const bonus30 = 0.00;  // 30天锁定期：+0.00%
      const bonus90 = 0.80;  // 90天锁定期：+0.80%
      const bonus180 = 2.00; // 180天锁定期：+2.00%
      const bonus365 = 4.00; // 365天锁定期：+4.00%
      
      console.log('Using hardcoded bonus values:', {
        '30 days': bonus30.toFixed(2) + '%',
        '90 days': bonus90.toFixed(2) + '%',
        '180 days': bonus180.toFixed(2) + '%',
        '365 days': bonus365.toFixed(2) + '%'
      });
      
      return [
        {
          title: '30 Day Lock',
          duration: 30,
          durationDisplay: '30 days',
          apr: apr30,
          bonus: bonus30,
          maxApr: maxApr30,
          stakeType: StakeType.FIXED_30_DAYS
        },
        {
          title: '90 Day Lock',
          duration: 90,
          durationDisplay: '90 days',
          apr: apr90,
          bonus: bonus90,
          maxApr: maxApr90,
          stakeType: StakeType.FIXED_90_DAYS
        },
        {
          title: '180 Day Lock',
          duration: 180,
          durationDisplay: '180 days',
          apr: apr180,
          bonus: bonus180,
          maxApr: maxApr180,
          stakeType: StakeType.FIXED_180_DAYS
        },
        {
          title: '365 Day Lock',
          duration: 365,
          durationDisplay: '365 days',
          apr: apr365,
          bonus: bonus365,
          maxApr: maxApr365,
          stakeType: StakeType.FIXED_365_DAYS
        }
      ];
    } catch (error) {
      console.error('Error processing APR data:', error);
      return []; // 出错时返回空数组
    }
  }, [estimatedAPRs, maxAPRs, aprsLoading]);
  
  // 获取最小质押金额（以HSK为单位）
  const minStakeAmountHSK = useMemo(() => {
    if (!minStakeAmount) return 100; // 默认值
    return Number(formatEther(minStakeAmount));
  }, [minStakeAmount]);
  
  // Helper function
  const getStakeTypeFromDays = (days: number): StakeType => {
    switch (days) {
      case 30:
        return StakeType.FIXED_30_DAYS;
      case 90:
        return StakeType.FIXED_90_DAYS;
      case 180:
        return StakeType.FIXED_180_DAYS;
      case 365:
        return StakeType.FIXED_365_DAYS;
      default:
        return StakeType.FIXED_30_DAYS;
    }
  };
  
  // Handle staking operation
  const handleStake = async (amount: string, type: StakeType) => {
    if (!isConnected) {
      toast.error('Please connect your wallet first');
      return;
    }
    
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    
    if (parseFloat(amount) < minStakeAmountHSK) {
      toast.error(`Minimum stake amount is ${minStakeAmountHSK} HSK`);
      return;
    }
    
    try {
      setIsSubmitting(true);
      // 发送交易并等待确认
      const stakeTypeNumber = Number(type);
      console.log('Staking with parameters:', {
        amount,
        stakeType: stakeTypeNumber,
        typeOf: typeof stakeTypeNumber
      });
      
      const success = await stakeLocked(amount, stakeTypeNumber);
      
      if (success) {
        toast.success('Staking transaction confirmed successfully');
        setStakeAmount('');
      }
    } catch (error) {
      console.error('Staking failed:', error);
      toast.error('Staking failed. See console for details.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle max button click
  const handleMaxClick = () => {
    if (balanceData?.formatted) {
      setStakeAmount(balanceData.formatted);
    }
  };
  
  return (
    <MainLayout>
      <div className="min-h-screen">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl font-light text-white mb-8">Stake HSK</h1>
            
            {/* 添加数据源指示器 */}
            <div className="mb-4 text-sm">
              <span className="text-slate-400">
                Data Source: {' '}
                {dataSource === 'contract' ? (
                  <span className="text-green-500">Contract (Live Data)</span>
                ) : (
                  <span className="text-yellow-500">Loading...</span>
                )}
              </span>
            </div>
            
            <div className="bg-slate-800/30 backdrop-blur-sm rounded-xl border border-slate-700/50 overflow-hidden mb-8">
              <div className="p-8">
                <h2 className="text-2xl font-light text-white mb-6">Staking Amount</h2>
                
                {/* Amount input section */}
                <div className="mb-8">
                  <label className="block text-slate-300 mb-2">Enter staking amount</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={stakeAmount}
                      onChange={(e) => {
                        const value = e.target.value;
                        // Only allow positive numbers
                        if (value === '' || Number(value) >= 0) {
                          setStakeAmount(value);
                        }
                      }}
                      min="0"
                      placeholder="Enter amount to stake"
                      className="w-full bg-slate-800/50 border border-slate-600 text-white py-4 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <button
                      onClick={handleMaxClick}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-slate-700 text-white px-3 py-1 rounded hover:bg-slate-600 transition-colors text-sm"
                    >
                      MAX
                    </button>
                  </div>
                  <div className="mt-2 text-sm text-slate-400">
                    Available: {balanceData?.formatted || '0'} {balanceData?.symbol || 'HSK'}
                  </div>
                </div>
                
                {/* 添加最小质押金额警告消息 */}
                {stakeAmount && Number(stakeAmount) < minStakeAmountHSK && (
                  <div className="mt-2 text-sm text-yellow-500">
                    <div className="flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      Minimum stake amount is {minStakeAmountHSK} HSK
                    </div>
                  </div>
                )}
                
                <h2 className="text-2xl font-light text-white mb-6">Select Lock Period</h2>
                
                {/* Lock period selection grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                  {statsLoading || aprsLoading ? (
                    // Skeleton loading state
                    Array(4).fill(0).map((_, index) => (
                      <div key={index} className="p-6 rounded-lg border border-slate-700 bg-slate-800/30 animate-pulse">
                        <div className="h-6 bg-slate-700 rounded mb-4 w-3/4"></div>
                        <div className="h-4 bg-slate-700 rounded mb-2 w-full"></div>
                        <div className="h-4 bg-slate-700 rounded mb-2 w-2/3"></div>
                        <div className="h-4 bg-slate-700 rounded w-1/2"></div>
                      </div>
                    ))
                  ) : (
                    // Actual staking options
                    stakingOptions.map((option, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedDays(option.duration)}
                        className={`p-6 rounded-lg border ${
                          selectedDays === option.duration
                            ? 'border-primary bg-primary/10 ring-2 ring-primary/20'
                            : 'border-slate-700 hover:border-primary/50 bg-slate-800/30'
                        } transition-all text-left`}
                        type="button"
                      >
                        <div className="text-lg font-medium text-white mb-2">{option.title}</div>
                        <div className="flex justify-between items-center mb-1">
                          <div className="text-sm text-slate-400">Duration</div>
                          <div className="text-base text-white">{option.duration} days</div>
                        </div>
                        <div className="flex justify-between items-center mb-1">
                          <div className="text-sm text-slate-400">APR</div>
                          <div className="text-lg font-bold text-cyan-400">{option.apr.toFixed(2)}%</div>
                        </div>
                        <div className="flex justify-between items-center">
                          <div className="text-sm text-slate-400">Bonus</div>
                          {option.bonus > 0 ? (
                            <div className="text-sm text-emerald-400">+{option.bonus.toFixed(2)}%</div>
                          ) : (
                            <div className="text-sm text-slate-500">+0.00%</div>
                          )}
                        </div>
                        {option.maxApr > option.apr && (
                          <div className="mt-2 text-xs text-emerald-400 font-medium">
                            Up to {option.maxApr.toFixed(2)}% APR
                          </div>
                        )}
                      </button>
                    ))
                  )}
                </div>
                
                {/* Submit button */}
                <button
                  onClick={() => handleStake(stakeAmount, getStakeTypeFromDays(selectedDays))}
                  disabled={!isConnected || isSubmitting || isPending || !stakeAmount || Number(stakeAmount) < minStakeAmountHSK}
                  className="w-full bg-primary hover:bg-primary/90 text-white font-medium py-4 px-4 rounded-lg transition-colors disabled:bg-slate-600 disabled:cursor-not-allowed"
                >
                  {isPending 
                    ? 'Awaiting wallet confirmation...' 
                    : isConfirming 
                      ? 'Confirming transaction...' 
                      : 'Confirm Staking'}
                </button>
              </div>
            </div>

            <div className="bg-slate-800/30 backdrop-blur-sm rounded-xl border border-slate-700/50 p-8">
              <h3 className="font-medium text-white mb-6 flex items-center gap-2">
                <svg className="w-5 h-5 text-primary/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Staking Information
              </h3>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 mt-0.5 text-primary/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4" />
                  </svg>
                  <span className="text-slate-300">Stake HSK tokens to earn competitive annual returns</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 mt-0.5 text-primary/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4" />
                  </svg>
                  <span className="text-slate-300">Longer lock periods provide higher rewards</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 mt-0.5 text-primary/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                  <span className="text-slate-300">Staking rewards automatically compound</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 mt-0.5 text-primary/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2z" />
                  </svg>
                  <span className="text-slate-300">Received stHSK represents your share in the staking pool</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}