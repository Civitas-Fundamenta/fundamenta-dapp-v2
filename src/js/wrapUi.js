import { MessagePanel as msg } from '../components/MessagePanel'
import $ from 'jquery';
import { enable, disable } from './ui';
import { WalletProvider as wallet, WalletProvider } from './walletProvider'
import { Config as config } from './config'
import { Conversions as convert } from './conversions';
import EventEmitter from 'events';

import { NetworkSelect as ns } from '../components/NetworkSelect';

export class UiCommon {

    constructor(wrap) {
        this.wrap = wrap;
    }

    async getTokenBalance() {
        var data = this.getSelectedData();

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

    getSelectedData() {
        var network = ns.getFromMap(WalletProvider.chainId);
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

    populateTokenDropDown() {
        $("#token").empty();
        $("#token").append($("<option />").text("Select token"));
        var chainId = ns.get().chainId;

        if (isNaN(chainId)) {
            disable("#form");
            return;
        }

        enable("#form");

        var network = ns.getFromMap(chainId);
        if (!network)
            return;

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
    }

    registerWalletListeners(id) {
        if (!wallet.hasListener(id)) {
            var em = new EventEmitter();

            em.on('connect', (connectInfo) => {
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

                enable("#form");
            });

            em.on('chainChanged', async (chainId) => {
                this.populateTokenDropDown();
            });

            wallet.addListener(id, em);
        }
    }
}