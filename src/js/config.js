//set this to the required network
//testnet
//mainnet.next
//mainnet

import $ from 'jquery';

export class Config {

    static network = null;
    static networkMap = [];

    static #_fetchNetworkConfigLock = false;

    static app = {

        cpNet: "mainnet",
        serverCount: 3,
        serverDomain: "civiport.online",
        confTime: 12,
        withdrawEventHash: "0x9e817a273ceb82157d1f8e11c7d5549ada176ef895a9ffe5e37b49de76d29e2d",
        resourceUrl: "cp3.civiport.online",
        holder0: "0xA4dda4EDfB34222063c77DFE2F50B30f5DF39870",
        holder1: "0xa0b72536ba6496aec721400b5f0e1e65caf4be77",
        holder2: "0x22a68bb25bf760d954c7e67ff06dc85297356068",

        bridgeAbi: [
            {
                "inputs": [
                    {
                        "internalType": "bytes",
                        "name": "clientSignature",
                        "type": "bytes"
                    },
                    {
                        "internalType": "bytes[]",
                        "name": "serverSignatures",
                        "type": "bytes[]"
                    },
                    {
                        "internalType": "bytes",
                        "name": "transactionData",
                        "type": "bytes"
                    }
                ],
                "name": "deposit",
                "outputs": [

                ],
                "stateMutability": "nonpayable",
                "type": "function"
            },
            {
                "inputs": [
                    {
                        "internalType": "bytes",
                        "name": "clientSignature",
                        "type": "bytes"
                    },
                    {
                        "internalType": "bytes",
                        "name": "transactionData",
                        "type": "bytes"
                    }
                ],
                "name": "withdraw",
                "outputs": [

                ],
                "stateMutability": "nonpayable",
                "type": "function"
            }
        ],

        tokenAbi: [
            {
                "inputs": [
                    {
                        "internalType": "address",
                        "name": "owner",
                        "type": "address"
                    },
                    {
                        "internalType": "address",
                        "name": "spender",
                        "type": "address"
                    }
                ],
                "name": "allowance",
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
                        "name": "spender",
                        "type": "address"
                    },
                    {
                        "internalType": "uint256",
                        "name": "amount",
                        "type": "uint256"
                    }
                ],
                "name": "approve",
                "outputs": [
                    {
                        "internalType": "bool",
                        "name": "",
                        "type": "bool"
                    }
                ],
                "stateMutability": "nonpayable",
                "type": "function"
            },
            {
                "inputs": [
                    {
                        "internalType": "address",
                        "name": "account",
                        "type": "address"
                    }
                ],
                "name": "balanceOf",
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
                        "name": "amount",
                        "type": "uint256"
                    }
                ],
                "name": "unwrap",
                "outputs": [

                ],
                "stateMutability": "nonpayable",
                "type": "function"
            },
            {
                "inputs": [
                    {
                        "internalType": "uint256",
                        "name": "amount",
                        "type": "uint256"
                    }
                ],
                "name": "wrap",
                "outputs": [

                ],
                "stateMutability": "nonpayable",
                "type": "function"
            },
            {
                "inputs": [

                ],
                "name": "totalSupply",
                "outputs": [
                    {
                        "internalType": "uint256",
                        "name": "",
                        "type": "uint256"
                    }
                ],
                "stateMutability": "view",
                "type": "function"
            }
        ],

        stakeAbi: [
            {
                "inputs": [
                    {
                        "internalType": "uint256",
                        "name": "_stake",
                        "type": "uint256"
                    }
                ],
                "name": "createStake",
                "outputs": [

                ],
                "stateMutability": "nonpayable",
                "type": "function"
            },
            {
                "inputs": [
                    {
                        "internalType": "address",
                        "name": "_stakeholder",
                        "type": "address"
                    }
                ],
                "name": "stakeOf",
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
                        "name": "_stake",
                        "type": "uint256"
                    }
                ],
                "name": "removeStake",
                "outputs": [

                ],
                "stateMutability": "nonpayable",
                "type": "function"
            },
            {
                "inputs": [

                ],
                "name": "withdrawReward",
                "outputs": [

                ],
                "stateMutability": "nonpayable",
                "type": "function"
            },
            {
                "inputs": [

                ],
                "name": "compoundRewards",
                "outputs": [

                ],
                "stateMutability": "nonpayable",
                "type": "function"
            },
            {
                "inputs": [

                ],
                "name": "rewardsAccrued",
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

                ],
                "name": "totalStakes",
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

                ],
                "name": "stakeCalc",
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

                ],
                "name": "totalRewardsPaid",
                "outputs": [
                    {
                        "internalType": "uint256",
                        "name": "",
                        "type": "uint256"
                    }
                ],
                "stateMutability": "view",
                "type": "function"
            }
        ],

        miningAbi: [
            {
                "inputs": [

                ],
                "name": "showCurrentLockPeriods",
                "outputs": [
                    {
                        "internalType": "uint256",
                        "name": "_lockPeriod0",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "_lockPeriod1",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "_lockPeriod2",
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
                        "name": "",
                        "type": "uint256"
                    }
                ],
                "name": "poolInfo",
                "outputs": [
                    {
                        "internalType": "contract IERC20",
                        "name": "ContractAddress",
                        "type": "address"
                    },
                    {
                        "internalType": "uint256",
                        "name": "TotalRewardsPaidByPool",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "TotalLPTokensLocked",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "PoolBonus",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "lockPeriod0BasisPoint",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "lockPeriod1BasisPoint",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "lockPeriod2BasisPoint",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "compYield0",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "compYield1",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "compYield2",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "maxPoolBP",
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
                        "name": "_account",
                        "type": "address"
                    },
                    {
                        "internalType": "uint256",
                        "name": "_pid",
                        "type": "uint256"
                    }
                ],
                "name": "accountPosition",
                "outputs": [
                    {
                        "internalType": "address",
                        "name": "_accountAddress",
                        "type": "address"
                    },
                    {
                        "internalType": "uint256",
                        "name": "_unlockHeight",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "_lockedAmount",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "_lockPeriodInDays",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "_userDPY",
                        "type": "uint256"
                    },
                    {
                        "internalType": "contract IERC20",
                        "name": "_lpTokenAddress",
                        "type": "address"
                    },
                    {
                        "internalType": "uint256",
                        "name": "_totalRewardsPaidFromPool",
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
                        "name": "_lpTokenAmount",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "_lockPeriod",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "_pid",
                        "type": "uint256"
                    }
                ],
                "name": "addPosition",
                "outputs": [

                ],
                "stateMutability": "nonpayable",
                "type": "function"
            },
            {
                "inputs": [
                    {
                        "internalType": "uint256",
                        "name": "_pid",
                        "type": "uint256"
                    }
                ],
                "name": "removePosition",
                "outputs": [

                ],
                "stateMutability": "nonpayable",
                "type": "function"
            },
            {
                "inputs": [
                    {
                        "internalType": "uint256",
                        "name": "_pid",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "_lpTokenAmount",
                        "type": "uint256"
                    }
                ],
                "name": "withdrawAccruedYieldAndAdd",
                "outputs": [

                ],
                "stateMutability": "nonpayable",
                "type": "function"
            }
        ],

        lpPools: {
            1: {
                0: "FMTA/ETH",
                1: "FMTA/USDC"
            },
            4: {
                0: "FMTA/WETH"
            },
            56: {
                0: "FMTA/BNB"
            }
        }
    };

    static async getFromMap(chainId) {
        if (this.networkMap.length === 0)
            await this.fetchNetworkConfig();

        if (chainId === 0)
            return null;

        var ret = null;
        $.each(this.networkMap, function (idx, val) {
            if (val.chainId === chainId) {
                ret = val;
                return false;
            }
        })

        return ret;
    }

    static async fetchNetworkConfig() {
        if (Config.#_fetchNetworkConfigLock)
            return;

        Config.#_fetchNetworkConfigLock = true;
            
        if (!this.network) {
            console.log("Fetching network config");
            this.network = await $.ajax({
                url: `https://${this.app.resourceUrl}/config/?x=${this.app.cpNet}`,
                dataType: 'json',
                cache: 'false',
            });

            $.each(this.network, function () {
                Config.networkMap.push(this);
            });
        }
        
        Config.#_fetchNetworkConfigLock = false;
        return this.network;
    }
}