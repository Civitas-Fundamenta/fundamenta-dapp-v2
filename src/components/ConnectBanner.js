import React from 'react';
import { show, hide } from '../js/ui';
import { WalletProvider as wallet } from '../js/walletProvider'
import EventEmitter from 'events';

import $ from 'jquery'

export class ConnectBanner extends React.Component {
    componentDidMount() {
        if (!wallet.hasListener('banner')) {
            console.log("Registering banner component wallet listeners");
            var em = new EventEmitter();

            em.on('connect', (connectInfo) => {
                $("#accountAddress").text(wallet.web3.eth.defaultAccount);
                hide("#fNoAccount");
                show("#fAccount");
            });

            em.on('accountsChanged', (accounts) => {
                if (accounts.length === 0)
                {
                    hide("#fAccount");
                    show("#fNoAccount");
                }
                else
                {
                    $("#accountAddress").text(wallet.web3.eth.defaultAccount);
                    hide("#fNoAccount");
                    show("#fAccount");
                }
            });

            em.on('disconnect', (disconnectInfo) => {
                hide("#fAccount");
                show("#fNoAccount");
            });

            wallet.addListener('banner', em);
        }

        if (wallet.isConnected()) {
            $("#accountAddress").text(wallet.web3.eth.defaultAccount);
            hide("#fNoAccount");
            show("#fAccount");
        }
        else {
            hide("#fAccount");
            show("#fNoAccount");
        }
    }

    render() {
        return (
            <div className="p-3">
                <form id="fNoAccount">
                    <div className="popup-div-margins alert alert-danger d-flex align-items-center input-group" role="alert">
                        <div className="d-inline-block">
                            No account connected.
                        </div>
                    </div>
                </form>
                <form id="fAccount">
                    <div className="popup-div-margins alert alert-success d-flex align-items-center input-group" role="alert">
                        <div id="accountAddress" className="d-inline-block" />
                    </div>
                </form>
            </div>
        )
    }
}