import { useRef } from 'react';
import Link from 'next/link';
import { useAccount } from 'wagmi';
import { useBatchUnstakeLocked, useUserStakingInfo } from '@/hooks/useStakingContracts';
import router from 'next/router';
import Modal from './StakeModal';

export default function StartStake() {
  // check user is staked is active
  const { activeLockedStakes } = useUserStakingInfo();
  const { startbatchUnstake, progress, totalStakes } = useBatchUnstakeLocked();

  const { address } = useAccount();
  const modalRef = useRef<{ openModal: (fn: any) => void }>(null);
  
  // 一键提取 并且 质押新的
  const unStakeAllAndNewStake = async () => {
    try {
      // Remove progress watcher and manual updates
      const result = await startbatchUnstake();
      console.log(result, 'startbatchUnstake completed');
      return result;
    } catch (error) {
      console.error('Failed to process unstaking:', error);
      throw error;
    }
  };

  return (
    <>
      <div className="mt-10">
        {address && activeLockedStakes > 0 ? (
          <div 
            onClick={() => {
              modalRef.current!.openModal(unStakeAllAndNewStake)
            }}
            className="inline-flex items-center px-8 py-4 rounded-xl bg-primary/80 text-white hover:bg-primary transition-colors text-lg font-medium shadow-lg hover:shadow-xl cursor-pointer"
          >
            One-click profit increases
            <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg> 
          </div>
        ) : (
          <Link 
            href="/stake" 
            className="inline-flex items-center px-8 py-4 rounded-xl bg-primary/80 text-white hover:bg-primary transition-colors text-lg font-medium shadow-lg hover:shadow-xl"
          >
            Start Staking
            <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </Link>
        )}
      </div>
      <Modal ref={modalRef} activeLockedStakes={Number(activeLockedStakes)} progressStep={progress}/>
    </>
  );
}

// nextjs 和 daisyui V5 实现 Modal
 
// 这是文案
// - 原质押HSK可以获取收益（即使未到期也可以领取收益）
// - 增强收益（总收益增加60%）
// - 原长期直接转为灵活质押（仍保持获取收益）

// 补充一下描述：
// 点击按钮，直接执行，同时打开 Modal

// 原先有一条或者多条质押记录，
// 大部分用户是一条，少部分用户是多条，最多可能有14条
// 确保都成功解除质押，最后再质押到新的合约
// 如果失败，则那条会有重试功能。

// 希望用户可以看到进度条，防止提前关闭。
// 如果进度没完成，提前关闭弹窗需要二次确认
// 样式要优美，符合 https://www.hskhodlium.xyz/ 的主题样式

// 这是我的按钮 
// <div 
// onClick={() => {
//   unStakeAllAndNewStake();
// }}
// className="inline-flex items-center px-8 py-4 rounded-xl bg-primary/80 text-white hover:bg-primary transition-colors text-lg font-medium shadow-lg hover:shadow-xl cursor-pointer"
// >
// {/* {activeLockedStakes} */}
// One-click profit increases
 
// </div>
//   const unStakeAllAndNewStake = async() => {
//     // 先解锁所有旧的 再质押新的
//     const totalStaked = await startbatchUnstake();
//     console.log(totalStaked, 'startbatchUnstake data');
//   }