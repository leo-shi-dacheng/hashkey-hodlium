'use client';

import { useEffect, useState } from 'react';
import { usePublicClient, useChainId } from 'wagmi';
import { getContractAddresses } from '@/config/contracts';
import { 
  createPublicClient, 
  http, 
  parseAbiItem, 
  type PublicClient,
  type Log
} from 'viem';
import { mainnet } from 'viem/chains';

// Define event types based on the contract events
export interface StakeEvent {
  user: `0x${string}`;
  hskAmount: bigint;
  sharesAmount: bigint;
  stakeType: number;
  lockEndTime: bigint;
  stakeId: bigint;
  blockNumber: bigint;
  transactionHash: `0x${string}`;
  logIndex: number;
}

export interface UnstakeEvent {
  user: `0x${string}`;
  sharesAmount: bigint;
  hskAmount: bigint;
  isEarlyWithdrawal: boolean;
  penalty: bigint;
  stakeId: bigint;
  blockNumber: bigint;
  transactionHash: `0x${string}`;
  logIndex: number;
}

export type ContractEvent = StakeEvent | UnstakeEvent;

// Define the expected log types with args
interface StakeLog extends Log {
  args: {
    user: `0x${string}`;
    hskAmount: bigint;
    sharesAmount: bigint;
    stakeType: number;
    lockEndTime: bigint;
    stakeId: bigint;
  };
}

interface UnstakeLog extends Log {
  args: {
    user: `0x${string}`;
    sharesAmount: bigint;
    hskAmount: bigint;
    isEarlyWithdrawal: boolean;
    penalty: bigint;
    stakeId: bigint;
  };
}

// Extend globalThis to include publicClient
declare global {
  interface Window {
    publicClient?: PublicClient;
  }
}

// Constants
const MAX_BLOCK_RANGE = 1000; // Maximum block range allowed by the RPC provider

/**
 * Hook to fetch all historical Stake and Unstake events from the contract
 * @param fromBlock Optional starting block number (defaults to 0)
 * @param toBlock Optional ending block number (defaults to 'latest')
 * @param userAddress Optional address to filter events by user
 * @returns Object containing stake events, unstake events, loading state, and error state
 */
