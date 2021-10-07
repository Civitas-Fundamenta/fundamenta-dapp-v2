
import WalletConnectProvider from "@walletconnect/web3-provider";
import Web3 from "web3";

import { Config as config } from './config'

export class WalletProvider {
    static web3 = null;
    static provider = null;
    static chainId = 0;
    static emitters = new Map();
    static isWalletConnect = false;
    static isMetamask = false;

    static rpcUrls = new Map([
        [1, "https://mainnet.infura.io/v3/9354d2b6c5ee45c2a4036efd7b617783"],
        [4, "https://rinkeby.infura.io/v3/9354d2b6c5ee45c2a4036efd7b617783"],
        [5, "https://goerli.infura.io/v3/9354d2b6c5ee45c2a4036efd7b617783"],
        [56, "https://bsc-dataseed.binance.org/"],
        [137, "https://nameless-spring-thunder.matic.quiknode.pro/31bde5b070c0a83c878ae0588646c253d6022f33/"],
        [80001, "https://icy-thrumming-violet.matic-testnet.quiknode.pro/9c463eb8c1b9cfb5f78cde780f58ba2892454d10/"]
    ]);

    static explorerUrls = new Map([
        [1, "https://etherscan.io"],
        [4, "https://rinkeby.etherscan.io"],
        [5, "https://goerli.etherscan.io"],
        [56, "https://bscscan.com"],
        [137, "https://polygonscan.com"],
        [80001, "https://mumbai.polygonscan.com"]
    ]);

    static nativeCoins = new Map([
        [56, "BNB"],
        [137, "MATIC"]
    ]);

    static niceNames = new Map([
        [1, "Ethereum"],
        [4, "Rinkeby"],
        [5, "Goerli"],
        [56, "Binance"],
        [137, "Polygon"],
        [80001, "Mumbai"]
    ]);

    static networkNames = new Map([
        [1, "ethereum"],
        [4, "rinkeby"],
        [5, "goerli"],
        [56, "binance"],
        [137, "polygon"],
        [80001, "mumbai"]
    ]);

    static getNetworkName() {
        if (this.networkNames.has(this.chainId))
            return this.networkNames.get(this.chainId);

        return "unknown";
    }

    static addListener(key, emitter) {
        if (this.emitters.has(key))
            return;

        this.emitters.set(key, emitter);
    }

    static removeListener(key) {
        if (!this.emitters.has(key))
            return;

        this.emitters.delete(key);
    }

    static hasListener(key) {
        return this.emitters.has(key);
    }

    static isConnected() {
        return this.web3 != null;
    }

    static isMetamaskAvailable() {
        return (window.ethereum);
    }

    static async walletConnect() {
        this.isMetamask = false;
        this.isWalletConnect = true;

        console.log("Using WalletConnect provider");
        this.provider = new WalletConnectProvider({
            rpc: this.rpcUrls,
            chainId: config.cpNet === "testnet" ? 4 : 1
        });

        this.web3 = new Web3(this.provider);

        this._registerProvider();

        this.provider.wc.on('wc_sessionUpdate', (error, payload) => {
            if (error) {
                this.chainId = 0;
                console.warn('wc_sessionUpdate', error);
                return;
            }

            if (payload) {
                this.chainId = payload.params[0].chainId;
                console.log('chainChanged', this.chainId);
                for (let e of WalletProvider.emitters.values())
                    e.emit('chainChanged', this.chainId);
            }
        });

        try {
            await this.provider.enable();
        } catch {
            this.isWalletConnect = false;
            return false;
        }

        this.chainId = parseInt(await this.provider.request({ method: 'eth_chainId' }));
        for (let e of WalletProvider.emitters.values())
            e.emit('chainChanged', this.chainId);

        for (let e of this.emitters.values())
            e.emit('connect');

        return true;
    }

    static async metamask() {
        this.isWalletConnect = false;
        this.isMetamask = true;

        console.log("Using MetaMask provider");
        this.provider = window.ethereum;
        this.web3 = new Web3(this.provider);
        this._registerProvider();

        if (window.ethereum.selectedAddress) {
            console.log("Metamask already approved for this site");
            this.web3.eth.defaultAccount = window.ethereum.selectedAddress;
            for (let e of this.emitters.values())
                e.emit('accountsChanged', [window.ethereum.selectedAddress]);

            this.chainId = parseInt(await this.provider.request({ method: 'eth_chainId' }), 16);
        }
        else {
            await this.provider.request({ method: 'eth_requestAccounts' });
            this.chainId = parseInt(await this.provider.request({ method: 'eth_chainId' }), 16);
        }

        for (let e of this.emitters.values())
            e.emit('chainChanged', WalletProvider.chainId);

        for (let e of this.emitters.values())
            e.emit('connect');

        return true;
    }

    static _registerProvider() {
        this.provider.on('accountsChanged', async function (accounts) {
            if (accounts !== null && accounts.length > 0) {
                WalletProvider.web3.eth.defaultAccount = accounts[0];
                for (let e of WalletProvider.emitters.values())
                    e.emit('accountsChanged', accounts);
            }
            else
                WalletProvider.disconnect();
        });

        this.provider.on('chainChanged', async function (chainId) {
            if (WalletProvider.isMetamask)
                WalletProvider.chainId = parseInt(chainId, 16);
            else
                WalletProvider.chainId = chainId;

            for (let e of WalletProvider.emitters.values())
                e.emit('chainChanged', WalletProvider.chainId);
        });

        this.provider.on('connect', async function (connectInfo) {
            for (let e of WalletProvider.emitters.values())
                e.emit('connect', connectInfo);
        });

        this.provider.on('disconnect', async function (disconnectInfo) {
            WalletProvider.web3 = null;
            WalletProvider.provider = null;
            WalletProvider.isWalletConnect = false;
            WalletProvider.isMetamask = false;
            for (let e of WalletProvider.emitters.values())
                e.emit('disconnect', disconnectInfo);
        });
    }

    static async switchNetwork(id) {
        if (this.isWalletConnect) {
            this.provider.chainId = id;
            this.provider.networkId = id;

            await this.provider.request({
                method: "wc_sessionUpdate",
                params: [
                    {
                        chainId: id,
                        approved: true,
                    }
                ]
            });

            return;
        }

        if (this.isMetamask) {
            try {
                await window.ethereum.request({
                    method: 'wallet_switchEthereumChain',
                    params: [{ chainId: '0x' + id.toString(16) }]
                });
            } catch (switchError) {
                console.log("unhandled switching error", switchError);
            }
        }
    }

    static async addMetamaskChain(id) {
        if (!this.isMetamask)
            return;

        try {
            await window.ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [
                    {
                        chainId: '0x' + id.toString(16),
                        chainName: this.niceNames.get(id),
                        nativeCurrency: {
                            name: this.nativeCoins.get(id),
                            symbol: this.nativeCoins.get(id),
                            decimals: 18
                        },
                        rpcUrls: [
                            this.rpcUrls.get(id)
                        ],
                        blockExplorerUrls: [
                            this.explorerUrls.get(id)
                        ]
                    }
                ]
            });
        } catch (e) {
            console.log("unhandled error", e);
        }
    }

    static async disconnect() {
        this.web3 = null;

        if (this.provider) {
            if (this.isWalletConnect)
                await this.provider.disconnect();
        }

        this.provider = null;

        if (this.isMetamask) {
            for (let e of this.emitters.values())
                e.emit('disconnect', null);
        }

        this.isWalletConnect = false;
        this.isMetamask = false;
    }
}