export const HashKeyChainStakingABI = [
  {
    name: "isStakingOpen",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "bool" }]
  },
  {
    name: "getCurrentExchangeRate",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint256" }]
  },
  {
    "inputs": [
        { "internalType": "uint256", "name": "sharesAmount", "type": "uint256" },
        { "internalType": "uint256", "name": "hskAmount", "type": "uint256" },
        { "internalType": "uint256", "name": "lockEndTime", "type": "uint256" },
        { "internalType": "uint256", "name": "lockDuration", "type": "uint256" },
        { "internalType": "bool", "name": "withdrawn", "type": "bool" }
    ],
    "name": "LockedStake",
    "type": "struct"
  },
  {
    name: "getUserLockedStakeCount",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "_user", type: "address" }],
    outputs: [{ type: "uint256" }]
  },
  {
    name: "getUserActiveLockedStakes",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "_user", type: "address" }],
    outputs: [{ type: "uint256" }]
  },
  {
    name: "getLockedStakeInfo",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "_user", type: "address" },
      { name: "_stakeId", type: "uint256" }
    ],
    outputs: [
      { name: "sharesAmount", type: "uint256" },
      { name: "hskAmount", type: "uint256" },
      { name: "currentHskValue", type: "uint256" },
      { name: "lockEndTime", type: "uint256" },
      { name: "isWithdrawn", type: "bool" },
      { name: "isLocked", type: "bool" }
    ]
  },
  {
    name: "totalValueLocked",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint256" }]
  },
  {
    name: "updateRewardPool",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [],
    outputs: []
  },
  {
    name: "lastRewardBlock",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint256" }]
  },
  {
    name: "hskPerBlock",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint256" }]
  },
  {
    name: "totalShares",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint256" }]
  },
  {
    name: "getAllStakingAPRs",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "_stakeAmount", type: "uint256" }],
    outputs: [
      { name: "estimatedAPRs", type: "uint256[4]" },
      { name: "maxAPRs", type: "uint256[4]" }
    ]
  },
  {
    name: "getDetailedStakingStats",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "_simulatedStakeAmount", type: "uint256" }],
    outputs: [
      { name: "totalStakedAmount", type: "uint256" },
      { name: "durations", type: "uint256[4]" },
      { name: "currentAPRs", type: "uint256[4]" },
      { name: "maxPossibleAPRs", type: "uint256[4]" },
      { name: "baseBonus", type: "uint256[4]" }
    ]
  },
  {
    name: "getHSKStakingAPR",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "_stakeAmount", type: "uint256" }],
    outputs: [
      { name: "baseApr", type: "uint256" },
      { name: "minApr", type: "uint256" },
      { name: "maxApr", type: "uint256" }
    ]
  },
  {
    name: "stHSK",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "address" }]
  },
  {
    name: "minStakeAmount",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint256" }]
  },
  {
    name: "stake",
    type: "function",
    stateMutability: "payable",
    inputs: [],
    outputs: []
  },
  {
    name: "stakeLocked",
    type: "function",
    stateMutability: "payable",
    inputs: [{ name: "_stakeType", type: "uint8" }],
    outputs: []
  },
  {
    name: "unstakeLocked",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "_stakeId", type: "uint256" }],
    outputs: []
  },
  {
    name: "unstake",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "_sharesAmount", type: "uint256" }],
    outputs: []
  },
  {
    name: "totalPooledHSK",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint256" }]
  },
  {
    type: "event",
    name: "Stake",
    inputs: [
      { indexed: true, name: "user", type: "address" },
      { indexed: false, name: "hskAmount", type: "uint256" },
      { indexed: false, name: "sharesAmount", type: "uint256" },
      { indexed: false, name: "stakeType", type: "uint8" },
      { indexed: false, name: "lockEndTime", type: "uint256" },
      { indexed: false, name: "stakeId", type: "uint256" }
    ]
  },
  {
    type: "event",
    name: "Unstake",
    inputs: [
      { indexed: true, name: "user", type: "address" },
      { indexed: false, name: "sharesAmount", type: "uint256" },
      { indexed: false, name: "hskAmount", type: "uint256" },
      { indexed: false, name: "isEarlyWithdrawal", type: "bool" },
      { indexed: false, name: "penalty", type: "uint256" },
      { indexed: false, name: "stakeId", type: "uint256" }
    ]
  }
];

export const StHSKABI = [
  {
    name: "totalSupply",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint256" }]
  },
  {
    name: "balanceOf",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ type: "uint256" }]
  },
  {
    name: "transfer",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" }
    ],
    outputs: [{ type: "bool" }]
  },
  {
    name: "allowance",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" }
    ],
    outputs: [{ type: "uint256" }]
  },
  {
    name: "approve",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" }
    ],
    outputs: [{ type: "bool" }]
  }
];