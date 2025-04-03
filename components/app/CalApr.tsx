import { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import { useAccount, usePublicClient } from 'wagmi';
import { StakeType } from '@/types/contracts';
import { formatEther } from 'viem';
import { useStakedInfo, useRewardsInfo, getShareToCurrentByType } from '@/hooks/useCalAPR';

export default function StartStake() {
    const publicClient = usePublicClient();
    
    const stakedData = useStakedInfo();
    console.log('stakedData 111', stakedData);
    const data111 = useRewardsInfo();
    console.log('totalRewardData 111', data111);

    // const stakedData = {
    //     totalStaked: BigInt("5246940933527082807258667"),
    //     exchangeRate: BigInt("1001157145415442822"),
    //     valueLocked30: BigInt("449443651869074766131770"),
    //     valueLocked90: BigInt("276307905182460152103813"),
    //     valueLocked180: BigInt("276307905182460152103813"),
    //     valueLocked365: BigInt("4318563053020904177209404"),
    //     valueLockedFlexiable: BigInt("93855107172968589023320"),
    //     bonus90: BigInt("2210463241459681216830"),
    //     bonus180: BigInt("5526158103649203042076"),
    //     bonus365: BigInt("172742522120836167088376"),
    //     totalBonus: BigInt("180479"),
    // };

    const totalRewardData = {
        totalPooled: BigInt("5246940933527082807258667"),
        totalShares: BigInt("5240876477338428516243898"),
        totalPaid: BigInt("1887447446459189033377"),
        reserved: BigInt("0"),
        contractBalance: BigInt("5315391888699764287006038"),
    };

    const formatValue = (amount) => {
        const formatted = formatEther(amount);
        const numericValue = Number(formatted);
        if (numericValue >= 1) {
            return numericValue.toLocaleString(undefined, { maximumFractionDigits: 2 });
        } else {
            return formatted;
        }
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
        { label: "总支付奖励", value: formatValue(totalRewardData!.totalPaid) },
        { label: "保留额", value: formatValue(totalRewardData!.reserved) },
        { label: "合约 balance", value: formatValue(totalRewardData!.contractBalance) },
    ];


    setTimeout(async () => {
    }, 3000);
 

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
