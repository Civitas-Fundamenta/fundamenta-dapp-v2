import React from 'react';
import $ from 'jquery'

import { Config as config } from '../js/config'
import { Conversions as convert } from '../js/conversions';
import { Sorter as sort } from '../js/sorter';
import { enable, disable } from '../js/ui';
import { WalletProvider as wallet } from '../js/walletProvider'
import { UiCommon } from '../js/wrapUi';

import { MessagePanel as msg, MessagePanelComponent } from '../components/MessagePanel'

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

        config.fetchNetworkConfig(function (data) {
            sort.wrappable(data);
            $("#network").append($("<option />").text("Select network"));
            $.each(sort.wrapData, function () {
                $("#network").append($("<option />").text(this.network));
            });
        });

        $("#network").on('change', async () => {
            $("#token").empty();

            var index = $("#network").prop('selectedIndex') - 1;
            if (index >= 0) {
                var network = sort.wrapData[index];
                $("#token").append($("<option />").text("Select token"));
                $.each(network.tokens, function () {
                    $("#token").append($("<option />").text(this.wrappedTicker));
                });
            }

            this.common.toggleNetworkWarning();
        });

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
            <div className="p-3">
                <div className="row">
                    <div className="col-sm">
                        <div>
                            <form className="card">
                                <div className="card-header">Unwrap</div>
                                <div className="card-body">
                                    <div id="form">
                                        <div>Select Token</div>
                                        <div className="input-group mb-3">
                                            <select id="network" className="form-control form-select"></select>
                                            <select id="token" className="form-control form-select"></select>
                                        </div>
                                        <div className="input-group">
                                            <div>Amount</div>&nbsp;<div id="balance"></div>
                                        </div>
                                        <div className="mb-3">
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