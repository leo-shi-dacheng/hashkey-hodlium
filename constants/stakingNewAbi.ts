export const NewStakingABI = [
    {
        "inputs": [
        {
            "internalType": "uint256",
            "name": "_startBlock",
            "type": "uint256"
        }
        ],
        "stateMutability": "nonpayable",
        "type": "constructor"
    },
    {
        "inputs": [],
        "name": "EnforcedPause",
        "type": "error"
    },
    {
        "inputs": [],
        "name": "ExpectedPause",
        "type": "error"
    },
    {
        "inputs": [
        {
            "internalType": "address",
            "name": "owner",
            "type": "address"
        }
        ],
        "name": "OwnableInvalidOwner",
        "type": "error"
    },
    {
        "inputs": [
        {
            "internalType": "address",
            "name": "account",
            "type": "address"
        }
        ],
        "name": "OwnableUnauthorizedAccount",
        "type": "error"
    },
    {
        "inputs": [],
        "name": "ReentrancyGuardReentrantCall",
        "type": "error"
    },
    {
        "anonymous": false,
        "inputs": [
        {
            "indexed": true,
            "internalType": "address",
            "name": "user",
            "type": "address"
        },
        {
            "indexed": false,
            "internalType": "uint256",
            "name": "hskAmount",
            "type": "uint256"
        }
        ],
        "name": "Claimed",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
        {
            "indexed": true,
            "internalType": "address",
            "name": "previousOwner",
            "type": "address"
        },
        {
            "indexed": true,
            "internalType": "address",
            "name": "newOwner",
            "type": "address"
        }
        ],
        "name": "OwnershipTransferred",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
        {
            "indexed": false,
            "internalType": "address",
            "name": "account",
            "type": "address"
        }
        ],
        "name": "Paused",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
        {
            "indexed": true,
            "internalType": "address",
            "name": "user",
            "type": "address"
        },
        {
            "indexed": true,
            "internalType": "uint256",
            "name": "stakeId",
            "type": "uint256"
        },
        {
            "indexed": false,
            "internalType": "uint256",
            "name": "hskAmount",
            "type": "uint256"
        },
        {
            "indexed": false,
            "internalType": "uint256",
            "name": "sharesAmount",
            "type": "uint256"
        },
        {
            "indexed": false,
            "internalType": "uint256",
            "name": "endBlock",
            "type": "uint256"
        }
        ],
        "name": "Staked",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
        {
            "indexed": false,
            "internalType": "address",
            "name": "account",
            "type": "address"
        }
        ],
        "name": "Unpaused",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
        {
            "indexed": true,
            "internalType": "address",
            "name": "user",
            "type": "address"
        },
        {
            "indexed": false,
            "internalType": "uint256",
            "name": "stHSKAmount",
            "type": "uint256"
        },
        {
            "indexed": false,
            "internalType": "uint256",
            "name": "hskAmount",
            "type": "uint256"
        },
        {
            "indexed": false,
            "internalType": "uint256",
            "name": "unlockBlock",
            "type": "uint256"
        }
        ],
        "name": "Unstaked",
        "type": "event"
    },
    {
        "inputs": [],
        "name": "ACC_PRECISION",
        "outputs": [
        {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
        }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "MINIMUM_LIQUIDITY",
        "outputs": [
        {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
        }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "STAKING_0DAYS_BLOCKS_LENGTH",
        "outputs": [
        {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
        }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "STAKING_180DAYS_BLOCKS_LENGTH",
        "outputs": [
        {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
        }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "STAKING_30DAYS_BLOCKS_LENGTH",
        "outputs": [
        {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
        }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "STAKING_365DAYS_BLOCKS_LENGTH",
        "outputs": [
        {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
        }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "STAKING_90DAYS_BLOCKS_LENGTH",
        "outputs": [
        {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
        }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "WITHDRAWAL_DELAY_BLOCKS",
        "outputs": [
        {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
        }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
        {
            "internalType": "address",
            "name": "",
            "type": "address"
        },
        {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
        }
        ],
        "name": "WithdrawalRequestStructs",
        "outputs": [
        {
            "internalType": "uint256",
            "name": "hskAmount",
            "type": "uint256"
        },
        {
            "internalType": "uint256",
            "name": "requestBlock",
            "type": "uint256"
        },
        {
            "internalType": "uint256",
            "name": "unlockBlock",
            "type": "uint256"
        },
        {
            "internalType": "bool",
            "name": "claimed",
            "type": "bool"
        }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "bonusForHSK",
        "outputs": [
        {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
        }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "claim",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
        {
            "internalType": "uint256",
            "name": "_stakeAmount",
            "type": "uint256"
        }
        ],
        "name": "getCurrentAPR",
        "outputs": [
        {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
        }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
        {
            "internalType": "uint256",
            "name": "_stHSKAmount",
            "type": "uint256"
        }
        ],
        "name": "getHSKForStHSK",
        "outputs": [
        {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
        }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
        {
            "internalType": "uint256",
            "name": "_hskAmount",
            "type": "uint256"
        }
        ],
        "name": "getStHSKForHSK",
        "outputs": [
        {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
        }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
        {
            "internalType": "address",
            "name": "_user",
            "type": "address"
        }
        ],
        "name": "getUserStakes",
        "outputs": [
        {
            "components": [
            {
                "internalType": "uint256",
                "name": "id",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "sharesAmount",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "hskAmount",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "startBlock",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "endBlock",
                "type": "uint256"
            },
            {
                "internalType": "bool",
                "name": "unstaked",
                "type": "bool"
            },
            {
                "internalType": "uint256",
                "name": "stakingBlockLength",
                "type": "uint256"
            }
            ],
            "internalType": "struct HashkeyStaking.StakeStruct[]",
            "name": "",
            "type": "tuple[]"
        }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
        {
            "internalType": "address",
            "name": "_user",
            "type": "address"
        }
        ],
        "name": "getWithdrawalRequests",
        "outputs": [
        {
            "components": [
            {
                "internalType": "uint256",
                "name": "hskAmount",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "requestBlock",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "unlockBlock",
                "type": "uint256"
            },
            {
                "internalType": "bool",
                "name": "claimed",
                "type": "bool"
            }
            ],
            "internalType": "struct HashkeyStaking.WithdrawalRequestStruct[]",
            "name": "",
            "type": "tuple[]"
        }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "initialLiquidityMinted",
        "outputs": [
        {
            "internalType": "bool",
            "name": "",
            "type": "bool"
        }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "owner",
        "outputs": [
        {
            "internalType": "address",
            "name": "",
            "type": "address"
        }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "pause",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "paused",
        "outputs": [
        {
            "internalType": "bool",
            "name": "",
            "type": "bool"
        }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "renounceOwnership",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "reservedRewards",
        "outputs": [
        {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
        }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "stHSK",
        "outputs": [
        {
            "internalType": "contract StHSK",
            "name": "",
            "type": "address"
        }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
        {
            "internalType": "uint256",
            "name": "_blocksLength",
            "type": "uint256"
        }
        ],
        "name": "stake",
        "outputs": [],
        "stateMutability": "payable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "stakingAmountForHSK",
        "outputs": [
        {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
        }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "stakingRate0Days",
        "outputs": [
        {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
        }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "stakingRate180Days",
        "outputs": [
        {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
        }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "stakingRate30Days",
        "outputs": [
        {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
        }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "stakingRate365Days",
        "outputs": [
        {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
        }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "stakingRate90Days",
        "outputs": [
        {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
        }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "startBlock",
        "outputs": [
        {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
        }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "totalPaidRewards",
        "outputs": [
        {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
        }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
        {
            "internalType": "address",
            "name": "newOwner",
            "type": "address"
        }
        ],
        "name": "transferOwnership",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "unpause",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
        {
            "internalType": "uint256",
            "name": "_stakeId",
            "type": "uint256"
        }
        ],
        "name": "unstakeById",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
        {
            "internalType": "uint256",
            "name": "_rate0Days",
            "type": "uint256"
        },
        {
            "internalType": "uint256",
            "name": "_rate30Days",
            "type": "uint256"
        },
        {
            "internalType": "uint256",
            "name": "_rate90Days",
            "type": "uint256"
        },
        {
            "internalType": "uint256",
            "name": "_rate180Days",
            "type": "uint256"
        },
        {
            "internalType": "uint256",
            "name": "_rate365Days",
            "type": "uint256"
        }
        ],
        "name": "updateStakingRates",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
        {
            "internalType": "address",
            "name": "",
            "type": "address"
        },
        {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
        }
        ],
        "name": "userStakeIds",
        "outputs": [
        {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
        }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
        {
            "internalType": "address",
            "name": "",
            "type": "address"
        },
        {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
        }
        ],
        "name": "userStakes",
        "outputs": [
        {
            "internalType": "uint256",
            "name": "id",
            "type": "uint256"
        },
        {
            "internalType": "uint256",
            "name": "sharesAmount",
            "type": "uint256"
        },
        {
            "internalType": "uint256",
            "name": "hskAmount",
            "type": "uint256"
        },
        {
            "internalType": "uint256",
            "name": "startBlock",
            "type": "uint256"
        },
        {
            "internalType": "uint256",
            "name": "endBlock",
            "type": "uint256"
        },
        {
            "internalType": "bool",
            "name": "unstaked",
            "type": "bool"
        },
        {
            "internalType": "uint256",
            "name": "stakingBlockLength",
            "type": "uint256"
        }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "withdrawBonusForHSK",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    }
];