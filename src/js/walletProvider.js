
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

    static networkNames = new Map([
        [ 1, "ethereum" ],
        [ 4, "rinkeby" ],
        [ 5, "goerli" ],
        [ 56, "binance" ]
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
            rpc: {
                1: "https://mainnet.infura.io/v3/9354d2b6c5ee45c2a4036efd7b617783",
                4: "https://rinkeby.infura.io/v3/9354d2b6c5ee45c2a4036efd7b617783",
                5: "https://goerli.infura.io/v3/9354d2b6c5ee45c2a4036efd7b617783",
                56: "https://bsc-dataseed.binance.org/"
            },
            chainId: config.cpNet === "testnet" ? 4 : 1,
            qrcodeModalOptions: {
                mobileLinks: [ ],
              }
        });

        this.web3 = new Web3(this.provider);

        this.#registerProvider();

        this.provider.wc.on('wc_sessionUpdate', (error, payload) =>
        {
            if (error) {
                this.chainId = 0;
                console.warn('wc_sessionUpdate', error);
                return;
            }

            if (payload) {
                this.chainId = payload.params[0].chainId;
                console.log('chainChanged', this.chainId);
                for (let e of WalletProvider.emitters.values())
                    e.emit('chainChanged', payload.params[0].chainId);
            }
        });

        try {
            await this.provider.enable();
        } catch {
            this.isWalletConnect = false;
            return false; }

        await this.provider.request({ method: 'eth_requestAccounts' });
        this.chainId = parseInt(await this.provider.request({ method: 'eth_chainId' }));

        return true;
    }

    static async metamask() {
        this.isWalletConnect = false;
        this.isMetamask = true;

        console.log("Using MetaMask provider");
        this.provider = window.ethereum;
        this.web3 = new Web3(this.provider);
        this.#registerProvider();

        if (window.ethereum.selectedAddress) {
            console.log("Metamask already approved for this site");
            this.web3.eth.defaultAccount = window.ethereum.selectedAddress;
            for (let e of this.emitters.values())
                e.emit('accountsChanged', [window.ethereum.selectedAddress]);

            this.chainId = parseInt(await this.provider.request({ method: 'eth_chainId' }));

            for (let e of this.emitters.values())
                e.emit('chainChanged', WalletProvider.chainId);

            for (let e of this.emitters.values())
                e.emit('connect');
        }
        else
        {
            await this.provider.request({ method: 'eth_requestAccounts' });
            this.chainId = parseInt(await this.provider.request({ method: 'eth_chainId' }));
        }

        return true;
    }

    static #registerProvider() {
        this.provider.on('accountsChanged', async function (accounts) {
            if (accounts.length > 0)
                WalletProvider.web3.eth.defaultAccount = accounts[0];
            else
                WalletProvider.web3.eth.defaultAccount = null;

            console.log('accountsChanged', accounts);
            for (let e of WalletProvider.emitters.values())
                e.emit('accountsChanged', accounts);
        });

        this.provider.on('chainChanged', async function (chainId) {
            if (WalletProvider.isMetamask)
                WalletProvider.chainId = parseInt(chainId);
            else
                WalletProvider.chainId = chainId;
            
            console.log('WalletProvider.chainChanged', WalletProvider.chainId);
            for (let e of WalletProvider.emitters.values())
                e.emit('chainChanged', WalletProvider.chainId);
        });

        this.provider.on('connect', async function (connectInfo) {
            console.log('WalletProvider.connect');
            for (let e of WalletProvider.emitters.values())
                e.emit('connect', connectInfo);
        });

        this.provider.on('disconnect', async function (disconnectInfo) {
            console.log('WalletProvider.disconnect');
            for (let e of WalletProvider.emitters.values())
                e.emit('disconnect', disconnectInfo);
        });
    }

    static async switchNetwork(id) {
        if (!this.isWalletConnect)
            return;

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
    }

    static async disconnect() {
        this.web3 = null;

        console.log("Disconnecting wallet");
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