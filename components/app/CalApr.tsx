import { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import { useAccount, usePublicClient } from 'wagmi';
import { StakeType } from '@/types/contracts';
import { formatEther } from 'viem';
import { useStakedInfo, useRewardsInfo, getShareToCurrentByType } from '@/hooks/useCalAPR';

export default function StartStake() {
    const publicClient = usePublicClient();
    const stakedData = useStakedInfo();
    const {totalRewardData} = useRewardsInfo();
    console.log("stakedData", stakedData);
    console.log("totalRewardData", totalRewardData);
    // If either data source is not ready, show loading state
    if (!stakedData?.totalStaked || !totalRewardData) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
                    <p className="text-slate-400">Loading contract data...</p>
                </div>
            </div>
        );
    }

    const formatValue = (amount: bigint) => {
        const formatted = formatEther(amount);
        const numericValue = Number(formatted);
        if (numericValue >= 1) {
            return numericValue.toLocaleString(undefined, { maximumFractionDigits: 2 });
        } else {
            return formatted;
        }
    };

    const calculateAnnualRewards = (blockReward: bigint): bigint => {
        const secondsPerYear = 365 * 24 * 60 * 60; // seconds in a year
        const blocksPerSecond = 1n / 2n; // 2 seconds per block -> 0.5 blocks per second
        const blocksPerYear = BigInt(secondsPerYear) * blocksPerSecond;
        return blockReward * blocksPerYear;
    };

    const stakedDataRows = [
        { label: "总质押额", value: formatValue(stakedData.totalStaked) },
        { label: "汇率", value: stakedData.exchangeRate.toString() },
        { label: "30天锁定价值", value: formatValue(stakedData.valueLocked30) },
        { label: "90天锁定价值", value: formatValue(stakedData.valueLocked90) },
        { label: "180天锁定价值", value: formatValue(stakedData.valueLocked180) },
        { label: "365天锁定价值", value: formatValue(stakedData.valueLocked365) },
        { label: "灵活锁定价值", value: formatValue(stakedData.valueLockedFlexiable) },
        { label: "90 days bouns", value: formatValue(stakedData.bonus90) },
        { label: "180 days bouns", value: formatValue(stakedData.bonus180) },
        { label: "365 days bouns", value: formatValue(stakedData.bonus365) },
        { label: "总奖金", value: stakedData.totalBonus.toString() },
    ];

    const rewardDataRows = [
        { label: "总池", value: formatValue(totalRewardData!.totalPooled) },
        { label: "总份额", value: formatValue(totalRewardData!.totalShares) },
        { label: "每区块奖励", value: formatValue(totalRewardData!.totalPaid) },
        { label: "全年总额奖励", value: formatValue(calculateAnnualRewards(totalRewardData!.totalPaid)) },
        { label: "保留额", value: formatValue(totalRewardData!.reserved) },
        { label: "合约 balance", value: formatValue(totalRewardData!.contractBalance) },
    ];

    return (
        <div>
            <h2 className="text-2xl font-semibold mb-4">质押数据</h2>
            <table className="table table-zebra w-full">
                <tr>
                    <th className="font-semibold">指标</th>
                    <th className="font-semibold">值</th>
                </tr>
                {stakedDataRows.map((row) => (
                    <tr key={row.label}>
                        <td>{row.label}</td>
                        <td>{row.value}</td>
                    </tr>
                ))}
            </table>
            <h2 className="text-2xl font-semibold mt-8 mb-4">奖励数据</h2>
            <table className="table table-zebra w-full">
                <tr>
                    <th className="font-semibold">指标</th>
                    <th className="font-semibold">值</th>
                </tr>
                {rewardDataRows.map((row) => (
                    <tr key={row.label}>
                        <td>{row.label}</td>
                        <td>{row.value}</td>
                    </tr>
                ))}
            </table>
        </div>
    );
}
