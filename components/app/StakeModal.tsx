import React, { forwardRef, useImperativeHandle, useState, useEffect } from 'react';

interface ModalProps {
  activeLockedStakes: number;
  progressStep: number;
}

// 在文件顶部添加类型定义
interface BatchUnstakeResult {
  totalStaked: bigint;
  isUnstakeFlags: boolean[];
  completedCount: number;
  totalCount: number;
  stakeInfos: Record<number, {
    sharesAmount: bigint;
    hskAmount: bigint;
    currentHskValue: bigint;
    lockEndTime: bigint;
    isWithdrawn: boolean;
    isLocked: boolean;
    reward: bigint;
  }>;
}

// 更新 ProcessFunction 类型
type ProcessFunction = () => Promise<BatchUnstakeResult>;

const Modal = forwardRef<{ openModal: (processFunction: ProcessFunction) => void }, ModalProps>((props, ref) => {
  const { activeLockedStakes, progressStep } = props;
  const dialogRef = React.useRef<HTMLDialogElement>(null);
  const [isProcessComplete, setProcessComplete] = useState(false);
  const [isConfirmingClose, setConfirmingClose] = useState(false);
  const [result, setResult] = useState<BatchUnstakeResult | null>(null);

  const handleClose = () => {
    if (!isProcessComplete) {
      setConfirmingClose(true);
    } else {
      dialogRef.current?.close();
    }
  };

  const handleCancel = (event: Event) => {
    if (!isProcessComplete) {
      event.preventDefault();
      setConfirmingClose(true);
    }
  };

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog) {
      dialog.addEventListener('cancel', handleCancel);
    }
    return () => {
      if (dialog) {
        dialog.removeEventListener('cancel', handleCancel);
      }
    };
  }, [isProcessComplete]);

  useImperativeHandle(ref, () => ({
    openModal: async (processFunction: ProcessFunction) => {
      setProcessComplete(false);
      setConfirmingClose(false);
      dialogRef.current?.showModal();
      
      try {
        const processResult = await processFunction();
        setResult(processResult);
        setProcessComplete(true);
      } catch (error) {
        console.error('Process execution failed:', error);
      }
    },
  }));

  return (
    <dialog ref={dialogRef} className="modal">
      <div className="modal-box bg-slate-800/30 backdrop-blur-sm border border-slate-700/50 rounded-xl p-8 w-3/5 max-w-5xl">
        {isConfirmingClose ? (
          <div className="text-center space-y-6">
            <div className="mb-6">
              <svg className="w-16 h-16 text-yellow-500 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-2xl font-light text-white mb-4">Confirm Early Closure</h3>
            <p className="text-slate-400 mb-8">Are you sure you want to close? The upgrade process is still in progress.</p>
            <div className="flex justify-center gap-4">
              <button 
                className="btn bg-slate-700 hover:bg-slate-600 border-slate-600 text-white px-6"
                onClick={() => dialogRef.current?.close()}
              >
                Confirm Close
              </button>
              <button 
                className="btn bg-primary/80 hover:bg-primary border-primary/50 text-white px-6"
                onClick={() => setConfirmingClose(false)}
              >
                Continue Process
              </button>
            </div>
          </div>
        ) : isProcessComplete ? (
          <div className="text-center space-y-6">
            <div className="mb-6">
              <svg className="w-16 h-16 text-green-500 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-2xl font-light text-white mb-4">Upgrade Complete!</h3>
            {result && (
              <div className="bg-slate-700/20 rounded-lg p-4 mb-6">
                <p className="text-slate-300 mb-2">
                  Successfully migrated {result.completedCount} of {result.totalCount} positions
                </p>
                {result.totalStaked && (
                  <p className="text-xl font-medium text-green-500">
                    Total Value: {(Number(result.totalStaked) / 10**18).toFixed(4)} HSK
                  </p>
                )}
              </div>
            )}
            <button 
              className="btn bg-primary/80 hover:bg-primary text-white w-full"
              onClick={() => dialogRef.current?.close()}
            >
              Close
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-2xl font-light text-white mb-2">Upgrade Your Staking</h3>
              <p className="text-slate-400">Migrating to enhanced staking protocol</p>
            </div>
            
            <ul className="space-y-4 text-slate-300">
              <li className="flex items-start gap-3">
                <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Original staked HSK can earn profits (rewards can be claimed even before maturity)</span>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Enhanced profits (total profits increased by 60%)</span>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Original long-term stakes directly converted to flexible staking</span>
              </li>
            </ul>

            <div className="space-y-4">
              <div className="flex justify-between text-sm text-slate-400">
                <span>Migration Progress</span>
                <span>{progressStep} / {activeLockedStakes}</span>
              </div>
              <progress
                className="progress progress-primary w-full h-3 bg-slate-700/50"
                value={progressStep}
                max={activeLockedStakes}
              />
            </div>

            <button
              className="btn btn-ghost btn-sm absolute right-4 top-4 text-slate-400 hover:text-white"
              onClick={handleClose}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </dialog>
  );
});

Modal.displayName = 'Modal';

export default Modal;