import React from 'react';
import $ from 'jquery';
import EventEmitter from 'events';

import { CancellationToken } from '../js/cancellationToken';
import { Config as config } from '../js/config'
import { Energizer } from '../js/energizer';
import { enable, disable } from '../js/ui';
import { WalletProvider as wallet } from '../js/walletProvider'

import { MessagePanel as msg, MessagePanelComponent } from '../components/MessagePanel'

export default class Energize extends React.Component {

    constructor(props) {
        super(props);
        this.recoveredTeleport = null;
        this.cancellationToken = new CancellationToken();
    }

    async validateUiState() {
        enable("#form");
        disable("#button");
        msg.clear();

        if (this.recoveredTeleport) {
            if (wallet.chainId === this.recoveredTeleport.destination.chainId) {
                msg.showOk("Teleport found");
                disable("#selectors");
                enable("#button");
            }
            else {
                if (wallet.isMetamask)
                    msg.showWarn(`Switch MetaMask to the ${this.recoveredTeleport.destination.name} network to energize`);
                else if (wallet.isWalletConnect) {
                    msg.showWarn(`Sending request to change to the ${this.recoveredTeleport.destination.name} network to energize`);
                    wallet.switchNetwork(this.recoveredTeleport.destination.chainId);
                }
            }
        }
        else {
            var tx = $("#hash").val();

            if (!tx)
                return;

            if (tx.length < 66) {
                msg.showError("Invalid transaction hash");
                return;
            }

            this.recoveredTeleport = await Energizer.recover(tx);
            console.log(this.recoveredTeleport);

            if (!this.recoveredTeleport) {
                msg.showError("Teleport not found");
                return;
            }

            msg.showOk("Teleport found");
            disable("#selectors");
            enable("#button");

            if (wallet.isMetamask)
                msg.showWarn(`Switch MetaMask to the ${this.recoveredTeleport.destination.name} network to energize`);
            else if (wallet.isWalletConnect) {
                msg.showWarn(`Sending request to change to the ${this.recoveredTeleport.destination.name} network to energize`);
                wallet.switchNetwork(this.recoveredTeleport.destination.chainId);
            }
        }
    }

    componentDidMount() {
        msg.clear();

        if (!wallet.hasListener('energize')) {
            var em = new EventEmitter();

            em.on('connect', async () => {
                await this.validateUiState();
            });

            em.on('disconnect', () => {
                disable("#form");
                msg.clear();
                this.cancellationToken.cancel();
            });

            em.on('accountsChanged', async (accounts) => {
                if (accounts === null || accounts.length === 0) {
                    disable("#form");
                    return;
                }

                await this.validateUiState();
            });

            em.on('chainChanged', async () => {
                await this.validateUiState();
            });

            wallet.addListener('energize', em);
        }

        if (wallet.isConnected())
            enable("#form");
        else
            disable("#form");

        $("#hash").on('change', async () => {
            await this.validateUiState();
        });

        $("#button").on('click', async () => {
            msg.clear();
            console.log("Transaction Data:", this.recoveredTeleport.transactionData);

            this.cancellationToken = new CancellationToken();
            var energizer = new Energizer(this.recoveredTeleport, this.cancellationToken);
            energizer.on('error', (code, error) => {
                if (code !== 100) {
                    msg.clear();
                    enable("#form");
                }

                msg.showError(`Error ${code}: ${error}`);
            });

            energizer.on('ok', async (serverSignatures) => {
                msg.clear();
                console.log(energizer.teleport);
                msg.showWarn("Energize confirmed. Processing transaction...");
                try {
                    var destBridgeContract = new wallet.web3.eth.Contract(config.app.bridgeAbi, energizer.teleport.destination.bridge);
                    var tx = await destBridgeContract.methods.deposit(serverSignatures, energizer.teleport.transactionData).send({ from: wallet.web3.eth.defaultAccount });
                    console.log("Transaction:", tx);
                    enable("#form");
                    msg.clear();
                    msg.showOk("Energize Success!");
                }
                catch
                {
                    msg.clear();
                    msg.showError("Transaction failed!");
                    enable("#form");
                    return;
                }
            });

            msg.showWarn("Verifying teleport...");

            await energizer.start();
        });
    }

    componentWillUnmount() {
        wallet.removeListener('energize');
        this.cancellationToken.cancel();
    }

    render() {
        return (
            <div className="ps-3 pe-3">
                <div className="page-flex-container d-flex flex-row justify-content-center align-items-center">
                    <div className="page-content">
                        <form autoComplete="off" className="card border border-primary shadow">
                            <div className="card-header">Energize</div>
                            <div className="card-body">
                                <div id="form">
                                    <div id="selectors">
                                        <div className="mb-3">
                                            <input id="hash" className="round btn-primary form-control input" placeholder="Enter TX hash" />
                                        </div>
                                    </div>
                                    <div>
                                        <button type="button" id="button" className="btn btn-primary round w-100">Energize!</button>
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