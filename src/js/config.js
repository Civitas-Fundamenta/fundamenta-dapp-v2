//set this to the required network
//testnet
//mainnet.next
//mainnet

import $ from 'jquery'

export class Config {

    static network = null;

    static app = {

        cpNet: "testnet",
        serverCount: 3,
        serverDomain: "civiport.online",
        confTime: 12,
        withdrawEventHash: "0x9e817a273ceb82157d1f8e11c7d5549ada176ef895a9ffe5e37b49de76d29e2d",
        resourceUrl: "cp3.civiport.online",

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
            }
        ]
    };

    static fetchNetworkConfig(callback) {
        if (!this.network) {
            console.log("Fetching network config");
            $.ajax({
                url: "https://" + this.app.resourceUrl + "/config/?x=" + this.app.cpNet,
                dataType: 'json',
                cache: 'false',
                success: function (data) {
                    Config.network = data;
                    callback(data);
                }
            });
        }
        else
            callback(this.network);
    }
}