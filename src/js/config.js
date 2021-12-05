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

        net: "mainnet.next",
        serverCount: 10,
        serverDomain: "civiport.online",
        confTime: 12,
        withdrawEventHash: "0xc1a6280eefe33f118e2ab28074ac0a44f953d5e5101c755bf744881a5a812434",
        resourceUrl: "cp3.civiport.online",
        holder0: "0xA4dda4EDfB34222063c77DFE2F50B30f5DF39870",
        holder1: "0xa0b72536ba6496aec721400b5f0e1e65caf4be77",
        holder2: "0x22a68bb25bf760d954c7e67ff06dc85297356068",

        bridgeAbi: [
            {
                "inputs": [
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
                        "internalType": "uint256",
                        "name": "nonce",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "destNetwork",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "tokenId",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "amount",
                        "type": "uint256"
                    }
                ],
                "name": "withdraw",
                "outputs": [
                    {
                        "internalType": "uint256",
                        "name": "",
                        "type": "uint256"
                    }
                ],
                "stateMutability": "nonpayable",
                "type": "function"
            },
            {
                "inputs": [
                    {
                        "internalType": "uint256",
                        "name": "tokenId",
                        "type": "uint256"
                    }
                ],
                "name": "queryToken",
                "outputs": [
                    {
                        "components": [
                            {
                                "internalType": "uint256",
                                "name": "id",
                                "type": "uint256"
                            },
                            {
                                "internalType": "bool",
                                "name": "isWrappedToken",
                                "type": "bool"
                            },
                            {
                                "internalType": "uint256",
                                "name": "numSigners",
                                "type": "uint256"
                            },
                            {
                                "internalType": "bool",
                                "name": "canWithdraw",
                                "type": "bool"
                            },
                            {
                                "internalType": "bool",
                                "name": "canDeposit",
                                "type": "bool"
                            },
                            {
                                "internalType": "contract TokenInterface",
                                "name": "token",
                                "type": "address"
                            }
                        ],
                        "internalType": "struct TokenInfo",
                        "name": "",
                        "type": "tuple"
                    }
                ],
                "stateMutability": "view",
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

        minterAbi: [
            {
                "inputs": [

                ],
                "name": "mint",
                "outputs": [
                    {
                        "internalType": "uint256",
                        "name": "",
                        "type": "uint256"
                    }
                ],
                "stateMutability": "nonpayable",
                "type": "function"
            },
            {
                "inputs": [
                    {
                        "internalType": "address",
                        "name": "",
                        "type": "address"
                    }
                ],
                "name": "hasMinted",
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
                "inputs": [

                ],
                "name": "fmtaNeeded",
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
        },

        nftMinters: {
            1: "0xDab6DCa3AF0c4427F2b39B9106D4D316d5e48e72",
            56: "0xDab6DCa3AF0c4427F2b39B9106D4D316d5e48e72",
            137: "0xDab6DCa3AF0c4427F2b39B9106D4D316d5e48e72",
            80001: "0x6C27123bb4B8B51393f0314a24d69E4bfCD3017c"
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
        });

        return ret;
    }

    static async getFmtaToken(net) {
        var ret = null;
        if (net == null)
            return;

        $.each(net.tokens, function (idx, val) {
            if (val.id === 0) {
                ret = val;
                return false;
            }
        });

        return ret;
    }

    static async getToken(net, id) {
        var ret = null;
        if (net == null)
            return;

        $.each(net.tokens, function (idx, val) {
            if (val.id === id) {
                ret = val;
                return false;
            }
        });

        return ret;
    }

    static async fetchNetworkConfig() {
        if (Config.#_fetchNetworkConfigLock)
            return;

        Config.#_fetchNetworkConfigLock = true;

        if (!this.network) {
            console.log("Fetching network config");
            this.network = await $.ajax({
                url: `https://${this.app.resourceUrl}/config/?x=${this.app.net}`,
                dataType: 'json',
                cache: 'false',
            });

            console.log("Fetching network token config");

            var tokens = await $.ajax({
                url: `https://${this.app.resourceUrl}/config/?x=${this.app.net}.tokens`,
                dataType: 'json',
                cache: 'false',
            });

            var tokenMap = new Map(Object.entries(tokens));

            $.each(this.network, function () {
                Config.networkMap.push(this);
            });

            tokenMap.forEach(async (value, key) => {
                var net = await this.getFromMap(parseInt(key));
                for (var i = 0; i < value.length; i++)
                    net.tokens.push(value[i]);
            });
        }

        Config.#_fetchNetworkConfigLock = false;
        return this.network;
    }
}