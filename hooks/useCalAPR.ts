'use client';

import { useAccount, useWriteContract, useChainId, usePublicClient } from 'wagmi';
import { getContractAddresses } from '@/config/contracts';
import { StakeType, StakingStats } from '@/types/contracts';
import { parseEther } from '@/utils/format';
import { HashKeyChainStakingABI } from '@/constants/abi';
import { useState, useEffect } from 'react';
import { waitForTransactionReceipt, writeContract } from 'wagmi/actions';
import { config } from '@/app/providers';
import { Chain, PublicClient } from 'viem';

export const stakeTypeMap = {
  "30days": 0,  // FIXED_30_DAYS
  "90days": 1,  // FIXED_90_DAYS
  "180days": 2, // FIXED_180_DAYS
  "365days": 3,  // FIXED_365_DAYS
  "flexiable": 4  // FLEXIBLE
};

type RewardData = {
  totalPooled: bigint;
  totalShares: bigint;
  // 已经支付的奖励
  totalPaid: bigint;
  reserved: bigint;
  contractBalance: bigint;
}

// 获取已经质押的各种时间段信息
export function useStakedInfo(simulatedAmount: string = '1000') {
  const chainId = useChainId();
  const contractAddress = getContractAddresses(chainId).stakingContract;
  const simulatedAmountWei = parseEther(simulatedAmount || '0');
  const publicClient = usePublicClient();
  
  const [data, setData] = useState<{
    totalStaked: bigint;
    exchangeRate: bigint;
    valueLocked30: bigint;
    valueLocked90: bigint;
    valueLocked180: bigint;
    valueLocked365: bigint;
    valueLockedFlexiable: bigint;
    bonus90: bigint;
    bonus180: bigint;
    bonus365: bigint;
    totalBonus: bigint;
    isLoading: boolean;
  }>({
    totalStaked: BigInt(0),
    exchangeRate: BigInt(0),
    valueLocked30: BigInt(0),
    valueLocked90: BigInt(0),
    valueLocked180: BigInt(0),
    valueLocked365: BigInt(0),
    valueLockedFlexiable: BigInt(0),
    bonus90: BigInt(0),
    bonus180: BigInt(0),
    bonus365: BigInt(0),
    totalBonus: BigInt(0),
    isLoading: true,
  });
  
  useEffect(() => {
    const fetchStakingInfo = async () => {
      if (!publicClient || !contractAddress) return;
      
      setData(prev => ({ ...prev, isLoading: true }));
      
      try {
        
        // 获取总质押量
        const totalValueLocked = await publicClient.readContract({
          address: contractAddress as `0x${string}`,
          abi: HashKeyChainStakingABI,
          functionName: 'totalValueLocked',
        });
        console.log('totalValueLocked:', totalValueLocked);
        
        const valueLocked30 = await publicClient.readContract({
            address: contractAddress as `0x${string}`,
            abi: HashKeyChainStakingABI,
            functionName: 'totalSharesByStakeType',
            args: [stakeTypeMap['30days']],
          }) as bigint;
          // console.log('valueLocked90:', valueLocked30.toString());

        // 获取各期限类型的总质押份额
        const valueLocked90 = await publicClient.readContract({
          address: contractAddress as `0x${string}`,
          abi: HashKeyChainStakingABI,
          functionName: 'totalSharesByStakeType',
          args: [stakeTypeMap['90days']],
        }) as bigint;
        // console.log('valueLocked90:', valueLocked90.toString());

        const valueLocked180 = await publicClient.readContract({
          address: contractAddress as `0x${string}`,
          abi: HashKeyChainStakingABI,
          functionName: 'totalSharesByStakeType',
          args: [stakeTypeMap['180days']],
        }) as bigint;
        // console.log('valueLocked180:', valueLocked180.toString());

        const valueLocked365 = await publicClient.readContract({
          address: contractAddress as `0x${string}`,
          abi: HashKeyChainStakingABI,
          functionName: 'totalSharesByStakeType',
          args: [stakeTypeMap['365days']],
        }) as bigint;
        // console.log('valueLocked365:', valueLocked365.toString());
        
        const valueLockedFlexiable = await publicClient.readContract({
          address: contractAddress as `0x${string}`,
          abi: HashKeyChainStakingABI,
          functionName: 'totalSharesByStakeType',
          args: [stakeTypeMap['flexiable']],
        }) as bigint;
        // console.log('valueLockedFlexiable:', valueLockedFlexiable.toString());

        // 正确计算奖励比例 - 使用按比例计算的方式处理BigInt
        // 0.8% = 8/1000, 2% = 20/1000, 4% = 40/1000
        const bonus90 = (valueLocked90 * BigInt(8)) / BigInt(10000);
        const bonus180 = (valueLocked180 * BigInt(20)) / BigInt(10000);
        const bonus365 = (valueLocked365 * BigInt(40)) / BigInt(10000);
        const totalBonus = (bonus90 + bonus180 + bonus365) / BigInt(1 * 10**18);
        
        // console.log('totalBonus:', totalBonus.toString());

        // 获取当前兑换率
        const currentExchangeRate = await publicClient.readContract({
          address: contractAddress as `0x${string}`,
          abi: HashKeyChainStakingABI,
          functionName: 'getCurrentExchangeRate',
        });
        // console.log('currentExchangeRate: 当前汇率：', currentExchangeRate);
        // 汇率的作用是啥
        setData({
          totalStaked: totalValueLocked as bigint,
          exchangeRate: currentExchangeRate as bigint,
          valueLocked30: valueLocked30 as bigint,
          valueLocked90: valueLocked90 as bigint,
          valueLocked180: valueLocked180 as bigint,
          valueLocked365: valueLocked365 as bigint,
          valueLockedFlexiable: valueLockedFlexiable as bigint,
          bonus90: bonus90 as bigint,
          bonus180: bonus180 as bigint,
          bonus365: bonus365 as bigint,
          totalBonus: totalBonus as bigint,
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
export function useRewardsInfo() {
  const { address } = useAccount();
  const chainId = useChainId();
  const [isLoading, setIsLoading] = useState(true);
  const [totalRewardData, setTotalRewardData] = useState<RewardData>();
  // 获取当前配置的客户端
  const publicClient = usePublicClient();
  useEffect(() => {
    const fetchStakingInfo = async () => {
      if (!address || !publicClient) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const contractAddress = getContractAddresses(chainId).stakingContract;
        
        const rewardData = await publicClient.readContract({
          address: contractAddress,
          abi: HashKeyChainStakingABI,
          functionName: 'getRewardStatus',
        }) as [bigint, bigint, bigint, bigint, bigint];
        console.log('rewardData 1111111:', rewardData);
        const totalPooled = rewardData[0] as bigint;
        const totalShares = rewardData[1] as bigint;
        const totalPaid = rewardData[2] as bigint;
        const reserved = rewardData[3] as bigint;
        const contractBalance = rewardData[4] as bigint;
        setTotalRewardData({
          totalPooled,
          totalShares,
          totalPaid,
          reserved,
          contractBalance,
        });
        const hskPerBlock = await publicClient.readContract({
          address: contractAddress,
          abi: HashKeyChainStakingABI,
          functionName: 'hskPerBlock',
        });
        console.log('hskPerBlock:', hskPerBlock);

      } catch (error) {
        console.error('Failed to fetch staking info:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStakingInfo();
    const fetchShare = async () => {
      if (!address || !publicClient) {
        return;
      }
      await getShareToCurrentByType(
        publicClient,
        BigInt(1000 * 10 ** 18),
        stakeTypeMap['365days']
      );
    }
    fetchShare();
  }, [address, chainId, publicClient]);

  return {
    totalRewardData,
    isLoading,
  };
}

function calculateAutalAPR(reward: bigint, base: bigint, days: number): number {
  if (base === BigInt(0) || days === 0) {
    return 0;
  }
  
  // Calculate the return rate for the given period
  const returnRate = Number((reward * BigInt(10000)) / base); // As basis points (10000 = 100%)
  
  // Annualize the return rate (convert from period rate to annual rate)
  const daysInYear = 365;
  const annualizedRate = (returnRate * daysInYear) / days;
  
  // Return as a percentage (divide by 100)
  return annualizedRate / 100;
}

// getHSKForSharesByType(sharesAmount, stakeType)
// 这个方法是根据 sharesAmount 和 stakeType 来计算 HSK 的数量
// 如果是新质押的， 需要 hskAmount 先计算 sharesAmount， 再去计算
// sharesAmount = hskAmount * exchangeRate

async function estimateHSKForSharesByType(
  contractAddress: string,
  publicClient: PublicClient,
  _sharesAmount: bigint,
  stakeType: number, // Assuming StakeType is an enum mapped to numbers
  days: number = 0, // Number of days for future estimation; 0 for current
  averageBlockTime: number = 2
): Promise<bigint> {
  // Fetch all necessary contract variables
  const [
    rewardData,
    totalSharesByStakeType,
    hskPerBlock,
    startBlock,
    totalPaidRewards,
    totalPooledHSK,
    maxAPR,
    ratio
  ] = await Promise.all([
    publicClient.readContract({
      address: contractAddress as `0x${string}`,
      abi: HashKeyChainStakingABI,
      functionName: 'getRewardStatus',
    }) as Promise<bigint[]>,
    // totalSharesByStakeType[stakeType]
    publicClient.readContract({
      address: contractAddress as `0x${string}`,
      abi: HashKeyChainStakingABI,
      functionName: 'totalSharesByStakeType',
      args: [BigInt(stakeType)]
    }) as Promise<bigint>,
    // hskPerBlock
    publicClient.readContract({
      address: contractAddress as `0x${string}`,
      abi: HashKeyChainStakingABI,
      functionName: 'hskPerBlock'
    }) as Promise<bigint>,
    // startBlock
    publicClient.readContract({
      address: contractAddress as `0x${string}`,
      abi: HashKeyChainStakingABI,
      functionName: 'startBlock'
    }) as Promise<bigint>,
    // totalPaidRewards
    publicClient.readContract({
      address: contractAddress as `0x${string}`,
      abi: HashKeyChainStakingABI,
      functionName: 'totalPaidRewards'
    }) as Promise<bigint>,
    // totalPooledHSK
    publicClient.readContract({
      address: contractAddress as `0x${string}`,
      abi: HashKeyChainStakingABI,
      functionName: 'totalPooledHSK'
    }) as Promise<bigint>,
    // maxAPR
    publicClient.readContract({
      address: contractAddress as `0x${string}`,
      abi: HashKeyChainStakingABI,
      functionName: 'maxAPRs',
      args: [BigInt(stakeType)]
    }) as Promise<bigint>,
    // calculateCorrectionFactor(stakeType)
    publicClient.readContract({
      address: contractAddress as `0x${string}`,
      abi: HashKeyChainStakingABI,
      functionName: 'calculateCorrectionFactor',
      args: [BigInt(stakeType)]
    }) as Promise<bigint>
  ]);

  
  const aaaa = await publicClient.readContract({
    address: contractAddress as `0x${string}`,
    abi: HashKeyChainStakingABI,
    functionName: 'getHSKForSharesByType',
    args: [_sharesAmount, BigInt(stakeType)]
  }) as Promise<bigint>
  console.log('aaaa 11111111111111111111111:', aaaa);

  const totalPooled = rewardData[0] as bigint;
  const totalShares = rewardData[1] as bigint;
  const totalPaid = rewardData[2] as bigint;
  const reserved = rewardData[3] as bigint;
  const contractBalance = rewardData[4] as bigint;
  const basisPoints = BigInt(10000); // 100% = 10000 basis points
  // Early returns for initial 1:1 exchange rate
  if (totalShares === 0n) {
    return _sharesAmount;
  }
  if (totalSharesByStakeType === 0n) {
    return _sharesAmount;
  }

  // Get current block number
  const currentBlock = BigInt(await publicClient.getBlockNumber());

  // Estimate future block number if days > 0
  let futureBlock = currentBlock;
  if (days > 0) {
    const secondsInDay = 24 * 60 * 60;
    const deltaBlocks = BigInt(Math.floor((days * secondsInDay) / averageBlockTime));
    futureBlock = currentBlock + deltaBlocks;
  }

  // Calculate total rewards up to the future/current block
  const totalRewards = hskPerBlock * (futureBlock - startBlock);
  const unClaimedRewards = totalRewards - totalPaidRewards;


  // Calculate reward, base, and maxReward
  const reward = (_sharesAmount * unClaimedRewards * ratio) / (totalSharesByStakeType * basisPoints);
  const base = (_sharesAmount * totalPooledHSK) / totalShares;
  const maxReward = (_sharesAmount * maxAPR) / basisPoints;
  console.log('base:', base);
  console.log('maxReward:', maxReward);

  // Cap the reward at maxReward
  const finalReward = reward > maxReward ? maxReward : reward;
  console.log('finalReward:', finalReward);
  const actualAPR = calculateAutalAPR(finalReward, base, days);
  console.log('actualAPR:', actualAPR);
  // Return total HSK amount
  return finalReward + base;
}

// 获取新的质押的 HSK 数量
export async function getShareToCurrentByType(
  publicClient: PublicClient, 
  hskAmount: bigint, 
  type: StakeType
) {

  const contractAddress = getContractAddresses(133).stakingContract;
  // Get sharesAmount from getLockedStakeInfo
  const sharesAmount = await publicClient.readContract({
    address: contractAddress as `0x${string}`,
    abi: HashKeyChainStakingABI,
    functionName: 'getSharesForHSK',
    args: [hskAmount]
  }) as bigint;
  console.log('sharesAmount: 34534534', sharesAmount);

  // Calculate HSK amount using the replicated logic
  const afterAmount = await estimateHSKForSharesByType(
    contractAddress,
    publicClient,
    sharesAmount,
    type,
    365
  );

  console.log(`after30 days 1111111111111`, afterAmount);
  return afterAmount;
}

