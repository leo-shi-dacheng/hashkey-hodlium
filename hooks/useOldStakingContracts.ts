'use client';

import { useAccount, useWriteContract, useChainId, usePublicClient, useWalletClient, useContractWrite } from 'wagmi';
import { getContractAddresses } from '@/config/contracts';
import { StakeType, StakingStats } from '@/types/contracts';
import { parseEther } from '@/utils/format';
import { HashKeyChainStakingABI } from '@/constants/oldAbi';
import { useState, useEffect } from 'react';
import { waitForTransactionReceipt, writeContract } from 'wagmi/actions';
import { config } from '@/app/providers';

export const stakeTypeMap = {
  "30days": 0,  // FIXED_30_DAYS
  "90days": 1,  // FIXED_90_DAYS
  "180days": 2, // FIXED_180_DAYS
  "365days": 3  // FIXED_365_DAYS
};

// 获取质押合约的基本信息
export function useOldStakingInfo(simulatedAmount: string = '1000') {
  const chainId = useChainId();
  const contractAddress = getContractAddresses(chainId).stakingOldContract;
  const simulatedAmountWei = parseEther(simulatedAmount || '0');
  const publicClient = usePublicClient();
  
  const [data, setData] = useState<{
    totalStaked: bigint;
    stakingStats: StakingStats | null;
    exchangeRate: bigint;
    minStakeAmount: bigint;
    isLoading: boolean;
  }>({
    totalStaked: BigInt(0),
    stakingStats: null,
    exchangeRate: BigInt(0),
    minStakeAmount: BigInt(0),
    isLoading: true,
  });
  
  useEffect(() => {
    const fetchStakingInfo = async () => {
      if (!publicClient || !contractAddress) return;
      
      setData(prev => ({ ...prev, isLoading: true }));
      
      try {
        console.log('Fetching staking info with amount:', simulatedAmountWei.toString());
        
        // 获取总质押量
        const totalValueLocked = await publicClient.readContract({
          address: contractAddress as `0x${string}`,
          abi: HashKeyChainStakingABI,
          functionName: 'totalValueLocked',
        });
        console.log('old totalValueLocked', totalValueLocked);
        
        // 获取质押统计信息，传入模拟金额
        const currentExchangeRate = 0n;
        const minStakeAmount = 0n;
        // const detailedStakingStats = await publicClient.readContract({
        //   address: contractAddress as `0x${string}`,
        //   abi: HashKeyChainStakingABI,
        //   functionName: 'getDetailedStakingStats',
        //   args: [simulatedAmountWei], // 使用模拟金额作为参数
        // });
        
        // // 获取当前兑换率
        // const currentExchangeRate = await publicClient.readContract({
        //   address: contractAddress as `0x${string}`,
        //   abi: HashKeyChainStakingABI,
        //   functionName: 'getCurrentExchangeRate',
        // });
        
        // // 获取最小质押金额
        // const minStakeAmount = await publicClient.readContract({
        //   address: contractAddress as `0x${string}`,
        //   abi: HashKeyChainStakingABI,
        //   functionName: 'minStakeAmount',
        // });
        
        setData({
          totalStaked: totalValueLocked as bigint,
          stakingStats: null,
          exchangeRate: currentExchangeRate as bigint,
          minStakeAmount: minStakeAmount as bigint,
          isLoading: false,
        });
        
      } catch (error) {
        console.error('Failed to fetch staking info:', error);
        setData(prev => ({ ...prev, isLoading: false }));
      }
    };
    
    fetchStakingInfo();
  }, [publicClient, contractAddress, simulatedAmountWei]);
  
  return data;
}

