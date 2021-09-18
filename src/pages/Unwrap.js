import React from 'react';
import $ from 'jquery';

import { Config as config } from '../js/config'
import { Conversions as convert } from '../js/conversions';
import { enable, disable } from '../js/ui';
import { WalletProvider as wallet } from '../js/walletProvider'
import { UiCommon } from '../js/wrapUi';

import { MessagePanel as msg, MessagePanelComponent } from '../components/MessagePanel'
import { NetworkSelect as ns } from '../components/NetworkSelect';

export default class Unwrap extends React.Component {

    constructor(props) {
        super(props);
        this.common = new UiCommon(false);
    }

    async componentDidMount() {
        msg.clear();

        this.common.registerWalletListeners('unwrap');

        if (wallet.isConnected())
            enable("#form");
        else
            disable("#form");

        ns.populateWrappable();
        this.common.populateTokenDropDown();
    }

    btnUnwrap_Clicked = async () => {
        var data = this.common.getSelectedData();
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

        var contract = new wallet.web3.eth.Contract(config.app.tokenAbi, data.token.wrappedTokenAddress);
        msg.clear();
        msg.showWarn("Processing. Please wait...");
        disable("#form");

        var ok = false;

        try {
            var au = convert.toAtomicUnitsHexPrefixed(amount, data.token.decimals);
            var tx = await contract.methods.unwrap(au).send({ from: wallet.web3.eth.defaultAccount });
            console.log("Transaction: ", tx);
            ok = tx.status;
        } catch (ex) {
            console.error(ex);
            ok = false;
        }

        await this.common.getTokenBalance();

        msg.clear();
        enable("#form");

        if (ok)
            msg.showOk("Unwrap success!");
        else
            msg.showError("Unwrap failed!");

        $("#amount").val('');
    };

    componentWillUnmount() {
        wallet.removeListener('unwrap');
    }

    render() {
        return (
            <div className="ps-3 pe-3">
                <div className="page-flex-container d-flex flex-row justify-content-center align-items-center">
                    <div className="page-content">
                        <form autocomplete="off" className="card border border-primary shadow">
                            <div className="card-header">Unwrap</div>
                            <div className="card-body">
                                <div id="form">
                                    <div className="input-group mb-3">
                                        <select id="token" className="round-left btn-primary dropdown-toggle form-control" type="button" data-toggle="dropdown"  onChange={async () => {
                                            await this.common.getTokenBalance();
                                        }}></select>
                                        <input type="number" id="amount" className="round-right btn-primary form-control" placeholder="Enter amount" />
                                    </div>
                                    <div>
                                        <button type="button" id="button" className="round btn btn-primary w-100" onClick={this.btnUnwrap_Clicked}>Unwrap!</button>
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