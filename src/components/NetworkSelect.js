import React from 'react';
import $ from 'jquery';
import 'bootstrap';
import EventEmitter from 'events';

import { Config as config } from '../js/config'
import { Sorter as sort } from '../js/sorter';
import { WalletProvider as wallet } from '../js/walletProvider'

import { NetworkSelect as ns } from './NetworkSelect';
import { enable, disable, show, hide } from '../js/ui';

export class NetworkSelect {

    static networkMap = [];

    static emptyAddress = "0x0000000000000000000000000000000000000000";

    static toggleNetworkWarning() {
        if (!wallet.isConnected()) {
            console.log("wallet not connected");
            hide("#_aInvNet");
            hide('#_aAcc');
            show('#_aNoAcc');
            return;
        }
        else {
            if (wallet.web3.eth.defaultAccount == null) {
                hide('#_aAcc');
                show('#_aNoAcc');
            }
            else {
                $("#_aAccText").text(wallet.web3.eth.defaultAccount);
                hide('#_aNoAcc');
                show('#_aAcc');
            }
        }

        var net = ns.getFromMap(wallet.chainId);

        if (!net) {
            $("#_aInvNetText").text(`Invalid network. Wallet set to chain ${wallet.chainId}`);
            show("#_aInvNet");
        }
        else
            hide("#_aInvNet");
        
        $("#_btnD").text(wallet.getNetworkName());
    }

    static openModal() {
        $("#_modSelect").addClass("d-block")
        $("#_modSelect").addClass("show")
    }

    static closeModal() {
        $("#_modSelect").removeClass("d-block")
        $("#_modSelect").removeClass("show")
    }

    static empty() {
        $("#_sNs").empty();
        $("#_sNs").append(`<option>Select Network</option>`);
        this.networkMap.length = 0;
        this.networkMap.push({ chainId: 0 });
    }

    static populateAll() {
        this.empty();
        config.fetchNetworkConfig(function (data) {
            $.each(data, function () {
                ns.networkMap.push(this);
                $("#_sNs").append(`<option value="${this.chainId}">${this.network}</option>`);
            });
        });

        if (wallet.isConnected())
            this.set(wallet.chainId);
        else
            this.set(0);

        this.toggleNetworkWarning();
    }

    static populateWrappable() {
        this.empty();
        config.fetchNetworkConfig(function (data) {
            sort.wrappable(data);
            $.each(sort.wrapData, function () {
                ns.networkMap.push(this);
                $("#_sNs").append(`<option value="${this.chainId}">${this.network}</option>`);
            });
        });

        if (wallet.isConnected())
            this.set(wallet.chainId);
        else
            this.set(0);

        this.toggleNetworkWarning();
    }

    static populateMineable() {
        this.empty();
        config.fetchNetworkConfig(function (data) {
            $.each(data, function () {
                if (this.liquidityMining.address !== ns.emptyAddress) {
                    ns.networkMap.push(this);
                    $("#_sNs").append(`<option value="${this.chainId}">${this.network}</option>`);
                }
            });
        });

        if (wallet.isConnected())
            this.set(wallet.chainId);
        else
            this.set(0);

        this.toggleNetworkWarning();
    }

    static getFromMap(chainId) {
        if (chainId === 0)
            return null;

        var ret = null;
        $.each(this.networkMap, function (idx, val) {
            if (val.chainId === chainId) {
                ret = val;
                return false;
            }
        })

        return ret;
    }

    static get() {
        //var idx = $("#_sNs").prop('selectedIndex');
        var val = $("#_sNs option:selected").val();
        var name = $("#_sNs option:selected").text();
        return {
            chainId: parseInt(val),
            network: name
        }
    }

    static set(chainId) {
        var current = this.get();
        if (current.chainId === chainId)
            return;

        var net = ns.getFromMap(wallet.chainId);

        if (!net) {
            $("#_sNs").prop("selectedIndex", 0);
            return;
        }

        $.each(this.networkMap, function (idx, val) {
            if (val.chainId === chainId) {
                $("#_sNs").prop("selectedIndex", idx);
                return false;
            }
        })
    }

    static _sNs_change() {
        if (!wallet.isConnected)
            return;

        var net = ns.get();

        if (isNaN(net.chainId)) {
            $("#_aInvNetText").text(`Select a network to continue`);
            show("#_aInvNet");
        }
        else if (net.chainId !== wallet.chainId) {
            if (wallet.isMetamask) {
                $("#_aInvNetText").text(`Switch metamask to the ${net.network} network`);
                show("#_aInvNet");
            }
            else if (wallet.isWalletConnect) {
                $("#_aInvNetText").text(`Sending request to change to the ${net.network} network`);
                show("#_aInvNet");
                wallet.switchNetwork(net.chainId);
            }
        }
        else {
            hide("#_aInvNet");
        }
    }

