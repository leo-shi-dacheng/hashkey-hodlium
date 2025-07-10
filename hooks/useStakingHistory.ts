import { useQuery } from '@apollo/client';
import { 
  GET_USER_STAKING_HISTORY, 
  StakingHistoryData, 
  StakingHistoryVars,
  StakeEntity,
  TokenTransfer
} from '@/graphql/queries';

interface FormattedStake extends Omit<StakeEntity, 
  'sharesAmount' | 'hskAmount' | 'currentHskValue' | 'profit' | 'penalty' | 'unstakeAmount'> {
  sharesAmount: bigint;
  hskAmount: bigint;
  currentHskValue?: bigint;
  profit?: bigint;
  penalty?: bigint;
  unstakeAmount?: bigint;
  formattedStakedAt: Date;
  formattedUnstakeAt?: Date;
  formattedLockEndTime?: Date;
  durationDays: number;
}

interface StakingHistoryResult {
  loading: boolean;
  error?: Error;
  stakingHistory: {
    totalStaked: bigint;
    totalUnstaked: bigint;
    totalRewards: bigint;
  } | null;
  completedStakes: FormattedStake[];
  activeStakes: FormattedStake[];
  lifetimeRewards: bigint;
  refetch: () => void;
  allStakes: FormattedStake[];
  tokenTransfers: TokenTransfer[];
}

export function useStakingHistory(userAddress?: string, blockNumber?: number): StakingHistoryResult {
  // 确保地址小写，The Graph 需要这种格式
  const formattedAddress = userAddress ? userAddress.toLowerCase() : '';
  
  const { data, loading, error, refetch } = useQuery<StakingHistoryData, StakingHistoryVars>(
    GET_USER_STAKING_HISTORY, 
    {
      variables: { userAddress: formattedAddress, blockNumber },
      skip: !userAddress,
      fetchPolicy: 'cache-and-network',
    }
  );

  const stakingHistory = data?.user ? {
    totalStaked: BigInt(data.user.totalStaked || '0'),
    totalUnstaked: BigInt(data.user.totalUnstaked || '0'),
    totalRewards: BigInt(data.user.totalRewards || '0')
  } : null;
  
  const allFormattedStakes: FormattedStake[] = data?.stakes?.map(stake => ({
    ...stake,
    sharesAmount: BigInt(stake.sharesAmount),
    hskAmount: BigInt(stake.hskAmount),
    currentHskValue: stake.currentHskValue ? BigInt(stake.currentHskValue) : undefined,
    profit: stake.profit ? BigInt(stake.profit) : undefined,
    unstakeAmount: stake.unstakeAmount ? BigInt(stake.unstakeAmount) : undefined,
    penalty: stake.penalty ? BigInt(stake.penalty) : undefined,
    formattedStakedAt: new Date(parseInt(stake.stakedAt) * 1000),
    formattedUnstakeAt: stake.unstakeAt ? new Date(parseInt(stake.unstakeAt) * 1000) : undefined,
    formattedLockEndTime: new Date(parseInt(stake.lockEndTime) * 1000),
    durationDays: stake.unstakeAt ? 
      Math.floor((parseInt(stake.unstakeAt) - parseInt(stake.stakedAt)) / 86400) : 
      Math.floor((parseInt(stake.lockEndTime) - parseInt(stake.stakedAt)) / 86400)
  })) || [];
  
  const completedStakes: FormattedStake[] = allFormattedStakes
    .filter(stake => stake.isWithdrawn);
  
  const activeStakes: FormattedStake[] = allFormattedStakes
    .filter(stake => !stake.isWithdrawn);
    
  const lifetimeRewards = stakingHistory?.totalRewards || BigInt(0);

  return {
    loading,
    error: error as Error | undefined,
    stakingHistory,
    completedStakes,
    activeStakes,
    lifetimeRewards,
    refetch,
    allStakes: allFormattedStakes,
    tokenTransfers: data?.tokenTransfers || []
  };
}