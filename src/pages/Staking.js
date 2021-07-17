import React from 'react';
import $ from 'jquery'
import EventEmitter from 'events';
import { Navbar, Nav } from 'react-bootstrap';

import { Config as config } from '../js/config'
import { Conversions as convert } from '../js/conversions';
import { show, hide, disable } from '../js/ui';
import { WalletProvider as wallet } from '../js/walletProvider'

import { MessagePanel as msg, MessagePanelComponent } from '../components/MessagePanel'
import { NetworkSelect as ns } from '../components/NetworkSelect'

export default class Staking extends React.Component {
    constructor(props) {
        super(props);
        this.currentTab = null;
    }

    async getTokenBalance(network) {
        if (!network)
            return 0;

        if (wallet.chainId === network.chainId && wallet.web3.eth.defaultAccount) {
            var contract = new wallet.web3.eth.Contract(config.app.tokenAbi, network.fmtaToken.tokenAddress);
            var bal = await contract.methods.balanceOf(wallet.web3.eth.defaultAccount).call();
            if (!bal)
                bal = 0;

            return convert.fromAtomicUnits(bal, 18);
        }

        return 0;
    }

    async validateUiState() {
        var net = ns.get();
        msg.clearAll();

        if (!net.value)
            return;

        if (net.chainId !== wallet.chainId) {
            if (wallet.isMetamask) {
                msg.showWarn(`Switch metamask to the ${net.network} network`);
                return;
            }
            else if (wallet.isWalletConnect) {
                msg.showWarn(`Sending request to change to the ${net.network} network for teleport`);
                wallet.switchNetwork(net.chainId);
                return;
            }
        }

        $("#lblBalance").text(await this.getTokenBalance(net));
    }

    hideAllTabs() {
        hide("#divTake");
        hide("#divCompound");
        hide("#divAdd");
        hide("#divRemove");
        this.currentTab = null;
    }

    showTab(element) {
        if (element === this.currentTab)
            return;

        hide("#divTake");
        hide("#divCompound");
        hide("#divAdd");
        hide("#divRemove");

        show(element);
        this.currentTab = element;
    }

    async componentDidMount() {
        msg.clearAll();
        ns.populateAll();

        if (!wallet.hasListener('staking')) {
            console.log("Registering wrap component wallet listeners");
            var em = new EventEmitter();

            em.on('connect', async () => {
                await this.validateUiState();
            });

            em.on('disconnect', () => {
                disable("#form");
                msg.clearAll();
            });

            em.on('accountsChanged', async (accounts) => {
                if (accounts.length === 0) {
                    disable("#form");
                    return;
                }

                await this.validateUiState();
            });

            em.on('chainChanged', async () => {
                await this.validateUiState();
            });

            wallet.addListener('staking', em);
        }

        if (wallet.isConnected()) {
            this.showTab("#divTake");
            await this.validateUiState();
        }
        else {
            this.hideAllTabs();
            disable("#form");
        }
    }

    componentWillUnmount() {
        wallet.removeListener('staking');
    }

    btnTake_Clicked = async () => {
        this.showTab("#divRemove");
        await this.validateUiState();
    };

    render() {
        return (
            <div className="ps-3 pe-3">
                <div className="row">
                    <div className="col-sm">
                        <div>
                            <form className="card">
                                <div className="card-header">Staking</div>
                                <div className="card-body">
                                    <div id="form">
                                        <div className="row ps-0">
                                            <div className="col">
                                                <Navbar collapseOnSelect expand="sm" className="navbar navbar-expand-sm">
                                                    <Navbar.Toggle />
                                                    <Navbar.Collapse>
                                                        <Nav>
                                                            <button className="btn btn-link nav-link text-start ps-0"
                                                                style={{ outline: "none", border: "none", boxShadow: "none" }} id="btnTake" onClick={async () => {
                                                                    this.showTab("#divTake");
                                                                    await this.validateUiState();
                                                                }}>Take</button>
                                                            <button className="btn btn-link nav-link text-start"
                                                                style={{ outline: "none", border: "none", boxShadow: "none" }} id="btnCompound" onClick={async () => {
                                                                    this.showTab("#divCompound");
                                                                    await this.validateUiState();
                                                                }}>Compound</button>
                                                            <button className="btn btn-link nav-link text-start" id="btnAdd"
                                                                style={{ outline: "none", border: "none", boxShadow: "none" }} onClick={async () => {
                                                                    this.showTab("#divAdd");
                                                                    await this.validateUiState();
                                                                }}>Add</button>
                                                            <button className="btn btn-link nav-link text-start" id="btnRemove"
                                                                style={{ outline: "none", border: "none", boxShadow: "none" }} onClick={async () => {
                                                                    this.showTab("#divRemove");
                                                                    await this.validateUiState();
                                                                }}>Remove</button>
                                                        </Nav>
                                                    </Navbar.Collapse>
                                                </Navbar>
                                            </div>
                                            <div className="col">
                                                <select id="network" className="form-select" style={{ width: "auto", float: "right" }} />
                                            </div>
                                        </div>

                                        <script>

                                        </script>

                                        <div className="d-flex pb-3">
                                            <div className="text-end">
                                                <div>FMTA Balance:&nbsp;</div>
                                                <div>Staked FMTA:&nbsp;</div>
                                                <div>Rewards:&nbsp;</div>
                                           </div>
                                           <div className="text-start">
                                                <div id="lblBalance">0</div>
                                                <div id="lblStaked">0</div>
                                                <div id="lblRewards">0</div>
                                           </div>
                                        </div>

                                        <div id="divTake">
                                            <button className="btn btn-primary" onClick={this.btnTake_Clicked}>Take</button>
                                        </div>
                                        <div id="divCompound">
                                            Compound
                                        </div>
                                        <div id="divAdd">
                                            Add
                                        </div>
                                        <div id="divRemove">
                                            Remove
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