    static async _btnC_clicked() {
        if (wallet.isMetamaskAvailable()) {
            console.log("Metamask is available. Displaying modal");
            ns.openModal();
        }
        else {
            console.log("Metamask not available. Defaulting to Wallet Connect");
            var connected = await wallet.walletConnect();
            if (connected) {
                hide("#_btnC");
                show("#_btnD");
            }
            else {
                hide("#_btnD");
                show("#_btnC");
            }
        }
    }

    static async _btnE_clicked() {
        ns.closeModal();
    }

    static async _btnD_clicked() {
        await wallet.disconnect();
    }

    static async _wc_clicked() {
        ns.closeModal();

        var connected = await wallet.walletConnect();
        if (connected) {
            hide("#_btnC");
            show("#_btnD");
        }
        else {
            hide("#_btnD");
            show("#_btnC");
        }
    }

    static async _mm_clicked() {
        ns.closeModal();

        var connected = await wallet.metamask();
        if (connected) {
            hide("#_btnC");
            show("#_btnD");
        }
        else {
            hide("#_btnD");
            show("#_btnC");
        }
    }
}

export class NetworkSelectComponent extends React.Component {
    componentDidMount() {
        if (!wallet.hasListener('networkSelect')) {
            var em = new EventEmitter();

            em.on('connect', async () => {
                enable("#_sNs");
                hide("#_btnC");
                show("#_btnD");

                ns.set(wallet.chainId);
                ns.toggleNetworkWarning();
            });

            em.on('disconnect', () => {
                disable("#_sNs");
                hide("#_btnD");
                show("#_btnC");

                ns.set(0);
                ns.toggleNetworkWarning();
            });

            em.on('accountsChanged', async (accounts) => {
                if (accounts === null || accounts.length === 0) {
                    disable("#_sNs");
                    hide("#_btnD");
                    show("#_btnC");

                    ns.set(0);
                    ns.toggleNetworkWarning();
                }
                else {
                    enable("#_sNs");
                    hide("#_btnC");
                    show("#_btnD");
                    ns.toggleNetworkWarning();
                }
            });

            em.on('chainChanged', async (chainId) => {
                ns.set(chainId);
                ns.toggleNetworkWarning();
            });

            wallet.addListener('networkSelect', em);
        }

        ns.empty();
        ns.set(0);

        if (!wallet.isConnected()) {
            hide("#_btnD");
            show("#_btnC");
            disable("#_sNs");
            ns.toggleNetworkWarning();
        }
        else {
            hide("#_btnC");
            show("#_btnD");
            enable("#_sNs");
            ns.toggleNetworkWarning();
        }
    }

    render() {
        return (
            <div className="d-flex">
                <select id="_sNs" className="form-select" onChange={ns._sNs_change} style={{ width: "auto" }} />
                <div>
                    <button className="btn btn-outline-success" id="_btnC" onClick={ns._btnC_clicked}>Connect</button>
                    <button className="btn btn-outline-danger" id="_btnD" onClick={ns._btnD_clicked}>Disconnect</button>
                    <div className="modal fade" id="_modSelect" tabIndex="-1" role="dialog" aria-hidden="true">
                        <div className="modal-dialog modal-dialog-centered" role="document">
                            <div className="modal-content">
                                <div className="modal-header">
                                    <h5 className="modal-title" id="exampleModalLongTitle">Select Wallet</h5>
                                </div>
                                <div className="modal-body">
                                    <div>
                                        <button className="btn btn-outline-primary p-3 mb-3 w-100" onClick={ns._wc_clicked}>
                                            Wallet Connect
                                        </button>
                                    </div>
                                    <div>
                                        <button className="btn btn-outline-warning p-3 w-100" onClick={ns._mm_clicked}>
                                            MetaMask
                                        </button>
                                    </div>
                                    <br />
                                    <div>
                                        <h4>Note to Wallet Connect users:</h4>
                                        <div>
                                            Fundamenta is a multi-chain system. Your ability to use this dapp may be impacted if your wallet does not
                                            support network switching.
                                        </div>
                                        <br />
                                        <div>
                                            For the best experience it is recommended to use the CiviPort mobile app, available for iOS and Android.
                                        </div>
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button type="button" className="btn btn-danger" onClick={ns._btnE_clicked}>Exit</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div >
        )
    }
}