'use client';

import React, { useState, useEffect } from 'react';
import MainLayout from '../main-layout';
import { StakeType } from '@/types/contracts';
import { formatBigInt } from '@/utils/format';
import { useAccount } from 'wagmi';
import Link from 'next/link';
import { useStakingInfo, useAllStakingAPRs } from '@/hooks/useStakingContracts';
import { useOldStakingInfo } from '@/hooks/useOldStakingContracts';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import Image from 'next/image';
import AddressBar from '@/components/AddressBar';
import StartStake from '@/components/app/StartStake';
import CalApr from '@/components/app/CalApr';

export default function Home() {
  // 添加本地loading状态，初始为true
  const [initialLoading, setInitialLoading] = useState(true);
  const [simulatedAmount, setSimulatedAmount] = useState('1000');
  const [debouncedAmount, setDebouncedAmount] = useState(simulatedAmount);
  const { address: _address, isConnected } = useAccount();
  const { totalStaked, stakingStats, exchangeRate, isLoading: apiLoading } = useStakingInfo(debouncedAmount);
  const { totalStaked: oldTotalStaked, isLoading: oldApiLoading } = useOldStakingInfo(debouncedAmount);
  const { estimatedAPRs, maxAPRs, isLoading: aprsLoading } = useAllStakingAPRs(debouncedAmount);
  const router = useRouter();
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [serverTime, setServerTime] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLaunched, setIsLaunched] = useState(false);
  const [isAppEnabled, setIsAppEnabled] = useState(false);
  const [aprDataSource, setAprDataSource] = useState<'contract' | 'loading'>('loading');
  
  // 结合API加载状态和初始加载状态
  const isLoadingCombined = initialLoading || apiLoading || aprsLoading;
  
  // Beijing launch time - March 3, 2025 20:00:00
  const launchTime = new Date('2025-03-01T20:00:00+08:00').getTime();

  // 检查环境变量
  useEffect(() => {
    const appEnabled = process.env.NEXT_PUBLIC_APP_ENABLED === 'true';
    setIsAppEnabled(appEnabled);
    console.log('App enabled from env:', appEnabled);
  }, []);

  // 获取服务器时间并检查是否已经发布
  useEffect(() => {
    const fetchServerTime = async () => {
      try {
        const response = await axios.get('/api/time');
        const serverTimeStamp = new Date(response.data.time).getTime();
        const serverTimeObj = new Date(serverTimeStamp);
        setServerTime(serverTimeObj);
        
        // 检查是否已过发布时间
        const isPastLaunchTime = serverTimeStamp >= launchTime;
        setIsLaunched(isPastLaunchTime);
        setIsLoading(false);
        
        console.log('Server time:', serverTimeObj);
        console.log('Launch time:', new Date(launchTime));
        console.log('Is past launch time:', isPastLaunchTime);
      } catch (error) {
        console.error('Failed to fetch server time:', error);
        // 如果获取服务器时间失败，使用客户端时间
        const now = new Date();
        setServerTime(now);
        setIsLaunched(now.getTime() >= launchTime);
        setIsLoading(false);
      }
    };

    fetchServerTime();
  }, [launchTime]);

  // 设置倒计时间隔
  useEffect(() => {
    if (!serverTime || isLaunched) return;

    const calculateTimeLeft = () => {
      // 基于服务器时间 + 自获取以来的经过时间计算
      const elapsedSinceFetch = Date.now() - serverTime.getTime();
      const adjustedNow = new Date(serverTime.getTime() + elapsedSinceFetch);
      const timeDiff = launchTime - adjustedNow.getTime();
      
      if (timeDiff <= 0) {
        setIsLaunched(true);
        return { days: 0, hours: 0, minutes: 0, seconds: 0 };
      }
      
      const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);
      
      return { days, hours, minutes, seconds };
    };

    setTimeLeft(calculateTimeLeft());
    
    const interval = setInterval(() => {
      const newTimeLeft = calculateTimeLeft();
      setTimeLeft(newTimeLeft);
      
      // 如果倒计时结束，刷新页面
      if (newTimeLeft.days === 0 && newTimeLeft.hours === 0 && 
          newTimeLeft.minutes === 0 && newTimeLeft.seconds === 0) {
        window.location.reload();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [serverTime, isLaunched, launchTime]);
  
  // 当数据加载完成后，关闭初始加载状态
  useEffect(() => {
    if (!apiLoading && totalStaked !== undefined && oldTotalStaked !== undefined) {
      // 添加一个小延迟，确保UI平滑过渡
      const timer = setTimeout(() => {
        setInitialLoading(false);
      }, 100);
      console.log('Total staked:', totalStaked);
      console.log('Old total staked:', oldTotalStaked);
      return () => clearTimeout(timer);
    }
  }, [apiLoading, totalStaked, oldTotalStaked]);
  
  // Add debounce processing
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedAmount(simulatedAmount);
    }, 500);
    
    return () => clearTimeout(timer);
  }, [simulatedAmount]);
  
  // Update APR data source when loading state changes
  useEffect(() => {
    if (!aprsLoading && estimatedAPRs && maxAPRs) {
      setAprDataSource('contract');
    } else {
      setAprDataSource('loading');
    }
  }, [aprsLoading, estimatedAPRs, maxAPRs]);
  
  // Extract APR and reward information from contract data
  const stakingOptions = React.useMemo(() => {
    // If data is still loading, return empty array
    if (aprsLoading || !estimatedAPRs || !maxAPRs) {
      console.log('APR data is still loading');
      setAprDataSource('loading');
      return [];
    }
    
    try {
      console.log('Contract APR data available:', {
        estimatedAPRs: estimatedAPRs.map(apr => apr.toString()),
        maxAPRs: maxAPRs.map(apr => apr.toString())
      });
      
      setAprDataSource('contract');
      
      // Calculate formatted APR values
      const apr30 = Number(estimatedAPRs[0] || BigInt(0)) / 100;
      const apr90 = Number(estimatedAPRs[1] || BigInt(0)) / 100;
      const apr180 = Number(estimatedAPRs[2] || BigInt(0)) / 100;
      const apr365 = Number(estimatedAPRs[3] || BigInt(0)) / 100;
      const aprFlexible = Number(estimatedAPRs[4] || BigInt(0)) / 100;
      const maxApr30 = Number(maxAPRs[0] || BigInt(0)) / 100;
      const maxApr90 = Number(maxAPRs[1] || BigInt(0)) / 100;
      const maxApr180 = Number(maxAPRs[2] || BigInt(0)) / 100;
      const maxApr365 = Number(maxAPRs[3] || BigInt(0)) / 100;
      const maxAprFlexible = Number(maxAPRs[4] || BigInt(0)) / 100;
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
      
      console.log('Contract APR values (formatted):', {
        '30 days': {
          estimated: apr30.toFixed(2) + '%',
          max: maxApr30.toFixed(2) + '%'
        },
        '90 days': {
          estimated: apr90.toFixed(2) + '%',
          max: maxApr90.toFixed(2) + '%'
        },
        '180 days': {
          estimated: apr180.toFixed(2) + '%',
          max: maxApr180.toFixed(2) + '%'
        },
        '365 days': {
          estimated: apr365.toFixed(2) + '%',
          max: maxApr365.toFixed(2) + '%'
        }
      });
      
      // Extract data and calculate
      return [
        {
          title: 'Flexible',
          duration: 0,
          durationDisplay: 'Flexible',
          apr: aprFlexible,
          bonus: bonus30,
          maxApr: maxAprFlexible,
          stakeType: StakeType.FLEXIBLE
        },
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
      setAprDataSource('loading');
      return []; // Return empty array on error
    }
  }, [estimatedAPRs, maxAPRs, aprsLoading]);
  
  // 显示加载状态
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-black">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  
  // 在首页的合适位置添加数据来源指示器
  const renderDataSourceIndicator = () => {
    return (
      <div className="mb-4 text-sm">
        <span className="text-slate-400">
          APR Data Source: {' '}
          {aprDataSource === 'contract' ? (
            <span className="text-green-500">Contract (Live Data)</span>
          ) : (
            <span className="text-yellow-500">Loading...</span>
          )}
        </span>
      </div>
    );
  };
  
  // 已发布且应用已启用：显示主内容
  return (
    <MainLayout>
      <div className="min-h-screen text-white">
        {/* Hero Section */}
        <div className="container mx-auto px-4 pt-16 pb-8">
        <CalApr />
        {/* <div className="container mx-auto px-4 pt-16 pb-24"> */}
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
            {/* Total Staked Card */}
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-8 border border-slate-700/50 transition-all hover:border-primary/30 hover:bg-slate-800/80">
              <div className="flex items-center gap-2 mb-4">
                <svg className="w-6 h-6 text-primary/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 12a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z" />
                </svg>
                <h3 className="text-sm font-medium text-slate-300">Total Staked</h3>
              </div>
              {isLoadingCombined ? (
                <div className="animate-pulse">
                  <div className="h-8 bg-slate-700 rounded w-32"></div>
                </div>
              ) : (
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-light tracking-tight text-white">
                    {typeof totalStaked === 'bigint' ? formatBigInt(totalStaked + oldTotalStaked) : '0'}
                  </span>
                  <span className="text-lg font-light text-slate-400">HSK</span>
                </div>
              )}
            </div>

            {/* Exchange Rate Card */}
            {/* <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-8 border border-slate-700/50 transition-all hover:border-primary/30 hover:bg-slate-800/80">
              <div className="flex items-center gap-2 mb-4">
                <svg className="w-6 h-6 text-primary/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7h12M3 12h8m-8 5h16" />
                </svg>
                <h3 className="text-sm font-medium text-slate-300">Current Rate</h3>
                <div className="tooltip tooltip-right" data-tip="Rate increases as rewards accumulate">
                  <svg className="w-4 h-4 text-primary/40 hover:text-primary/60 transition-colors cursor-help" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              {isLoadingCombined ? (
                <div className="animate-pulse flex items-center">
                  <div className="h-8 bg-slate-700 rounded w-8 mr-2"></div>
                  <div className="h-8 bg-slate-700 rounded w-16 mx-2"></div>
                  <div className="h-8 bg-slate-700 rounded w-24 ml-2"></div>
                </div>
              ) : (
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-light tracking-tight text-white">1</span>
                  <span className="text-lg font-light text-slate-400">stHSK</span>
                  <span className="text-slate-500">=</span>
                  <span className="text-3xl font-light tracking-tight text-white">
                    {typeof exchangeRate === 'bigint' ? formatBigInt(exchangeRate) : '1'}
                  </span>
                  <span className="text-lg font-light text-slate-400">HSK</span>
                </div>
              )}
            </div> */}
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-8 border border-slate-700/50 transition-all hover:border-primary/30 hover:bg-slate-800/80">
              <div className="flex items-center gap-2 mb-4">
                <svg className="w-6 h-6 text-primary/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7h12M3 12h8m-8 5h16" />
                </svg>
                <h3 className="text-sm font-medium text-slate-300">MAX APR</h3>
                <div className="tooltip tooltip-right" data-tip="Rate increases as rewards accumulate">
                  <svg className="w-4 h-4 text-primary/40 hover:text-primary/60 transition-colors cursor-help" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              {isLoadingCombined ? (
                <div className="animate-pulse">
                  <div className="h-8 bg-slate-700 rounded w-24"></div>
                </div>
              ) : (
                <div className="flex items-baseline gap-2">
                  <span className="text-lg font-light text-slate-400">Up to</span>
                  <span className="text-4xl font-light tracking-tight text-green-500">36</span>
                  <span className="text-lg font-light text-slate-400">%</span>
                </div>
              )}
            </div>


            {/* Reward Interval Card */}
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-8 border border-slate-700/50 transition-all hover:border-primary/30 hover:bg-slate-800/80">
              <div className="flex items-center gap-2 mb-4">
                <svg className="w-6 h-6 text-primary/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="text-sm font-medium text-slate-300">Reward Interval</h3>
              </div>
              {isLoadingCombined ? (
                <div className="animate-pulse">
                  <div className="h-8 bg-slate-700 rounded w-24"></div>
                </div>
              ) : (
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-light tracking-tight text-white">1 Block</span>
                  {/*  这里要修改！！！ */}
                  {/* <span className="text-3xl font-light tracking-tight text-green-500">{}</span>
                  <span className="text-3xl font-light tracking-tight text-white">hsk</span> */}
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Staking Options Section */}
        <div className="container mx-auto px-4 py-16 bg-slate-800/30">
          <h2 className="text-3xl font-light mb-10 text-center text-white">Staking Options</h2>
          <div className="flex justify-center mb-8">
            {renderDataSourceIndicator()}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-16">
            {stakingOptions.map((option, index) => (
              <div key={index} className="bg-slate-800/30 backdrop-blur-sm rounded-xl border border-slate-700/50 overflow-hidden hover:border-primary/30 transition-all">
                <div className="p-6 border-b border-slate-700/50 text-center">
                  <h3 className="text-xl font-medium text-white">{option.title}</h3>
                </div>
                
                <div className="p-6 space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Duration</span>
                    <span className="text-white font-medium">{option.durationDisplay}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Current APR</span>
                    <span className="text-cyan-400 font-medium text-xl">{option.apr.toFixed(2)}%</span>
                  </div>
                  
                  {/* <div className="flex justify-between items-center">
                    <span className="text-slate-400">Lock Reward</span>
                    {option.bonus > 0 ? (
                      <span className="text-emerald-400 font-medium">{option.bonus.toFixed(2)}%</span>
                    ) : (
                      <span className="text-slate-400">0.00%</span>
                    )}
                  </div> */}
                  
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 ">Max APR</span>
                    <span className="text-cyan-400 font-medium text-xl">{option.maxApr.toFixed(2)}%</span>
                  </div>
                </div>
                
                <div className="p-6 border-t border-slate-700/50">
                  <Link 
                    href={`/stake?type=${option.stakeType}`} 
                    className="block w-full py-3 text-center bg-primary/80 text-white rounded-lg hover:bg-primary transition-colors"
                  >
                    Select
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}