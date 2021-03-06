
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

    static explorerUrls = new Map([
        [1, "https://etherscan.io"],
        [4, "https://rinkeby.etherscan.io"],
        [5, "https://goerli.etherscan.io"],
        [25, "https://cronos.crypto.org/explorer"],
        [56, "https://bscscan.com"],
        [100, "https://blockscout.com/xdai/mainnet"],
        [137, "https://polygonscan.com"],
        [250, "https://ftmscan.com"],
        [43114, "https://snowtrace.io"],
        [80001, "https://mumbai.polygonscan.com"]
    ]);

    static rpcUrls = new Map([
        [1, "https://mainnet.infura.io/v3/9354d2b6c5ee45c2a4036efd7b617783"],
        [4, "https://rinkeby.infura.io/v3/9354d2b6c5ee45c2a4036efd7b617783"],
        [5, "https://goerli.infura.io/v3/9354d2b6c5ee45c2a4036efd7b617783"],
        [25, "https://evm-cronos.crypto.org"],
        [56, "https://bsc-dataseed.binance.org/"],
        [100, "https://rpc.xdaichain.com"],
        [137, "https://polygon-rpc.com"],
        [250, "https://rpc.ftm.tools/"],
        [43114, "https://api.avax.network/ext/bc/C/rpc"],
        [80001, "https://polygon-mumbai.infura.io/v3/9354d2b6c5ee45c2a4036efd7b617783"]
    ]);

    static async getNetworkName() {
        var net = await config.getFromMap(this.chainId)
        if (!net)
            return "Unknown";

        return net.name;
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
        if (this.isConnected())
            return;

        this.isMetamask = false;
        this.isWalletConnect = true;

        console.log("Using WalletConnect provider");
        this.provider = new WalletConnectProvider({
            rpc: {
                1: this.rpcUrls.get(1),
                4: this.rpcUrls.get(4),
                5: this.rpcUrls.get(5),
                25: this.rpcUrls.get(25),
                56: this.rpcUrls.get(56),
                100: this.rpcUrls.get(100),
                137: this.rpcUrls.get(137),
                250: this.rpcUrls.get(250),
                43114: this.rpcUrls.get(43114),
                80001: this.rpcUrls.get(8001),
            },
            chainId: config.app.net === "testnet" ? 4 : 1
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
            this.web3 = null;
            this.provider = null;
            localStorage.setItem('provider', 'none');
            return false;
        }

        this.chainId = parseInt(await this.provider.request({ method: 'eth_chainId' }));
        for (let e of WalletProvider.emitters.values())
            e.emit('chainChanged', this.chainId);

        for (let e of this.emitters.values())
            e.emit('connect');

        localStorage.setItem('provider', 'walletConnect');

        return true;
    }

    static async metamask() {
        if (this.isConnected())
            return;

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

        localStorage.setItem('provider', 'metamask');

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
            
            if (WalletProvider.isMetamask)
                return;

            WalletProvider.web3 = null;
            WalletProvider.provider = null;
            WalletProvider.isWalletConnect = false;
            WalletProvider.isMetamask = false;
            localStorage.setItem('provider', 'none');
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

        var net = await config.getFromMap(id);

        try {
            await window.ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [
                    {
                        chainId: '0x' + id.toString(16),
                        chainName: net.name,
                        nativeCurrency: {
                            name: net.ticker,
                            symbol: net.ticker,
                            decimals: 18
                        },
                        rpcUrls: [
                            net.rpc
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
        localStorage.setItem('provider', 'none');

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