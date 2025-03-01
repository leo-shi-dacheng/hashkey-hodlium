'use client';

import React, { useState } from 'react';
import MainLayout from '../main-layout';
import { StakeType } from '@/types/contracts';
import { useAccount, useBalance } from 'wagmi';
import { useStakeLocked, useStakingInfo } from '@/hooks/useStakingContracts';
import { toast } from 'react-toastify';

export default function StakePage() {
  const { address, isConnected } = useAccount();
  const { data: balanceData } = useBalance({
    address: address,
  });
  const { stakingStats, isLoading: statsLoading } = useStakingInfo();
  const { 
    stakeLocked, 
    isPending,
    isConfirming,
  } = useStakeLocked();
  
  // State to track selected duration and transaction status
  const [selectedDays, setSelectedDays] = useState(30);
  const [stakeAmount, setStakeAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Extract staking options from contract data
  const getStakingOptions = () => {
    if (!stakingStats) return [];
    
    // Default options when contract data is not available
    const defaultOptions = [
      {
        title: '30 Day Lock',
        duration: 30,
        durationDisplay: '30 days',
        apr: 1.20,
        bonus: 0,
        maxApr: 1.20,
        stakeType: StakeType.FIXED_30_DAYS
      },
      {
        title: '90 Day Lock',
        duration: 90,
        durationDisplay: '90 days',
        apr: 3.50,
        bonus: 8.00,
        maxApr: 3.50,
        stakeType: StakeType.FIXED_90_DAYS
      },
      {
        title: '180 Day Lock',
        duration: 180,
        durationDisplay: '180 days',
        apr: 6.50,
        bonus: 20.00,
        maxApr: 6.50,
        stakeType: StakeType.FIXED_180_DAYS
      },
      {
        title: '365 Day Lock',
        duration: 365,
        durationDisplay: '365 days',
        apr: 12.00,
        bonus: 40.00,
        maxApr: 12.00,
        stakeType: StakeType.FIXED_365_DAYS
      },
      {
        title: '1 Minute Lock (Test)',
        duration: 1/1440,  // 1 minute in days
        durationDisplay: '1 minute',
        apr: 15.00,
        bonus: 50.00,
        maxApr: 15.00,
        stakeType: StakeType.FIXED_1_MINUTE
      },
      {
        title: '3 Minutes Lock (Test)',
        duration: 3/1440,  // 3 minutes in days
        durationDisplay: '3 minutes',
        apr: 17.50,
        bonus: 75.00,
        maxApr: 17.50,
        stakeType: StakeType.FIXED_3_MINUTES
      },
      {
        title: '5 Minutes Lock (Test)',
        duration: 5/1440,  // 5 minutes in days
        durationDisplay: '5 minutes',
        apr: 20.00,
        bonus: 100.00,
        maxApr: 20.00,
        stakeType: StakeType.FIXED_5_MINUTES
      },
    ];
    
    // If no contract data or missing required properties, return default options
    if (!stakingStats || !stakingStats.currentAPRs || !stakingStats.maxPossibleAPRs) {
      console.log('Using default staking options');
      return defaultOptions;
    }
    
    try {
      console.log('Calculating staking options from contract data:', stakingStats);
      
      // Extract data and calculate
      return [
        {
          title: '30 Day Lock',
          duration: 30,
          durationDisplay: '30 days',
          apr: Number(stakingStats.currentAPRs[0] || BigInt(0)) / 100,
          bonus: stakingStats.baseBonus ? Number(stakingStats.baseBonus[0] || BigInt(0)) / 100 : 0,
          maxApr: Number(stakingStats.maxPossibleAPRs[0] || BigInt(0)) / 100,
          stakeType: StakeType.FIXED_30_DAYS
        },
        {
          title: '90 Day Lock',
          duration: 90,
          durationDisplay: '90 days',
          apr: Number(stakingStats.currentAPRs[1] || BigInt(0)) / 100,
          bonus: stakingStats.baseBonus ? Number(stakingStats.baseBonus[1] || BigInt(0)) / 100 : 0,
          maxApr: Number(stakingStats.maxPossibleAPRs[1] || BigInt(0)) / 100,
          stakeType: StakeType.FIXED_90_DAYS
        },
        {
          title: '180 Day Lock',
          duration: 180,
          durationDisplay: '180 days',
          apr: Number(stakingStats.currentAPRs[2] || BigInt(0)) / 100,
          bonus: stakingStats.baseBonus ? Number(stakingStats.baseBonus[2] || BigInt(0)) / 100 : 0,
          maxApr: Number(stakingStats.maxPossibleAPRs[2] || BigInt(0)) / 100,
          stakeType: StakeType.FIXED_180_DAYS
        },
        {
          title: '365 Day Lock',
          duration: 365,
          durationDisplay: '365 days',
          apr: Number(stakingStats.currentAPRs[3] || BigInt(0)) / 100,
          bonus: stakingStats.baseBonus ? Number(stakingStats.baseBonus[3] || BigInt(0)) / 100 : 0,
          maxApr: Number(stakingStats.maxPossibleAPRs[3] || BigInt(0)) / 100,
          stakeType: StakeType.FIXED_365_DAYS
        },
        // 测试选项使用默认值，因为合约不返回这些数据
        {
          title: '1 Minute Lock (Test)',
          duration: 1/1440,  // 1 minute in days
          durationDisplay: '1 minute',
          apr: 15.00, // 使用默认值
          bonus: 50.00, // 使用默认值
          maxApr: 15.00, // 使用默认值
          stakeType: StakeType.FIXED_1_MINUTE
        },
        {
          title: '3 Minutes Lock (Test)',
          duration: 3/1440,  // 3 minutes in days
          durationDisplay: '3 minutes',
          apr: 17.50, // 使用默认值
          bonus: 75.00, // 使用默认值
          maxApr: 17.50, // 使用默认值
          stakeType: StakeType.FIXED_3_MINUTES
        },
        {
          title: '5 Minutes Lock (Test)',
          duration: 5/1440,  // 5 minutes in days
          durationDisplay: '5 minutes',
          apr: 20.00, // 使用默认值
          bonus: 100.00, // 使用默认值
          maxApr: 20.00, // 使用默认值
          stakeType: StakeType.FIXED_5_MINUTES
        },
      ];
    } catch (error) {
      console.error('Error processing staking stats:', error);
      return defaultOptions; // Return default options on error
    }
  };
  
  const stakingOptions = getStakingOptions();
  
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
      case 1/1440:  // 1 minute
        return StakeType.FIXED_1_MINUTE;
      case 3/1440:  // 3 minutes
        return StakeType.FIXED_3_MINUTES;
      case 5/1440:  // 5 minutes
        return StakeType.FIXED_5_MINUTES;
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
    
    try {
      setIsSubmitting(true);
      // 发送交易并等待确认
      const success = await stakeLocked(amount, type);
      
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
                
                {/* Add minimum stake warning message */}
                {stakeAmount && Number(stakeAmount) < 100 && (
                  <div className="mt-2 text-sm text-yellow-500">
                    <div className="flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      Minimum stake amount is 100 HSK
                    </div>
                  </div>
                )}
                
                <h2 className="text-2xl font-light text-white mb-6">Select Lock Period</h2>
                
                {/* Lock period selection grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
                  {statsLoading ? (
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
                          <div className="text-base text-white">{option.durationDisplay}</div>
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
                      </button>
                    ))
                  )}
                </div>
                
                {/* Submit button */}
                <button
                  onClick={() => handleStake(stakeAmount, getStakeTypeFromDays(selectedDays))}
                  disabled={!isConnected || isSubmitting || isPending || !stakeAmount || Number(stakeAmount) < 100}
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