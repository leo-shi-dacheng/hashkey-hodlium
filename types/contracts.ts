export enum StakeType {
    FIXED_30_DAYS = 0,
    FIXED_90_DAYS = 1,
    FIXED_180_DAYS = 2,
    FIXED_365_DAYS = 3
}
  
export interface LockedStakeInfo {
    sharesAmount: bigint;
    hskAmount: bigint;
    currentHskValue: bigint;
    lockEndTime: bigint;
    isWithdrawn: boolean;
    isLocked: boolean;
}

export interface NewLockedStakeInfo {
    id: number | bigint;
    sharesAmount: bigint;
    hskAmount: bigint;
    currentHskValue: bigint;
    lockEndTime: bigint;
    isWithdrawn: boolean;
    isLocked: boolean;
    reward: bigint;
    isLoading: boolean;
    error: Error | null;
}
  
export interface StakingStats {
    totalStakedAmount: bigint;
    durations: [bigint, bigint, bigint, bigint];
    currentAPRs: [bigint, bigint, bigint, bigint];
    maxPossibleAPRs: [bigint, bigint, bigint, bigint];
    baseBonus: [bigint, bigint, bigint, bigint];
}
  
export interface APRInfo {
    baseApr: bigint;
    minApr: bigint;
    maxApr: bigint;
}