export function useContractEvents(
  fromBlock: bigint = 0n,
  toBlock: bigint | 'latest' = 'latest',
  userAddress?: `0x${string}`
) {
  const chainId = useChainId();
  const publicClient = usePublicClient();
  const contractAddress = getContractAddresses(chainId).stakingContract;
  
  const [stakeEvents, setStakeEvents] = useState<StakeEvent[]>([]);
  const [unstakeEvents, setUnstakeEvents] = useState<UnstakeEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchEvents = async () => {
      if (!publicClient || !contractAddress) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);
      setStakeEvents([]);
      setUnstakeEvents([]);

      try {
        // Get the latest block number if toBlock is 'latest'
        let resolvedToBlock: bigint;
        if (toBlock === 'latest') {
          resolvedToBlock = await publicClient.getBlockNumber();
        } else {
          resolvedToBlock = toBlock;
        }

        // Define event filters (without block range yet)
        const stakeEventSignature = parseAbiItem('event Stake(address indexed user, uint256 hskAmount, uint256 sharesAmount, uint8 stakeType, uint256 lockEndTime, uint256 stakeId)');
        const unstakeEventSignature = parseAbiItem('event Unstake(address indexed user, uint256 sharesAmount, uint256 hskAmount, bool isEarlyWithdrawal, uint256 penalty, uint256 stakeId)');

        // Prepare arrays to collect all events
        const allStakeEvents: StakeEvent[] = [];
        const allUnstakeEvents: UnstakeEvent[] = [];

        // Calculate the number of chunks needed
        let currentFromBlock = fromBlock;
        
        // Fetch events in chunks
        while (currentFromBlock <= resolvedToBlock) {
          // Calculate the end block for this chunk
          const chunkToBlock = currentFromBlock + BigInt(MAX_BLOCK_RANGE) > resolvedToBlock 
            ? resolvedToBlock 
            : currentFromBlock + BigInt(MAX_BLOCK_RANGE - 1);
          
          console.log(`Fetching events from block ${currentFromBlock} to ${chunkToBlock}`);
          
          // Create filters for this chunk
          const stakeEventFilter = {
            address: contractAddress,
            event: stakeEventSignature,
            fromBlock: currentFromBlock,
            toBlock: chunkToBlock,
            args: userAddress ? { user: userAddress } : undefined,
          };

          const unstakeEventFilter = {
            address: contractAddress,
            event: unstakeEventSignature,
            fromBlock: currentFromBlock,
            toBlock: chunkToBlock,
            args: userAddress ? { user: userAddress } : undefined,
          };

          try {
            // Fetch events for this chunk in parallel
            const [stakeLogsResult, unstakeLogsResult] = await Promise.all([
              publicClient.getLogs(stakeEventFilter),
              publicClient.getLogs(unstakeEventFilter),
            ]);
            if (stakeLogsResult.length) {
              console.log(stakeLogsResult, 'stakeLogsResult')
            }

            // Process stake events
            const processedStakeEvents = stakeLogsResult.map(log => {
              const typedLog = log as unknown as StakeLog;
              return {
                user: typedLog.args.user,
                hskAmount: typedLog.args.hskAmount,
                sharesAmount: typedLog.args.sharesAmount,
                stakeType: Number(typedLog.args.stakeType),
                lockEndTime: typedLog.args.lockEndTime,
                stakeId: typedLog.args.stakeId,
                blockNumber: typedLog.blockNumber ?? 0n,
                transactionHash: typedLog.transactionHash ?? '0x0' as `0x${string}`,
                logIndex: typedLog.logIndex ?? 0,
              };
            });

            // Process unstake events
            const processedUnstakeEvents = unstakeLogsResult.map(log => {
              const typedLog = log as unknown as UnstakeLog;
              return {
                user: typedLog.args.user,
                sharesAmount: typedLog.args.sharesAmount,
                hskAmount: typedLog.args.hskAmount,
                isEarlyWithdrawal: typedLog.args.isEarlyWithdrawal,
                penalty: typedLog.args.penalty,
                stakeId: typedLog.args.stakeId,
                blockNumber: typedLog.blockNumber ?? 0n,
                transactionHash: typedLog.transactionHash ?? '0x0' as `0x${string}`,
                logIndex: typedLog.logIndex ?? 0,
              };
            });

            // Add events from this chunk to the overall results
            allStakeEvents.push(...processedStakeEvents);
            allUnstakeEvents.push(...processedUnstakeEvents);

            // Update state with progress
            setStakeEvents(prev => [...prev, ...processedStakeEvents]);
            setUnstakeEvents(prev => [...prev, ...processedUnstakeEvents]);
            
          } catch (chunkError) {
            console.error(`Error fetching events for block range ${currentFromBlock}-${chunkToBlock}:`, chunkError);
            // Continue with the next chunk instead of stopping completely
          }

          // Move to the next chunk
          currentFromBlock = chunkToBlock + 1n;
        }

        // Sort events by block number (newest first)
        allStakeEvents.sort((a, b) => Number(b.blockNumber - a.blockNumber));
        allUnstakeEvents.sort((a, b) => Number(b.blockNumber - a.blockNumber));

        // Set final results
        setStakeEvents(allStakeEvents);
        setUnstakeEvents(allUnstakeEvents);
        
      } catch (err) {
        console.error('Error fetching contract events:', err);
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvents();
  }, [publicClient, contractAddress, fromBlock, toBlock, userAddress]);

  return { stakeEvents, unstakeEvents, isLoading, error };
}

/**
 * Utility function to fetch all historical contract events without using a hook
 * Useful for server components or one-time fetches
 */
