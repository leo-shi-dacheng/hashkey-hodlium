'use client';

import { useAccount, useChainId, usePublicClient } from 'wagmi';
import { getContractAddresses } from '@/config/contracts';
import { StakeType, NewLockedStakeInfo } from '@/types/contracts';
import { parseEther } from '@/utils/format';
import { NewStakingABI } from '@/constants/stakingNewAbi'
import { useState, useEffect } from 'react';
import { waitForTransactionReceipt, writeContract, simulateContract } from 'wagmi/actions';
import { config } from '@/app/providers';

// Define the StakeStruct interface based on the contract structure
interface StakeStruct {
  id: bigint;           // 质押唯一ID
  sharesAmount: bigint; // 份额数量
  hskAmount: bigint;    // HSK 数量
  startBlock: bigint;   // 开始区块
  endBlock: bigint;     // 结束区块
  unstaked: boolean;    // 质押状态，true表示已解除质押，false表示仍在质押中
  stakingBlockLength: bigint; // 持续长度
}

export const stakeTypeMap = {
  "30days": 0,  // FIXED_30_DAYS
  "90days": 1,  // FIXED_90_DAYS
  "180days": 2, // FIXED_180_DAYS
  "365days": 3  // FIXED_365_DAYS
};

// 获取质押合约的基本信息
export function useNewStakingInfo(simulatedAmount: string = '1000') {
  const chainId = useChainId();
  const contractAddress = getContractAddresses(chainId).stakingNewContract;
  const simulatedAmountWei = parseEther(simulatedAmount || '0');
  const publicClient = usePublicClient();
  
  const [data, setData] = useState<{
    totalStaked: bigint;
    exchangeRate: bigint;
    minStakeAmount: bigint;
    isLoading: boolean;
  }>({
    totalStaked: BigInt(0),
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
          abi: NewStakingABI,
          functionName: 'stakingAmountForHSK',
        });

        
        // 获取当前兑换率 !!! 这里目前报错！！！
        const currentExchangeRate =  0n;
        // const currentExchangeRate = await publicClient.readContract({
        //   address: contractAddress as `0x${string}`,
        //   abi: NewStakingABI,
        //   functionName: 'getCurrentExchangeRate',
        // });
        // console.log('currentExchangeRate', currentExchangeRate);
        
        // 获取最小质押金额
        const minStakeAmount =  0n;
        // const minStakeAmount = await publicClient.readContract({
        //   address: contractAddress as `0x${string}`,
        //   abi: NewStakingABI,
        //   functionName: 'minStakeAmount',
        // });
        // console.log('minStakeAmount', minStakeAmount);
        
        setData({
          totalStaked: totalValueLocked as bigint,
          exchangeRate: currentExchangeRate as bigint,
          minStakeAmount: minStakeAmount as bigint,
          isLoading: false,
        });
        
        console.log('New Staking info fetched successfully:', {
          totalValueLocked,
          currentExchangeRate,
          minStakeAmount
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
export function useNewUserStakingInfo() {
  const { address } = useAccount();
  const chainId = useChainId();
  const [isLoading, setIsLoading] = useState(true);
  const [lockedStakeCount, setLockedStakeCount] = useState<bigint>(BigInt(0));
  const [activeLockedStakes, setActiveLockedStakes] = useState<bigint>(BigInt(0));
  const [stakesInfo, setStakesInfo] = useState<NewLockedStakeInfo[]>({
    id: 0,
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
  
  // 获取当前配置的客户端
  const publicClient = usePublicClient();

  // 函数：将区块号转换为真实时间
async function blockNumberToTimestamp(targetBlockNumber: bigint): Promise<Date> {
  const currentBlockNumber = await publicClient!.getBlockNumber();
  const currentBlock = await publicClient!.getBlock({ blockNumber: currentBlockNumber });
  const currentTimestamp = Number(currentBlock.timestamp) * 1000;
  const averageBlockTime = 2;
  const blockDifference = Number(targetBlockNumber - currentBlockNumber);
  const timeDifference = blockDifference * averageBlockTime * 1000;
  return new Date(currentTimestamp + timeDifference);
}

  useEffect(() => {
    const fetchStakingInfo = async () => {
      if (!address || !publicClient) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const contractAddress = getContractAddresses(chainId).stakingNewContract;
        // 获取用户所有质押信息
        const userStakes = await publicClient.readContract({
          address: contractAddress as `0x${string}`,
          abi: NewStakingABI,
          functionName: 'getUserStakes',
          args: [address]
        }) as StakeStruct[];
        console.log(userStakes, 'userStakes')
        let _active = userStakes.length;
        const _stakesInfo = [];
        for await (const stakeInfo of userStakes) {
          // 将区块号转换为真实时间
          const _lockEndTime = await blockNumberToTimestamp(stakeInfo.endBlock);
          // 如果已提取，减少活跃计数
          if (stakeInfo.unstaked) {
            _active--;
          }
      
          // 判断是否锁定：未提取且当前时间小于锁定期结束时间
          const isLocked = !stakeInfo.unstaked && Date.now() < _lockEndTime.getTime();
      
          // 将处理结果推入数组
          _stakesInfo.push({
            id: stakeInfo.id,
            sharesAmount: stakeInfo.sharesAmount,
            hskAmount: stakeInfo.hskAmount,
            currentHskValue: stakeInfo.hskAmount,
            lockEndTime: Number(_lockEndTime) / 1000, // 返回 Date 对象
            isWithdrawn: stakeInfo.unstaked,
            isLocked,
            reward: 0n,
            isLoading: false,
            error: null,
          });
        };
        console.log(_stakesInfo, '_stakesInfo')
        console.log(_active, '_active')

        setStakesInfo(_stakesInfo);
        setLockedStakeCount(BigInt(userStakes.length));
        setActiveLockedStakes(BigInt(_active));
      } catch (error) {
        console.error('Failed to fetch staking info:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStakingInfo();
  }, [address, chainId, publicClient]);

  return {
    lockedStakeCount,
    activeLockedStakes,
    stakesInfo,
    isLoading,
  };
}

// 质押hooks
export function useNewStakeLocked() {
  const chainId = useChainId();
  const contractAddress = getContractAddresses(chainId).stakingNewContract;
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);

  const stakeLocked = async (amount: string, stakeType: StakeType) => {
    try {
      setIsPending(true);
      setError(null);
      
      const amountWei = parseEther(amount);
      
      // 获取对应的区块长度
      let blocksLength: bigint;
      switch(stakeType) {
        case 0: // 30天
          blocksLength = BigInt(1296000); // STAKING_30DAYS_BLOCKS_LENGTH
          break;
        case 1: // 90天
          blocksLength = BigInt(3888000); // STAKING_90DAYS_BLOCKS_LENGTH
          break;
        case 2: // 180天
          blocksLength = BigInt(7776000); // STAKING_180DAYS_BLOCKS_LENGTH
          break;
        case 3: // 365天
          blocksLength = BigInt(15552000); // STAKING_365DAYS_BLOCKS_LENGTH
          break;
        default:
          blocksLength = BigInt(1); // STAKING_0DAYS_BLOCKS_LENGTH
      }
      // 发送交易 - 注意这里改为调用 stake 函数并传入区块长度
      const { request } = await simulateContract(config, {
        address: contractAddress,
        abi: NewStakingABI,
        functionName: 'stake', // 新合约使用 stake 函数并传入区块长度
        args: [blocksLength],
        value: amountWei,
      });      
      // 如果模拟成功，发送实际交易
      const tx = await writeContract(config, request);
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
    isConfirming,
    error
  };
}

// 修改 useUnstakeLocked 钩子以适配新合约
export function useNewUnstakeLocked() {
  const chainId = useChainId();
  const contractAddress = getContractAddresses(chainId).stakingNewContract;
  const [isPending, setIsPending] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const unstakeLocked = async (stakeId: number) => {
    try {
      setIsPending(true);
      setError(null);
      
      // 发送交易 - 注意这里改为调用 unstakeById 函数
      const tx = await writeContract(config, {
        address: contractAddress,
        abi: NewStakingABI,
        functionName: 'unstakeById', // 新合约使用 unstakeById 函数
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

// 修改 useLockedStakeInfo 钩子以适配新合约
export function useNewLockedStakeInfo(stakeId: number | null): NewLockedStakeInfo {
  const chainId = useChainId();
  const contractAddress = getContractAddresses(chainId).stakingNewContract;
  const publicClient = usePublicClient();
  const { address } = useAccount();
  

  const [data, setData] = useState<NewLockedStakeInfo>({
    id: 0,
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
    if (!publicClient || !contractAddress || !address || stakeId === null) return;
    
    const fetchStakeInfo = async () => {
      setData(prev => ({ ...prev, isLoading: true, error: null }));
      try {
        // 获取用户所有质押信息
        const userStakes = await publicClient.readContract({
          address: contractAddress as `0x${string}`,
          abi: NewStakingABI,
          functionName: 'getUserStakes',
          args: [address]
        }) as StakeStruct[];
        
        console.log(userStakes, 'userStakes userStakes')
        // 找到对应ID的质押
        const stakeInfo = userStakes.find(stake => Number(stake.id) === stakeId);
        
        if (!stakeInfo) {
          throw new Error(`Stake with ID ${stakeId} not found`);
        }
        
        // 计算当前价值 (使用 getHSKForStHSK 获取当前价值)
        const currentValue = await publicClient.readContract({
          address: contractAddress as `0x${string}`,
          abi: NewStakingABI,
          functionName: 'getHSKForStHSK',
          args: [stakeInfo.sharesAmount]
        }) as bigint;
        
        // 计算收益
        const reward = currentValue - stakeInfo.hskAmount;
        
        setData({
          id: stakeInfo.id,
          sharesAmount: stakeInfo.sharesAmount,
          hskAmount: stakeInfo.hskAmount,
          currentHskValue: currentValue,
          lockEndTime: stakeInfo.endBlock,
          isWithdrawn: stakeInfo.unstaked,
          isLocked: !stakeInfo.unstaked && BigInt(Date.now()/1000) < stakeInfo.endBlock,
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
  }, [publicClient, contractAddress, address, stakeId]);
  
  return data;
}

// 修改 batchGetStakingInfo 函数以适配新合约
export async function getBatchGetStakingInfo(
  contractAddress: string, 
  publicClient: ReturnType<typeof usePublicClient>, 
  stakeIds: number[], 
  userAddress: string
) {
  const results = [];
  
  try {
    // 获取用户所有质押信息
    if (!publicClient) {
      throw new Error('Public client is undefined');
    }
    
    const userStakes = await publicClient.readContract({
      address: contractAddress as `0x${string}`,
      abi: NewStakingABI,
      functionName: 'getUserStakes',
      args: [userAddress]
    }) as StakeStruct[];
    
    for (const id of stakeIds) {
      try {
        // 找到对应ID的质押
        const stakeInfo = userStakes.find(stake => Number(stake.id) === id);
        
        if (!stakeInfo) {
          throw new Error(`Stake with ID ${id} not found`);
        }
        
        // 计算当前价值 (使用 getHSKForStHSK 获取当前价值)
        const currentValue = await publicClient.readContract({
          address: contractAddress as `0x${string}`,
          abi: NewStakingABI,
          functionName: 'getHSKForStHSK',
          args: [stakeInfo.sharesAmount]
        }) as bigint;
        
        // 计算收益 - 当前价值减去原始质押金额
        const reward = currentValue - stakeInfo.hskAmount;
        
        // 检查是否已经超过结束区块
        const currentTimestamp = BigInt(Math.floor(Date.now() / 1000));
        const isLocked = !stakeInfo.unstaked && currentTimestamp < stakeInfo.endBlock;
        
        results.push({
          id,
          sharesAmount: stakeInfo.sharesAmount,
          hskAmount: stakeInfo.hskAmount,
          currentHskValue: currentValue,
          lockEndTime: stakeInfo.endBlock,
          isWithdrawn: stakeInfo.unstaked,
          isLocked: isLocked,
          reward: reward,
          stakingBlockLength: stakeInfo.stakingBlockLength,
          startBlock: stakeInfo.startBlock,
          error: null
        });
        console.log(results, 'results')
      } catch (error) {
        console.error(`获取质押 ${id} 失败:`, error);
        results.push({
          id,
          sharesAmount: BigInt(0),
          hskAmount: BigInt(0),
          currentHskValue: BigInt(0),
          lockEndTime: BigInt(0),
          isWithdrawn: false,
          isLocked: false,
          reward: BigInt(0),
          stakingBlockLength: BigInt(0),
          startBlock: BigInt(0),
          error: error
        });
      }
    }
  } catch (error) {
    console.error('获取用户质押列表失败:', error);
    // 如果获取整个列表失败，为每个ID创建错误结果
    for (const id of stakeIds) {
      results.push({
        id,
        sharesAmount: BigInt(0),
        hskAmount: BigInt(0),
        currentHskValue: BigInt(0),
        lockEndTime: BigInt(0),
        isWithdrawn: false,
        isLocked: false,
        reward: BigInt(0),
        stakingBlockLength: BigInt(0),
        startBlock: BigInt(0),
        error: error
      });
    }
  }
  
  return results;
}

// 获取所有质押APR数据
export function useNewAllStakingAPRs(stakeAmount: string = '1000') {
  const chainId = useChainId();
  const contractAddress = getContractAddresses(chainId).stakingNewContract;
  const publicClient = usePublicClient();
  const stakeAmountWei = parseEther(stakeAmount || '0');
  
  const [data, setData] = useState<{
    stakingRates: {
      rate0Days: bigint;
      rate30Days: bigint;
      rate90Days: bigint;
      rate180Days: bigint;
      rate365Days: bigint;
    } | null;
    currentAPR: bigint | null;
    isLoading: boolean;
    error: Error | null;
  }>({
    stakingRates: null,
    currentAPR: null,
    isLoading: true,
    error: null
  });
  
  useEffect(() => {
    const fetchAPRs = async () => {
      if (!publicClient || !contractAddress) return;
      
      setData(prev => ({ ...prev, isLoading: true, error: null }));
      
      try {
        console.log('Fetching APRs with amount:', stakeAmountWei.toString());
        
        // 获取当前APR
        const currentAPR = await publicClient.readContract({
          address: contractAddress as `0x${string}`,
          abi: NewStakingABI,
          functionName: 'getCurrentAPR',
          args: [stakeAmountWei]
        }) as bigint;
        
        // 获取各期限的质押利率
        const rate0Days = await publicClient.readContract({
          address: contractAddress as `0x${string}`,
          abi: NewStakingABI,
          functionName: 'stakingRate0Days'
        }) as bigint;
        
        const rate30Days = await publicClient.readContract({
          address: contractAddress as `0x${string}`,
          abi: NewStakingABI,
          functionName: 'stakingRate30Days'
        }) as bigint;
        
        const rate90Days = await publicClient.readContract({
          address: contractAddress as `0x${string}`,
          abi: NewStakingABI,
          functionName: 'stakingRate90Days'
        }) as bigint;
        
        const rate180Days = await publicClient.readContract({
          address: contractAddress as `0x${string}`,
          abi: NewStakingABI,
          functionName: 'stakingRate180Days'
        }) as bigint;
        
        const rate365Days = await publicClient.readContract({
          address: contractAddress as `0x${string}`,
          abi: NewStakingABI,
          functionName: 'stakingRate365Days'
        }) as bigint;
        
        console.log('APRs fetched successfully:', {
          currentAPR: currentAPR.toString(),
          rates: {
            rate0Days: rate0Days.toString(),
            rate30Days: rate30Days.toString(),
            rate90Days: rate90Days.toString(),
            rate180Days: rate180Days.toString(),
            rate365Days: rate365Days.toString()
          }
        });
        
        setData({
          stakingRates: {
            rate0Days,
            rate30Days,
            rate90Days,
            rate180Days,
            rate365Days
          },
          currentAPR,
          isLoading: false,
          error: null
        });
      } catch (error) {
        console.error('Failed to fetch APRs:', error);
        setData({
          stakingRates: null,
          currentAPR: null,
          isLoading: false,
          error: error instanceof Error ? error : new Error('Failed to fetch APRs')
        });
      }
    };
    
    fetchAPRs();
  }, [publicClient, contractAddress, stakeAmountWei]);
  
  return data;
}