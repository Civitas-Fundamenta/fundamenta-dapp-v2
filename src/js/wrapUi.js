import { MessagePanel as msg } from '../components/MessagePanel'
import $ from 'jquery';
import { enable, disable } from './ui';
import { WalletProvider as wallet, WalletProvider } from './walletProvider'
import { Config as config } from './config'
import { Conversions as convert } from './conversions';
import { Sorter as sort } from './sorter';
import EventEmitter from 'events';

export class UiCommon {

    constructor(wrap) {
        this.wrap = wrap;
        this._populateTokenDropDownLock = false;
    }

    async getTokenBalance() {
        var data = await this.getSelectedData();

        if (!data) {
            $("#amount").attr("placeholder", "Enter amount");
            return;
        }

        var network = data.network;
        var token = data.token;
        var contract;

        if (wallet.chainId === network.chainId && wallet.web3.eth.defaultAccount) {
            if (this.wrap)
                contract = new wallet.web3.eth.Contract(config.app.tokenAbi, token.tokenAddress);
            else
                contract = new wallet.web3.eth.Contract(config.app.tokenAbi, token.wrappedTokenAddress);

            var bal = await contract.methods.balanceOf(wallet.web3.eth.defaultAccount).call();

            if (!bal)
                bal = 0;

            var balance = convert.fromAtomicUnits(bal, token.decimals).toString();

            $("#amount").attr('placeholder', `Enter amount (max ${balance})`);
            return parseFloat(balance);
        }
    }

    async getSelectedData() {
        var network = await config.getFromMap(WalletProvider.chainId);
        if (!network)
            return;

        var tokIndex = $("#token").prop('selectedIndex') - 1;
        if (tokIndex < 0)
            return;

        var token = network.tokens[tokIndex];

        return {
            network: network,
            token: token
        };
    }

    async populateTokenDropDown() {
        if (this._populateTokenDropDownLock)
            return;
        
        this._populateTokenDropDownLock = true;

        console.log("populateTokenDropDown");
        $("#token").empty();
        $("#token").append($("<option />").text("Select token"));
        var chainId = wallet.chainId;
        
        if (isNaN(chainId)) {
            disable("#form");
            this._populateTokenDropDownLock = false;
            return;
        }

        enable("#form");
        await config.fetchNetworkConfig();
        sort.wrappable(config.network);

        console.log("WrapData:", sort.wrapData);

        if (isNaN(wallet.chainId) || wallet.chainId === 0)
        {
            disable("#form");
            this._populateTokenDropDownLock = false;
            return;
        }
        
        var network = null;
        $.each(sort.wrapData, function () {
            if (this.chainId === wallet.chainId) {
                network = this;
                return false;
            }
        });

        if (!network)
        {
            this._populateTokenDropDownLock = false;
            return;
        }

        if (this.wrap)
        {
            $.each(network.tokens, function () {
                $("#token").append($("<option />").text(this.ticker));
            });
        }
        else
        {
            $.each(network.tokens, function () {
                $("#token").append($("<option />").text(this.wrappedTicker));
            });
        }

        this._populateTokenDropDownLock = false;
    }

    registerWalletListeners(id) {
        if (!wallet.hasListener(id)) {
            var em = new EventEmitter();

            em.on('connect', async (connectInfo) => {
                await this.populateTokenDropDown();
                enable("#form");
            });

            em.on('disconnect', (disconnectInfo) => {
                disable("#form");
                msg.clear();
            });

            em.on('accountsChanged', async (accounts) => {
                if (accounts === null || accounts.length === 0) {
                    disable("#form");
                    return;
                }
                await this.populateTokenDropDown();
                enable("#form");
            });

            em.on('chainChanged', async (chainId) => {
                await this.populateTokenDropDown();
                enable("#form");
            });

            wallet.addListener(id, em);
        }
    }
}