export async function fetchContractEvents(
  contractAddress: `0x${string}`,
  fromBlock: bigint = 3319640n,
  toBlock: bigint | 'latest' = 'latest',
  userAddress?: `0x${string}`,
  rpcUrl?: string
) {
  // Create a public client if not provided
  const client = rpcUrl 
    ? createPublicClient({
        chain: mainnet,
        transport: http(rpcUrl),
      })
    : undefined;
    
  // Use provided client or create a new one
  const publicClient = client || (typeof window !== 'undefined' ? window.publicClient : undefined);
  
  if (!publicClient) {
    throw new Error('No public client available. Please provide an RPC URL or ensure a global client exists.');
  }
  
  try {
    // Get the latest block number if toBlock is 'latest'
    let resolvedToBlock: bigint;
    if (toBlock === 'latest') {
      resolvedToBlock = await publicClient.getBlockNumber();
    } else {
      resolvedToBlock = toBlock;
    }

    // Define event signatures
    const stakeEventSignature = parseAbiItem('event Stake(address indexed user, uint256 hskAmount, uint256 sharesAmount, uint8 stakeType, uint256 lockEndTime, uint256 stakeId)');
    const unstakeEventSignature = parseAbiItem('event Unstake(address indexed user, uint256 sharesAmount, uint256 hskAmount, bool isEarlyWithdrawal, uint256 penalty, uint256 stakeId)');

    // Prepare arrays to collect all events
    const allStakeEvents: StakeEvent[] = [];
    const allUnstakeEvents: UnstakeEvent[] = [];

    // Calculate the number of chunks needed
    let currentFromBlock = fromBlock;
    
    // Fetch events in chunks
    while (currentFromBlock <= resolvedToBlock) {
      // Calculate the end block for this chunk
      const chunkToBlock = currentFromBlock + BigInt(MAX_BLOCK_RANGE) > resolvedToBlock 
        ? resolvedToBlock 
        : currentFromBlock + BigInt(MAX_BLOCK_RANGE - 1);
      
      console.log(`Fetching events from block ${currentFromBlock} to ${chunkToBlock}`);
      
      // Create filters for this chunk
      const stakeEventFilter = {
        address: contractAddress,
        event: stakeEventSignature,
        fromBlock: currentFromBlock,
        toBlock: chunkToBlock,
        args: userAddress ? { user: userAddress } : undefined,
      };

      const unstakeEventFilter = {
        address: contractAddress,
        event: unstakeEventSignature,
        fromBlock: currentFromBlock,
        toBlock: chunkToBlock,
        args: userAddress ? { user: userAddress } : undefined,
      };

      try {
        // Fetch events for this chunk in parallel
        const [stakeLogsResult, unstakeLogsResult] = await Promise.all([
          publicClient.getLogs(stakeEventFilter),
          publicClient.getLogs(unstakeEventFilter),
        ]);

        // Process stake events
        const processedStakeEvents = stakeLogsResult.map((log: unknown) => {
          const typedLog = log as unknown as StakeLog;
          return {
            user: typedLog.args.user,
            hskAmount: typedLog.args.hskAmount,
            sharesAmount: typedLog.args.sharesAmount,
            stakeType: Number(typedLog.args.stakeType),
            lockEndTime: typedLog.args.lockEndTime,
            stakeId: typedLog.args.stakeId,
            blockNumber: typedLog.blockNumber ?? 0n,
            transactionHash: typedLog.transactionHash ?? '0x0' as `0x${string}`,
            logIndex: typedLog.logIndex ?? 0,
          };
        });

        // Process unstake events
        const processedUnstakeEvents = unstakeLogsResult.map((log: unknown) => {
          const typedLog = log as unknown as UnstakeLog;
          return {
            user: typedLog.args.user,
            sharesAmount: typedLog.args.sharesAmount,
            hskAmount: typedLog.args.hskAmount,
            isEarlyWithdrawal: typedLog.args.isEarlyWithdrawal,
            penalty: typedLog.args.penalty,
            stakeId: typedLog.args.stakeId,
            blockNumber: typedLog.blockNumber ?? 0n,
            transactionHash: typedLog.transactionHash ?? '0x0' as `0x${string}`,
            logIndex: typedLog.logIndex ?? 0,
          };
        });

        // Add events from this chunk to the overall results
        allStakeEvents.push(...processedStakeEvents);
        allUnstakeEvents.push(...processedUnstakeEvents);
        
      } catch (chunkError) {
        console.error(`Error fetching events for block range ${currentFromBlock}-${chunkToBlock}:`, chunkError);
        // Continue with the next chunk instead of stopping completely
      }

      // Move to the next chunk
      currentFromBlock = chunkToBlock + 1n;
    }

    // Sort events by block number (newest first)
    allStakeEvents.sort((a, b) => Number(b.blockNumber - a.blockNumber));
    allUnstakeEvents.sort((a, b) => Number(b.blockNumber - a.blockNumber));

    return { stakeEvents: allStakeEvents, unstakeEvents: allUnstakeEvents };
  } catch (err) {
    console.error('Error fetching contract events:', err);
    throw err;
  }
} 