// 获取用户的质押信息
export function useUserStakingInfo(queryAddress?: string) {
  const { address } = useAccount();
  const chainId = useChainId();
  const [isLoading, setIsLoading] = useState(true);
  const [lockedStakeCount, setLockedStakeCount] = useState<bigint>(BigInt(0));
  const [activeLockedStakes, setActiveLockedStakes] = useState<bigint>(BigInt(0));
  
  // 获取当前配置的客户端
  const publicClient = usePublicClient();

  useEffect(() => {
    const fetchStakingInfo = async () => {
      const targetAddress = queryAddress || address;
      if (!targetAddress || !publicClient) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const contractAddress = getContractAddresses(chainId).stakingOldContract;
        
        // 使用当前配置的客户端进行合约调用
        const count = await publicClient.readContract({
          address: contractAddress,
          abi: HashKeyChainStakingABI,
          functionName: 'getUserLockedStakeCount',
          args: [targetAddress],
        });
        
        const active = await publicClient.readContract({
          address: contractAddress,
          abi: HashKeyChainStakingABI,
          functionName: 'getUserActiveLockedStakes',
          args: [targetAddress],
        });

        setLockedStakeCount(count as bigint);
        setActiveLockedStakes(active as bigint);
      } catch (error) {
        console.error('Failed to fetch staking info:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStakingInfo();
  }, [address, chainId, publicClient, queryAddress]);

  return {
    lockedStakeCount,
    activeLockedStakes,
    isLoading,
  };
}

// 质押hooks
export function useStake() {
  const chainId = useChainId();
  const contractAddress = getContractAddresses(chainId).stakingOldContract;
  const { writeContractAsync, isPending } = useWriteContract();

  const stake = async (amount: string) => {
    const amountWei = parseEther(amount);
    return writeContractAsync({
      address: contractAddress,
      abi: HashKeyChainStakingABI,
      functionName: 'stake',
      value: amountWei
    });
  };

  return { stake, isPending };
}

// 修改 useStakeLocked 钩子
export function useStakeLocked() {
  const chainId = useChainId();
  const contractAddress = getContractAddresses(chainId).stakingOldContract;
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);

  const stakeLocked = async (amount: string, stakeType: StakeType) => {
    try {
      setIsPending(true);
      setError(null);
      
      const amountWei = parseEther(amount);
      
      // 发送交易
      const tx = await writeContract(config, {
        address: contractAddress,
        abi: HashKeyChainStakingABI,
        functionName: 'stakeLocked',
        args: [stakeType],
        value: amountWei,
      });      
      // 等待交易确认
      setIsConfirming(true);
      const receipt = await waitForTransactionReceipt(config, {
        hash: tx,
      });
      
      console.log('Transaction confirmed:', receipt);
      
      // 如果没有抛出错误且交易成功，返回 true
      return receipt.status === 'success';
    } catch (submitError) {
      console.error('Staking failed:', submitError);
      if (submitError instanceof Error) {
        setError(submitError);
      } else {
        setError(new Error('Staking failed'));
      }
      throw submitError;
    } finally {
      setIsPending(false);
      setIsConfirming(false);
    }
  };
  
  return { 
    stakeLocked, 
    isPending,
    isConfirming, // 新增状态跟踪交易确认过程
    error
  };
}

// 解除锁定质押hooks - 修改为等待交易确认
export function useUnstakeLocked() {
  const chainId = useChainId();
  const contractAddress = getContractAddresses(chainId).stakingOldContract;
  const [isPending, setIsPending] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const unstakeLocked = async (stakeId: number) => {
    try {
      setIsPending(true);
      setError(null);
      
      // 发送交易
      const tx = await writeContract(config, {
        address: contractAddress,
        abi: HashKeyChainStakingABI,
        functionName: 'unstakeLocked',
        args: [BigInt(stakeId)]
      });
      
      console.log('Unstake transaction submitted:', tx);
      
      // 等待交易确认
      setIsConfirming(true);
      const receipt = await waitForTransactionReceipt(config, {
        hash: tx,
      });
      
      console.log('Unstake transaction confirmed:', receipt);
      
      // 返回交易状态
      return receipt.status === 'success';
    } catch (submitError) {
      console.error('Unstaking failed:', submitError);
      if (submitError instanceof Error) {
        setError(submitError);
      } else {
        setError(new Error('Unstaking failed'));
      }
      throw submitError;
    } finally {
      setIsPending(false);
      setIsConfirming(false);
    }
  };

  return { unstakeLocked, isPending, isConfirming, error };
}

// 获取锁定质押信息
export function useLockedStakeInfo(stakeId: number | null, queryAddress?: string) {
  const chainId = useChainId();
  const contractAddress = getContractAddresses(chainId).stakingOldContract;
  const publicClient = usePublicClient();
  const { address } = useAccount();
  
  const [data, setData] = useState<{
    sharesAmount: bigint;
    hskAmount: bigint;
    currentHskValue: bigint;
    lockEndTime: bigint;
    isWithdrawn: boolean;
    isLocked: boolean;
    reward: bigint;
    isLoading: boolean;
    error: Error | null;
  }>({
    sharesAmount: BigInt(0),
    hskAmount: BigInt(0),
    currentHskValue: BigInt(0),
    lockEndTime: BigInt(0),
    isWithdrawn: false,
    isLocked: false,
    reward: BigInt(0),
    isLoading: false,
    error: null
  });
  
  useEffect(() => {
    const targetAddress = queryAddress || address;
    if (!publicClient || !contractAddress || !targetAddress || stakeId === null) return;
    
    const fetchStakeInfo = async () => {
      setData(prev => ({ ...prev, isLoading: true, error: null }));
      try {
        // 调用合约获取锁定质押信息
        const stakeInfo = await publicClient.readContract({
          address: contractAddress,
          abi: HashKeyChainStakingABI,
          functionName: 'getLockedStakeInfo',
          args: [targetAddress, BigInt(stakeId)]
        }) as [bigint, bigint, bigint, bigint, boolean, boolean];
        
        // 计算收益
        const reward = stakeInfo[2] - stakeInfo[1];
        
        setData({
          sharesAmount: stakeInfo[0],
          hskAmount: stakeInfo[1],
          currentHskValue: stakeInfo[2],
          lockEndTime: stakeInfo[3],
          isWithdrawn: stakeInfo[4],
          isLocked: stakeInfo[5],
          reward: reward,
          isLoading: false,
          error: null
        });
      } catch (error) {
        console.error('获取质押信息失败:', error);
        setData(prev => ({ 
          ...prev, 
          isLoading: false, 
          error: error instanceof Error ? error : new Error('获取质押信息失败') 
        }));
      }
    };
    
    fetchStakeInfo();
  }, [publicClient, contractAddress, targetAddress, stakeId]);
  
  return data;
}

export function useBatchUnstakeLocked() {
  const chainId = useChainId();
  const publicClient = usePublicClient();
  const { address } = useAccount();
  const contractAddress = getContractAddresses(chainId).stakingOldContract;
  const [isPending, setIsPending] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const {lockedStakeCount, activeLockedStakes} = useUserStakingInfo();
  // 添加进度追踪状态
  const [progress, setProgress] = useState(0);
  const [totalStakes, setTotalStakes] = useState(0);

  const unstakeLocked = async (stakeId: number): Promise<boolean> => {
    try {
      setIsPending(true);
      setError(null);
      
      // 发送交易
      const tx = await writeContract(config, {
        address: contractAddress,
        abi: HashKeyChainStakingABI,
        functionName: 'unstakeLocked',
        args: [BigInt(stakeId)]
      });
      
      console.log('Unstake transaction submitted:', tx);
      
      // 等待交易确认
      setIsConfirming(true);
      const receipt = await waitForTransactionReceipt(config, {
        hash: tx,
      });
      
      console.log('Unstake transaction confirmed:', receipt);
      
      // 返回交易状态
      return receipt.status === 'success';
    } catch (submitError) {
      console.error('Unstaking failed:', submitError);
      if (submitError instanceof Error) {
        setError(submitError);
      } else {
        setError(new Error('Unstaking failed'));
      }
      throw submitError;
    } finally {
      setIsPending(false);
      setIsConfirming(false);
    }
  };
  
  const fetchStakeInfo = async (stakeId: number) => {
    try {
      // 调用合约获取锁定质押信息
      const stakeInfo = await publicClient!.readContract({
        address: contractAddress,
        abi: HashKeyChainStakingABI,
        functionName: 'getLockedStakeInfo',
        args: [address, BigInt(stakeId)]
      }) as [bigint, bigint, bigint, bigint, boolean, boolean];
      
      // 计算收益
      const reward = stakeInfo[2] - stakeInfo[1];
      return {
        sharesAmount: stakeInfo[0],
        hskAmount: stakeInfo[1],
        currentHskValue: stakeInfo[2],
        lockEndTime: stakeInfo[3],
        isWithdrawn: stakeInfo[4],
        isLocked: stakeInfo[5],
        reward: reward,
        isLoading: false,
        error: null
      };
    } catch (error) {
      console.error('获取质押信息失败:', error);
    }
  };

  const startbatchUnstake = async () => {
    if (!activeLockedStakes) return false;
    setIsPending(true);
    // 重置进度追踪
    setProgress(0);
    setTotalStakes(0);
    
    try {
      const stakeIds = [];
      let totalStaked = 0n;
      const stakeInfos: Record<number, any> = {};
      
      // 第一阶段：识别所有需要解除质押的位置
      for (let stakeId = 0; stakeId < lockedStakeCount; stakeId++) {
        const stakeInfo = await fetchStakeInfo(stakeId);
        console.log(stakeId, stakeInfo, 'stakeInfo');
        
        if (stakeInfo && !stakeInfo.isWithdrawn) {
          stakeIds.push(stakeId);
          stakeInfos[stakeId] = stakeInfo;
          totalStaked += stakeInfo.currentHskValue;
        }
      }
      
      // 设置总质押数量
      setTotalStakes(stakeIds.length);
      
      // 创建进度更新队列
      const progressUpdates = new Array(stakeIds.length).fill(false);
      
      // 并行执行所有unstakeLocked操作
      const unstakePromises = stakeIds.map(async (stakeId, index) => {
        try {
          const result = await unstakeLocked(stakeId);
          // const result = await randomResponse();
          // 标记当前任务完成并更新进度
          progressUpdates[index] = true;
          setProgress(prev => prev + 1);
          return result;
        } catch (error) {
          console.error(`Failed to unstake ID ${stakeId}:`, error);
          // 即使失败也更新进度
          progressUpdates[index] = false;
          setProgress(prev => prev + 1);
          return false;
        }
      });

      // 启动进度监听器（防止状态更新延迟）
      const progressInterval = setInterval(() => {
        const currentProgress = progressUpdates.filter(Boolean).length;
        setProgress(currentProgress);
      }, 500);

      // 等待所有操作完成
      const results = await Promise.allSettled(unstakePromises);
      clearInterval(progressInterval);

      // 处理最终结果
      const finalResults = results.map(result => 
        result.status === 'fulfilled' ? result.value : false
      );

      console.log('All unstaking operations completed:', finalResults);

      setIsPending(false);
      return {
        totalStaked,
        isUnstakeFlags: finalResults,
        completedCount: finalResults.filter(Boolean).length,
        totalCount: stakeIds.length,
        stakeInfos
      };
    } catch (error) {
      console.error('Failed to batchUnstakeLocked:', error);
      setIsPending(false);
      throw error;
    }
  };

  return { 
    startbatchUnstake, 
    isPending, 
    isConfirming, 
    error,
    progress,
    totalStakes
  };
}

// 获取所有质押APR数据
export function useAllStakingAPRs(stakeAmount: string = '1000') {
  const chainId = useChainId();
  const contractAddress = getContractAddresses(chainId).stakingOldContract;
  const publicClient = usePublicClient();
  const stakeAmountWei = parseEther(stakeAmount || '0');
  
  const [data, setData] = useState<{
    estimatedAPRs: bigint[] | null;
    maxAPRs: bigint[] | null;
    isLoading: boolean;
    error: Error | null;
  }>({
    estimatedAPRs: null,
    maxAPRs: null,
    isLoading: true,
    error: null
  });
  
  useEffect(() => {
    const fetchAPRs = async () => {
      if (!publicClient || !contractAddress) return;
      
      setData(prev => ({ ...prev, isLoading: true, error: null }));
      
      try {
        console.log('OLd Fetching APRs with amount:', stakeAmountWei.toString());
        
        // 调用getAllStakingAPRs方法获取APR数据
        const result = await publicClient.readContract({
          address: contractAddress as `0x${string}`,
          abi: HashKeyChainStakingABI,
          functionName: 'getAllStakingAPRs',
          args: [stakeAmountWei]
        });
        
        const [estimatedAPRs, maxAPRs] = result as [bigint[], bigint[]];
        
        console.log('APRs fetched successfully:', {
          estimatedAPRs: estimatedAPRs.map(apr => apr.toString()),
          maxAPRs: maxAPRs.map(apr => apr.toString())
        });
        
        setData({
          estimatedAPRs,
          maxAPRs,
          isLoading: false,
          error: null
        });
      } catch (error) {
        console.error('Failed to fetch APRs:', error);
        setData({
          estimatedAPRs: null,
          maxAPRs: null,
          isLoading: false,
          error: error instanceof Error ? error : new Error('Failed to fetch APRs')
        });
      }
    };
    
    fetchAPRs();
  }, [publicClient, contractAddress, stakeAmountWei]);
  
  return data;
}

// 根据HSK数量获取对应份额（带滑点保护和gas优化）
export function useGetSharesForHSK(
  sharesAmount: string,
  options?: {
    maxSlippage?: number; // 允许的最大滑点百分比（0-100）
    gasLimit?: number;     // 自定义gas限制
  }
) {
  const chainId = useChainId();
  const contractAddress = getContractAddresses(chainId).stakingOldContract;
  const publicClient = usePublicClient();
  const sharesAmountWei = parseEther(sharesAmount || '0');
  
  const [shares, setShares] = useState<bigint>(BigInt(0));
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchShares = async () => {
      if (!publicClient || !contractAddress) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        const sharesValue = (await publicClient.readContract({
          address: contractAddress as `0x${string}`,
          abi: HashKeyChainStakingABI,
          functionName: 'getHSKForShares',
          args: [sharesAmountWei],
        })) as bigint;

        const minExpectedShares = sharesAmountWei - (sharesAmountWei * BigInt(options?.maxSlippage || 0)) / 100n;
        
        if (options?.maxSlippage && sharesValue < minExpectedShares) {
          throw new Error(`滑点超出限制：预期至少 ${minExpectedShares} 份额，实际获得 ${sharesValue}`);
        }
        
        setShares(sharesValue);
      } catch (err) {
        console.error('Failed to get shares:', err);
        setError(err instanceof Error ? err : new Error('Failed to get shares'));
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchShares();
  }, [publicClient, contractAddress, sharesAmountWei]);

  return { shares, isLoading, error };
}

// 临时使用
const randomResponse = (): Promise<boolean> => {
  return new Promise((resolve) => {
    // 实现思路分三步：
    
    // 1. 计算随机延迟（500-10000ms）
    const min = 500;
    const max = 10000;
    const delay = Math.floor(Math.random() * (max - min + 1)) + min;
    
    // 2. 设置延迟定时器
    setTimeout(() => {
      resolve(true);
      // // 3. 生成80%成功概率
      // const success = Math.random() < 0.8;
      // resolve(success);
    }, delay);
  });
};
