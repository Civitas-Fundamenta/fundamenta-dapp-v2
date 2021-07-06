import { MessagePanel as msg } from '../components/MessagePanel'
import $ from 'jquery'
import { enable, disable } from './ui';
import { WalletProvider as wallet } from './walletProvider'
import { Config as config } from './config'
import { Conversions as convert } from './conversions';
import { Sorter as sort } from './sorter';
import EventEmitter from 'events';

export class UiCommon {

    constructor(wrap) {
        this.wrap = wrap;
    }

    async toggleNetworkWarning() {
        var data = this.getSelectedData();

        msg.clearAll();

        if (!data) {
            msg.showError("Ensure all fields are entered");
            disable("#button");
            return;
        }

        if (data.network.chainId !== wallet.chainId) {
            msg.showWarn("Switch to the " + data.network.network + " network to continue");
            disable("#button");
            return;
        }

        if (!wallet.web3.eth.defaultAccount)
            return;

        var balance = await this.getTokenBalance();
        var amount = parseFloat($("#amount").val());
        if (isNaN(amount) || amount <= 0 || isNaN(balance) || balance < amount) {
            msg.showWarn("Invalid amount entered");
            disable("#button");
            return;
        }

        enable("#button");
    }

    async getTokenBalance() {
        var data = this.getSelectedData();

        if (!data) {
            $("#balance").empty();
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

            $("#balance").text(" (max " + balance + ")");
            return parseFloat(balance);
        }
    }

    getSelectedData() {
        var netIndex = $("#network").prop('selectedIndex') - 1;
        var tokIndex = $("#token").prop('selectedIndex') - 1;
        if (netIndex < 0 || tokIndex < 0)
            return;

        var network = sort.wrapData[netIndex];
        var token = network.tokens[tokIndex];

        return {
            network: network,
            token: token
        };
    }

    registerWalletListeners(id) {
        if (!wallet.hasListener(id)) {
            console.log("Registering wrap component wallet listeners");
            var em = new EventEmitter();

            em.on('connect', (connectInfo) => {
                enable("#form");
            });

            em.on('disconnect', (disconnectInfo) => {
                disable("#form");
            });

            em.on('accountsChanged', async (accounts) => {
                if (accounts.length === 0) {
                    disable("#form");
                    return;
                }

                enable("#form");
                await this.toggleNetworkWarning();
            });

            em.on('chainChanged', async (chainId) => {
                await this.toggleNetworkWarning();
            });

            wallet.addListener(id, em);
        }
    }
}