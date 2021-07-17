import React from 'react';
import $ from 'jquery';

import { Config as config } from '../js/config'
import { Conversions as convert } from '../js/conversions';
import { Sorter as sort } from '../js/sorter';
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
        msg.clearAll();

        this.common.registerWalletListeners('unwrap');

        if (wallet.isConnected())
            enable("#form");
        else
            disable("#form");

        ns.populateWrappable();
        ns.toggleNetworkWarning();
        this.common.populateTokenDropDown();

        $("#token").on('change', async () => {
            this.common.toggleNetworkWarning();
        });

        $("#amount").on('change', async () => {
            this.common.toggleNetworkWarning();
        });

        $("#button").on('click', async () => {
            var data = this.common.getSelectedData();
            var amount = parseFloat($("#amount").val());

            var contract = new wallet.web3.eth.Contract(config.app.tokenAbi, data.token.wrappedTokenAddress);
            msg.showWarn("Processing. Please wait...");
            msg.hideOk();
            msg.hideError();
            disable("#form");

            var ok = false;

            try {
                var au = convert.toAtomicUnitsHexPrefixed(amount, data.token.decimals);
                var tx = await contract.methods.unwrap(au).send({ from: wallet.web3.eth.defaultAccount });
                console.log("Transaction: ", tx);
                ok = tx.status;
            } catch (ex) {
                console.log(ex);
                ok = false;
            }

            enable("#form");
            msg.hideWarn();

            if (ok)
                msg.showOk("Unwrap success!");
            else
                msg.showError("Unwrap failed!");

            await this.common.getTokenBalance();
        });
    }

    componentWillUnmount() {
        wallet.removeListener('unwrap');
    }

    render() {
        return (
            <div className="ps-3 pe-3">
                <div className="row">
                    <div className="col-sm">
                        <div>
                            <form className="card">
                                <div className="card-header">Unwrap</div>
                                <div className="card-body">
                                    <div id="form">
                                        <div className="input-group mb-3">
                                            <select id="token" className="form-control form-select"></select>
                                            <input type="number" id="amount" className="form-control input-sm numeric-input"
                                                placeholder="Enter amount" />
                                        </div>
                                        <div>
                                            <button type="button" id="button" className="btn btn-primary">Unwrap!</button>
                                        </div>
                                    </div>
                                    <MessagePanelComponent />
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}