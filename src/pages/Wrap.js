import React from 'react';
import $ from 'jquery';

import { Config as config } from '../js/config'
import { Conversions as convert } from '../js/conversions';
import { enable, disable } from '../js/ui';
import { WalletProvider as wallet } from '../js/walletProvider'
import { UiCommon } from '../js/wrapUi';

import { MessagePanel as msg, MessagePanelComponent } from '../components/MessagePanel'

export default class Wrap extends React.Component {

    constructor(props) {
        super(props);
        this.common = new UiCommon(true);
    }

    async getTokenAllowance() {
        var data = await this.common.getSelectedData();

        if (!data)
            return 0;

        var network = data.network;
        var token = data.token;

        if (wallet.chainId === network.chainId && wallet.web3.eth.defaultAccount) {
            var contract = new wallet.web3.eth.Contract(config.app.tokenAbi, token.backingToken.address);
            var al = await contract.methods.allowance(wallet.web3.eth.defaultAccount, data.token.address).call();
            if (!al)
                return 0;

            var allowance = convert.fromAtomicUnits(al, token.decimals).toString();
            return parseFloat(allowance);
        }
    }

    async componentDidMount() {
        msg.clear();

        this.common.registerWalletListeners('wrap');

        if (wallet.isConnected())
            enable("#form");
        else
            disable("#form");

        await this.common.populateTokenDropDown();
    }

    btnWrap_Clicked = async () => {
        var data = await this.common.getSelectedData();
        var amount = parseFloat($("#amount").val());
        var balance = await this.common.getTokenBalance();

        if (isNaN(amount) || amount <= 0) {
            msg.showWarn("Invalid amount entered");
            return;
        }

        if (isNaN(balance) || balance < amount) {
            msg.showWarn("Amount exceeds balance");
            return;
        }

        var tContract = new wallet.web3.eth.Contract(config.app.tokenAbi, data.token.backingToken.address);
        var wtContract = new wallet.web3.eth.Contract(config.app.tokenAbi, data.token.address);
        msg.clear();
        msg.showWarn("Processing. Please wait...");
        disable("#form");

        var ok = false;

        try {
            var allowance = await this.getTokenAllowance();
            if (allowance < amount) {
                var au2 = convert.toAtomicUnitsHexPrefixed(100000000, data.token.decimals);
                var at = await tContract.methods.approve(data.token.address, au2).send({ from: wallet.web3.eth.defaultAccount });
                console.log("Transaction: ", at);
                ok = at.status;
            }
            else
                ok = true;
        } catch (ex) {
            console.error(ex);
            ok = false;
        }

        if (ok) {
            try {
                var au = convert.toAtomicUnitsHexPrefixed(amount, data.token.decimals);
                var tx = await wtContract.methods.wrap(au).send({ from: wallet.web3.eth.defaultAccount });
                console.log("Transaction: ", tx);
                ok = tx.status;
            } catch (ex) {
                console.error(ex);
                ok = false;
            }
        }

        await this.common.getTokenBalance();

        enable("#form");
        msg.clear();

        if (ok)
            msg.showOk("Wrap success!");
        else
            msg.showError("Wrap failed!");

        $("#amount").val('');
    }

    componentWillUnmount() {
        wallet.removeListener('wrap');
    }

    render() {
        return (
            <div className="ps-3 pe-3">
                <div className="page-flex-container d-flex flex-row justify-content-center align-items-center">
                    <div className="page-content">
                        <form autoComplete="off" className="card border border-primary shadow">
                            <div className="card-header">Wrap</div>
                            <div className="card-body">
                                <div id="form">
                                    <div className="input-group mb-3">
                                        <select id="token" className="round-left btn-primary dropdown-toggle form-control" type="button" data-toggle="dropdown"  onChange={async () => {
                                            await this.common.getTokenBalance();
                                        }}></select>
                                        <input type="number" id="amount" className="round-right btn-primary form-control" placeholder="Enter amount" />
                                    </div>
                                    <div>
                                        <button type="button" id="button" className="round btn btn-primary w-100" onClick={this.btnWrap_Clicked}>Wrap!</button>
                                    </div>
                                </div>
                                <MessagePanelComponent />
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        )
    }
}