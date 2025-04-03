'use client';

import { useAccount, useChainId, usePublicClient } from 'wagmi';
import { getContractAddresses } from '@/config/contracts';
import { parseEther } from '@/utils/format';
import { HashKeyChainStakingABI } from '@/constants/abi';
import { useState, useEffect } from 'react';
import { waitForTransactionReceipt, writeContract } from 'wagmi/actions';
import { config } from '@/app/providers';
import { PublicClient } from 'viem';

// 1. useStakeFlexible - 进行灵活质押
export function useStakeFlexible() {
  const chainId = useChainId();
  const contractAddress = getContractAddresses(chainId).stakingContract;
  const [isPending, setIsPending] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const stakeFlexible = async (amount: string) => {
    try {
      setIsPending(true);
      setError(null);

      const amountWei = parseEther(amount);

      // 发送交易
      const tx = await writeContract(config, {
        address: contractAddress,
        abi: HashKeyChainStakingABI,
        functionName: 'stakeFlexible',
        value: amountWei,
      });

      console.log('Flexible stake transaction submitted:', tx);

      // 等待交易确认
      setIsConfirming(true);
      const receipt = await waitForTransactionReceipt(config, {
        hash: tx,
      });

      console.log('Flexible stake transaction confirmed:', receipt);

      return receipt.status === 'success';
    } catch (submitError) {
      console.error('Flexible staking failed:', submitError);
      if (submitError instanceof Error) {
        setError(submitError);
      } else {
        setError(new Error('Flexible staking failed'));
      }
      throw submitError;
    } finally {
      setIsPending(false);
      setIsConfirming(false);
    }
  };

  return { stakeFlexible, isPending, isConfirming, error };
}

// 2. useFlexibleStakeReward - 获取灵活质押奖励信息
export function useFlexibleStakeReward(stakeId: number | null) {
  const chainId = useChainId();
  const contractAddress = getContractAddresses(chainId).stakingContract;
  const publicClient = usePublicClient();
  const { address } = useAccount();

  const [data, setData] = useState<{
    originalAmount: bigint;
    reward: bigint;
    actualReward: bigint;
    totalValue: bigint;
    isLoading: boolean;
    error: Error | null;
  }>({
    originalAmount: BigInt(0),
    reward: BigInt(0),
    actualReward: BigInt(0),
    totalValue: BigInt(0),
    isLoading: false,
    error: null,
  });

  useEffect(() => {
    if (!publicClient || !contractAddress || !address || stakeId === null) return;

    const fetchStakeReward = async () => {
      setData((prev) => ({ ...prev, isLoading: true, error: null }));
      try {
        const rewardInfo = (await publicClient.readContract({
          address: contractAddress as `0x${string}`,
          abi: HashKeyChainStakingABI,
          functionName: 'getFlexibleStakeReward',
          args: [address, BigInt(stakeId)],
        })) as [bigint, bigint, bigint, bigint];

        setData({
          originalAmount: rewardInfo[0],
          reward: rewardInfo[1],
          actualReward: rewardInfo[2],
          totalValue: rewardInfo[3],
          isLoading: false,
          error: null,
        });
      } catch (error) {
        console.error('获取灵活质押奖励信息失败:', error);
        setData((prev) => ({
          ...prev,
          isLoading: false,
          error: error instanceof Error ? error : new Error('获取灵活质押奖励信息失败'),
        }));
      }
    };

    fetchStakeReward();
  }, [publicClient, contractAddress, address, stakeId]);

  return data;
}

// 3. useRequestUnstakeFlexible - 请求解除灵活质押
export function useRequestUnstakeFlexible() {
  const chainId = useChainId();
  const contractAddress = getContractAddresses(chainId).stakingContract;
  const [isPending, setIsPending] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const requestUnstakeFlexible = async (stakeId: number) => {
    try {
      setIsPending(true);
      setError(null);

      const tx = await writeContract(config, {
        address: contractAddress,
        abi: HashKeyChainStakingABI,
        functionName: 'requestUnstakeFlexible',
        args: [BigInt(stakeId)],
      });

      console.log('Request unstake flexible transaction submitted:', tx);

      setIsConfirming(true);
      const receipt = await waitForTransactionReceipt(config, {
        hash: tx,
      });

      console.log('Request unstake flexible transaction confirmed:', receipt);

      return receipt.status === 'success';
    } catch (submitError) {
      console.error('Request unstake flexible failed:', submitError);
      if (submitError instanceof Error) {
        setError(submitError);
      } else {
        setError(new Error('Request unstake flexible failed'));
      }
      throw submitError;
    } finally {
      setIsPending(false);
      setIsConfirming(false);
    }
  };

  return { requestUnstakeFlexible, isPending, isConfirming, error };
}

