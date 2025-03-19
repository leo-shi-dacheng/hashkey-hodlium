'use client';

import React, { useState, useEffect, useMemo } from 'react';
import MainLayout from '../main-layout';
import { StakeType } from '@/types/contracts';
import { useAccount, useBalance } from 'wagmi';
import { useStakingInfo } from '@/hooks/useStakingContracts';
import { useNewAllStakingAPRs, useNewStakeLocked } from '@/hooks/useNewStakingContracts';
import { toast } from 'react-toastify';
import { formatEther } from 'viem';
import Link from 'next/link';

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
  const { stakingRates, currentAPR, isLoading: aprsLoading } = useNewAllStakingAPRs(simulationAmount);
  
  const { 
    stakeLocked, 
    isPending,
    isConfirming,
    error: stakeError
  } = useNewStakeLocked();
  
  // State to track selected stake type and transaction status
  const [selectedStakeType, setSelectedStakeType] = useState(StakeType.FIXED_30_DAYS);
  const [stakeAmount, setStakeAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // State to track data source
  const [dataSource, setDataSource] = useState<'contract' | 'loading'>('loading');
  
  // 从URL参数中获取默认选择的质押类型
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const typeParam = params.get('type');
    
    if (typeParam !== null) {
      const typeNumber = parseInt(typeParam, 10);
      if (Object.values(StakeType).includes(typeNumber)) {
        setSelectedStakeType(typeNumber);
      }
      console.log('Selected stake type from URL:', typeNumber);
    }
  }, []);
  
  // 更新数据源状态
  useEffect(() => {
    if (!statsLoading && !aprsLoading && stakingStats && stakingRates) {
      setDataSource('contract');
    } else {
      setDataSource('loading');
    }
  }, [statsLoading, aprsLoading, stakingStats, stakingRates]);
  
  // 从合约数据中提取质押选项
  const stakingOptions = useMemo(() => {
    if (aprsLoading || !stakingRates) {
      console.log('APR data is still loading');
      return [];
    }
    
    try {
      console.log('Contract APR data available:', {
        stakingRates: {
          rate0Days: stakingRates.rate0Days.toString(),
          rate30Days: stakingRates.rate30Days.toString(),
          rate90Days: stakingRates.rate90Days.toString(),
          rate180Days: stakingRates.rate180Days.toString(),
          rate365Days: stakingRates.rate365Days.toString()
        },
        currentAPR: currentAPR?.toString() || '0'
      });
      // 计算格式化的APR值 - 从基点转换 (1/100 of a percent)
      const apr30 = Number(stakingRates.rate30Days) / 100;
      const apr90 = Number(stakingRates.rate90Days) / 100;
      const apr180 = Number(stakingRates.rate180Days) / 100;
      const apr365 = Number(stakingRates.rate365Days) / 100;
      
       // 硬编码的bonus值，按照图片中显示的数值
       const bonus30 = 0.00;  // 30天锁定期：+0.00%
       const bonus90 = 0.00;  // 90天锁定期：+0.00%
       const bonus180 = 0.00; // 180天锁定期：+0.00%
       const bonus365 = 0.00; // 365天锁定期：+0.00%
      
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
          maxApr: apr30 + bonus30,
          stakeType: StakeType.FIXED_30_DAYS
        },
        {
          title: '90 Day Lock',
          duration: 90,
          durationDisplay: '90 days',
          apr: apr90,
          bonus: bonus90,
          maxApr: apr90 + bonus90,
          stakeType: StakeType.FIXED_90_DAYS
        },
        {
          title: '180 Day Lock',
          duration: 180,
          durationDisplay: '180 days',
          apr: apr180,
          bonus: bonus180,
          maxApr: apr180 + bonus180,
          stakeType: StakeType.FIXED_180_DAYS
        },
        {
          title: '365 Day Lock',
          duration: 365,
          durationDisplay: '365 days',
          apr: apr365,
          bonus: bonus365,
          maxApr: apr365 + bonus365,
          stakeType: StakeType.FIXED_365_DAYS
        }
      ];
    } catch (error) {
      console.error('Error processing APR data:', error);
      return []; // 出错时返回空数组
    }
  }, [stakingRates, currentAPR, aprsLoading]);
  
  // 获取最小质押金额（以HSK为单位）
  const minStakeAmountHSK = useMemo(() => {
    if (!minStakeAmount) return 100; // 默认值
    return Number(formatEther(minStakeAmount));
  }, [minStakeAmount]);
  
  // Handle staking operation
  const handleStake = async (amount: string, stakeType: StakeType) => {
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
      
      console.log('Staking with parameters:', {
        amount,
        stakeType
      });
      
      const success = await stakeLocked(amount, stakeType);
      
      if (success) {
        toast.success('Staking transaction confirmed successfully');
        setStakeAmount('');
      }
    } catch (error) {
      console.error('Staking failed:', error);
      toast.error(stakeError?.message || 'Staking failed. See console for details.');
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
                
                {/* 添加选中方案的摘要信息 */}
                {stakingOptions.length > 0 && (
                  <div className="mt-4 mb-4 p-3 bg-slate-700/30 rounded-lg border border-slate-600/50">
                    <div className="text-sm text-white">
                      <span className="text-cyan-400 font-medium">Selected Plan: </span>
                      <span className="text-white">{stakingOptions.find(opt => opt.stakeType === selectedStakeType)?.title}</span>
                      <span className="mx-2 text-slate-500">|</span>
                      <span className="text-cyan-400 font-medium">Duration: </span>
                      <span className="text-white">{stakingOptions.find(opt => opt.stakeType === selectedStakeType)?.durationDisplay}</span>
                      <span className="mx-2 text-slate-500">|</span>
                      <span className="text-cyan-400 font-medium">APR: </span>
                      <span className="text-cyan-300 font-semibold">{stakingOptions.find(opt => opt.stakeType === selectedStakeType)?.apr.toFixed(2) || '0.00'}%</span>
                    </div>
                  </div>
                )}
                
                <h2 className="text-2xl font-light text-white mb-6">Select Lock Period</h2>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                  {statsLoading || aprsLoading ? (
                    Array(4).fill(0).map((_, index) => (
                      <div key={index} className="p-6 rounded-lg border border-slate-700 bg-slate-800/30 animate-pulse">
                        <div className="h-6 bg-slate-700 rounded mb-4 w-3/4"></div>
                        <div className="h-4 bg-slate-700 rounded mb-2 w-full"></div>
                        <div className="h-4 bg-slate-700 rounded mb-2 w-2/3"></div>
                        <div className="h-4 bg-slate-700 rounded w-1/2"></div>
                      </div>
                    ))
                  ) : (
                    stakingOptions.map((option, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedStakeType(option.stakeType)}
                        className={`p-6 rounded-lg border ${
                          selectedStakeType === option.stakeType
                            ? 'border-primary bg-primary/20 ring-4 ring-primary/30 shadow-lg shadow-primary/10'
                            : 'border-slate-700 hover:border-primary/50 bg-slate-800/30'
                        } transition-all text-left relative`}
                        type="button"
                      >
                        {selectedStakeType === option.stakeType && (
                          <div className="absolute top-2 right-2 bg-primary rounded-full p-1">
                            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        )}
                        <div className={`text-xl ${selectedStakeType === option.stakeType ? 'text-cyan-300 font-bold' : 'text-white'} mb-2`}>
                          {option.title}
                        </div>
                        <div className="flex justify-between items-center mb-1">
                          <div className={`text-sm ${selectedStakeType === option.stakeType ? 'text-cyan-400 font-medium' : 'text-slate-400'}`}>Duration</div>
                          <div className={`text-base ${selectedStakeType === option.stakeType ? 'text-white font-semibold' : 'text-white'}`}>
                            {option.duration} days
                          </div>
                        </div>
                        <div className="flex justify-between items-center mb-1">
                          <div className={`text-sm ${selectedStakeType === option.stakeType ? 'text-cyan-400 font-medium' : 'text-slate-400'}`}>APR</div>
                          <div className={`text-xl font-bold ${selectedStakeType === option.stakeType ? 'text-cyan-300' : 'text-cyan-400'}`}>
                            {option.apr.toFixed(2)}%
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
                
                <button
                  onClick={() => handleStake(stakeAmount, selectedStakeType)}
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
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 mt-0.5 text-primary/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-slate-300">
                    <Link 
                      href="/disclaimer" 
                      className="text-white hover:text-primary transition-colors"
                    >
                      View Staking Disclaimer and Risk Warning
                    </Link>
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}