// 4. useClaimWithdrawal - 领取提款
export function useClaimWithdrawal() {
  const chainId = useChainId();
  const contractAddress = getContractAddresses(chainId).stakingContract;
  const [isPending, setIsPending] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const claimWithdrawal = async (withdrawalId: number) => {
    try {
      setIsPending(true);
      setError(null);

      const tx = await writeContract(config, {
        address: contractAddress,
        abi: HashKeyChainStakingABI,
        functionName: 'claimWithdrawal',
        args: [BigInt(withdrawalId)],
      });

      console.log('Claim withdrawal transaction submitted:', tx);

      setIsConfirming(true);
      const receipt = await waitForTransactionReceipt(config, {
        hash: tx,
      });

      console.log('Claim withdrawal transaction confirmed:', receipt);

      return receipt.status === 'success';
    } catch (submitError) {
      console.error('Claim withdrawal failed:', submitError);
      if (submitError instanceof Error) {
        setError(submitError);
      } else {
        setError(new Error('Claim withdrawal failed'));
      }
      throw submitError;
    } finally {
      setIsPending(false);
      setIsConfirming(false);
    }
  };

  return { claimWithdrawal, isPending, isConfirming, error };
}

// 5. useUserFlexibleStakingInfo - 获取用户灵活质押信息
export function useUserFlexibleStakingInfo(queryAddress?: string) {
  const { address } = useAccount();
  const chainId = useChainId();
  const publicClient = usePublicClient();
  const [isLoading, setIsLoading] = useState(true);
  const [flexibleStakeCount, setFlexibleStakeCount] = useState<bigint>(BigInt(0));
  const [activeFlexibleStakes, setActiveFlexibleStakes] = useState<bigint>(BigInt(0));

  useEffect(() => {
    const fetchStakingInfo = async () => {
      const targetAddress = queryAddress || address;
      if (!targetAddress || !publicClient) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const contractAddress = getContractAddresses(chainId).stakingContract;

        const count = await publicClient.readContract({
          address: contractAddress,
          abi: HashKeyChainStakingABI,
          functionName: 'getUserFlexibleStakeCount',
          args: [targetAddress],
        });

        const active = await publicClient.readContract({
          address: contractAddress,
          abi: HashKeyChainStakingABI,
          functionName: 'getUserActiveFlexibleStakes',
          args: [targetAddress],
        });

        setFlexibleStakeCount(count as bigint);
        setActiveFlexibleStakes(active as bigint);
      } catch (error) {
        console.error('Failed to fetch flexible staking info:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStakingInfo();
  }, [address, chainId, publicClient, queryAddress]);

  return {
    flexibleStakeCount,
    activeFlexibleStakes,
    isLoading,
  };
}

// 6. useFlexibleStakeInfo - 获取指定灵活质押信息
export function useFlexibleStakeInfo(stakeId: number | null, queryAddress?: string) {
  const chainId = useChainId();
  const contractAddress = getContractAddresses(chainId).stakingContract;
  const publicClient = usePublicClient();
  const { address } = useAccount();
  const targetAddress = queryAddress || address;

  const [data, setData] = useState<{
    sharesAmount: bigint;
    hskAmount: bigint;
    currentHskValue: bigint;
    stakeBlock: bigint;
    stakingStatus: number;
    isLoading: boolean;
    error: Error | null;
  }>({
    sharesAmount: BigInt(0),
    hskAmount: BigInt(0),
    currentHskValue: BigInt(0),
    stakeBlock: BigInt(0),
    stakingStatus: 0,
    isLoading: false,
    error: null,
  });

  useEffect(() => {
    if (!publicClient || !contractAddress || !targetAddress || stakeId === null) return;

    const fetchStakeInfo = async () => {
      setData((prev) => ({ ...prev, isLoading: true, error: null }));
      try {
        const stakeInfo = (await publicClient.readContract({
          address: contractAddress as `0x${string}`,
          abi: HashKeyChainStakingABI,
          functionName: 'getFlexibleStakeInfo',
          args: [targetAddress, BigInt(stakeId)],
        })) as [bigint, bigint, bigint, bigint, number];

        setData({
          sharesAmount: stakeInfo[0],
          hskAmount: stakeInfo[1],
          currentHskValue: stakeInfo[2],
          stakeBlock: stakeInfo[3],
          stakingStatus: stakeInfo[4],
          isLoading: false,
          error: null,
        });
      } catch (error) {
        console.error('获取灵活质押信息失败:', error);
        setData((prev) => ({
          ...prev,
          isLoading: false,
          error: error instanceof Error ? error : new Error('获取灵活质押信息失败'),
        }));
      }
    };

    fetchStakeInfo();
  }, [publicClient, contractAddress, targetAddress, stakeId]);

  return data;
}

// 7. batchGetFlexibleStakingInfo - 批量获取灵活质押信息
export async function batchGetFlexibleStakingInfo(
  contractAddress: string,
  publicClient: PublicClient,
  stakeIds: number[],
  userAddress: string
) {
  try {
    // First get the total flexible stake count
    const count = await publicClient.readContract({
      address: contractAddress as `0x${string}`,
      abi: HashKeyChainStakingABI,
      functionName: 'getUserFlexibleStakeCount',
      args: [userAddress],
    }) as bigint;

    // Generate stakeIds array based on actual count
    const actualStakeIds = Array.from({ length: Number(count) }, (_, i) => i);
    const results = [];

    for (const id of actualStakeIds) {
      try {
        const stakeInfo = await publicClient.readContract({
          address: contractAddress as `0x${string}`,
          abi: HashKeyChainStakingABI,
          functionName: 'getFlexibleStakeInfo',
          args: [userAddress, BigInt(id)],
        }) as [bigint, bigint, bigint, bigint, number];

        const rewardInfo = await publicClient.readContract({
          address: contractAddress as `0x${string}`,
          abi: HashKeyChainStakingABI,
          functionName: 'getFlexibleStakeReward',
          args: [userAddress, BigInt(id)],
        }) as [bigint, bigint, bigint, bigint];

        results.push({
          id,
          sharesAmount: stakeInfo[0],
          hskAmount: stakeInfo[1],
          currentHskValue: stakeInfo[2],
          stakeBlock: stakeInfo[3],
          stakingStatus: stakeInfo[4],
          originalAmount: rewardInfo[0],
          reward: rewardInfo[1],
          actualReward: rewardInfo[2],
          totalValue: rewardInfo[3],
          error: null,
        });
      } catch (error) {
        console.error(`Failed to fetch flexible stake ${id}:`, error);
        results.push({
          id,
          error: error
        });
      }
    }

    return results;
  } catch (error) {
    console.error('Failed to get flexible stake count:', error);
    return [];
  }
}

// 8. usePendingWithdrawals - 获取用户正在取款的信息
export function usePendingWithdrawals() {
  const { address } = useAccount();
  const chainId = useChainId();
  const publicClient = usePublicClient();
  const [data, setData] = useState<{
    withdrawals: Array<{
      id: number;
      hskAmount: bigint;
      claimableBlock: bigint;
      claimed: boolean;
      countdown: bigint; // 倒计时，以秒为单位
    }>;
    isLoading: boolean;
    error: Error | null;
  }>({
    withdrawals: [],
    isLoading: false,
    error: null,
  });

  useEffect(() => {
    const fetchWithdrawals = async () => {
      if (!address || !publicClient) return;

      setData(prev => ({ ...prev, isLoading: true, error: null }));
      try {
        const contractAddress = getContractAddresses(chainId).stakingContract;
        let withdrawals = [];
        let index = 0;
        let hasMore = true;

        // 获取当前区块号
        const currentBlock = await publicClient.getBlockNumber();

        // 遍历所有提款记录直到找不到更多
        while (hasMore) {
          try {
            const withdrawal = await publicClient.readContract({
              address: contractAddress as `0x${string}`,
              abi: HashKeyChainStakingABI,
              functionName: 'pendingWithdrawals',
              args: [address, BigInt(index)],
            }) as [bigint, bigint, boolean];

            if (withdrawal[0] > 0 || !withdrawal[2]) { // 如果金额大于0或未领取
              // 计算 countdown
              const claimableBlock = withdrawal[1];
              const blocksRemaining = claimableBlock > currentBlock ? claimableBlock - currentBlock : BigInt(0);
              const countdown = blocksRemaining * BigInt(2); // 每个区块2秒

              withdrawals.push({
                id: index,
                hskAmount: withdrawal[0],
                claimableBlock: withdrawal[1],
                claimed: withdrawal[2],
                countdown, // 倒计时，以秒为单位
              });
            }
            index++;
          } catch (error) {
            hasMore = false;
          }
        }

        setData({
          withdrawals,
          isLoading: false,
          error: null,
        });
      } catch (error) {
        console.error('获取提款信息失败:', error);
        setData(prev => ({
          ...prev,
          isLoading: false,
          error: error instanceof Error ? error : new Error('获取提款信息失败'),
        }));
      }
    };

    fetchWithdrawals();
    // 定期刷新数据
    const intervalId = setInterval(fetchWithdrawals, 300000); // 每5分钟刷新一次
    return () => clearInterval(intervalId);
  }, [address, chainId, publicClient]);

  return data;
}