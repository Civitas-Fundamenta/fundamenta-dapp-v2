import React from 'react';
import $ from 'jquery'
import EventEmitter from 'events';
import { Navbar, Nav } from 'react-bootstrap';

import { Config as config } from '../js/config'
import { Conversions as convert } from '../js/conversions';
import { show, hide, disable, enable } from '../js/ui';
import { WalletProvider as wallet, WalletProvider } from '../js/walletProvider'

import { MessagePanel as msg, MessagePanelComponent } from '../components/MessagePanel'
import { NetworkSelect as ns } from '../components/NetworkSelect'

export default class Staking extends React.Component {
    constructor(props) {
        super(props);
        this.currentTab = null;
    }

    async getStake(network) {
        try {
            var stake = 0;
            var stakingContract = new wallet.web3.eth.Contract(config.app.stakeAbi, network.fmtaToken.stakingAddress);
            if (wallet.web3.eth.defaultAccount) {
                var s = await stakingContract.methods.stakeOf(wallet.web3.eth.defaultAccount).call();
                if (!s) s = 0;
                stake = convert.fromAtomicUnits(s, 18);
            }

            return stake;
        }
        catch (ex) {
            console.error(ex);
            return 0;
        }
    }

    async getBalance(network) {
        try {
            var balance = 0;
            var tokenContract = new wallet.web3.eth.Contract(config.app.tokenAbi, network.fmtaToken.tokenAddress);
            if (wallet.web3.eth.defaultAccount) {
                var b = await tokenContract.methods.balanceOf(wallet.web3.eth.defaultAccount).call();
                if (!b) b = 0;
                balance = convert.fromAtomicUnits(b, 18);
            }

            return balance;
        }
        catch (ex) {
            console.error(ex);
            return 0;
        }
    }

    async getBalances(network) {
        try {
            var stake = 0;
            var balance = 0;
            var reward = 0;

            var tokenContract = new wallet.web3.eth.Contract(config.app.tokenAbi, network.fmtaToken.tokenAddress);
            var stakingContract = new wallet.web3.eth.Contract(config.app.stakeAbi, network.fmtaToken.stakingAddress);

            if (wallet.web3.eth.defaultAccount) {
                var b = await tokenContract.methods.balanceOf(wallet.web3.eth.defaultAccount).call();
                if (!b) b = 0;
                balance = convert.fromAtomicUnits(b, 18);

                var s = await stakingContract.methods.stakeOf(wallet.web3.eth.defaultAccount).call();
                if (!s) s = 0;
                stake = convert.fromAtomicUnits(s, 18);

                var r = await stakingContract.methods.rewardsAccrued().call();
                if (!r) r = 0;
                reward = convert.fromAtomicUnits(r, 18);
            }

            return {
                balance: balance,
                stake: stake,
                reward: reward
            };
        }
        catch (ex) {
            console.error(ex);
            return {
                balance: 0,
                stake: 0,
                reward: 0
            };
        }
    }

    disableNavBar() {
        disable("#btnTake");
        disable("#btnCompound");
        disable("#btnAdd");
        disable("#btnRemove");
    }

    async validateUiState() {
        var net = ns.getFromMap(WalletProvider.chainId);
        msg.clear();

        if (!net) {
            this.disableNavBar();
            this.hideAllTabs();
            $("#lblBalance").text("0.00");
            $("#lblStake").text("0.00");
            $("#lblReward").text("0.00");
            return;
        }

        var balances = await this.getBalances(net);

        var fmtr = new Intl.NumberFormat('us-us', {
            style: 'decimal',
            useGrouping: false,
            minimumFractionDigits: 2,
            maximumFractionDigits: 10
        });

        $("#lblBalance").text(fmtr.format(balances.balance));
        $("#lblStake").text(fmtr.format(balances.stake));
        $("#lblReward").text(fmtr.format(balances.reward));

        this.enableTab("Take", balances.reward > 0);
        this.enableTab("Compound", balances.reward > 0);
        this.enableTab("Add", balances.balance > 0 && balances.reward === 0);
        this.enableTab("Remove", balances.stake > 0);
    }

    enableTab(name, condition) {
        if (condition) {
            enable(`#btn${name}`);
            enable(`#div${name}`);
        }
        else {
            disable(`#btn${name}`);
            disable(`#div${name}`);
        }
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
        msg.clear();
        ns.populateAll();

        this.hideAllTabs();

        if (!wallet.hasListener('staking')) {
            var em = new EventEmitter();

            em.on('connect', async () => {
                await this.validateUiState();
            });

            em.on('disconnect', async () => {
                await this.validateUiState();
            });

            em.on('accountsChanged', async () => {
                await this.validateUiState();
            });

            em.on('chainChanged', async () => {
                await this.validateUiState();
            });

            wallet.addListener('staking', em);
        }

        await this.validateUiState();
    }

    componentWillUnmount() {
        wallet.removeListener('staking');
    }

    btnTake_Clicked = async () => {
        var net = ns.getFromMap(WalletProvider.chainId);

        if (!net)
            return;

        var stakingContract = new wallet.web3.eth.Contract(config.app.stakeAbi, net.fmtaToken.stakingAddress);

        msg.clear();
        msg.showWarn("Processing. Please wait...");
        this.disableNavBar();
        this.enableTab("Take", false);

        var ok = false;

        try {
            var tx = await stakingContract.methods.withdrawReward().send({ from: wallet.web3.eth.defaultAccount });
            console.log("Transaction: ", tx);
            ok = tx.status;
        } catch (ex) {
            console.error(ex);
            ok = false;
        }

        await this.validateUiState();
        msg.clear();

        if (ok)
            msg.showOk("Taking stake rewards success!");
        else
            msg.showError("Taking stake rewards failed!");
    };

    btnCompound_Clicked = async () => {
        var net = ns.getFromMap(WalletProvider.chainId);

        if (!net)
            return;

        var stakingContract = new wallet.web3.eth.Contract(config.app.stakeAbi, net.fmtaToken.stakingAddress);

        msg.clear();
        msg.showWarn("Processing. Please wait...");
        this.disableNavBar();
        this.enableTab("Compound", false);

        var ok = false;

        try {
            var tx = await stakingContract.methods.compoundRewards().send({ from: wallet.web3.eth.defaultAccount });
            console.log("Transaction: ", tx);
            ok = tx.status;
        } catch (ex) {
            console.error(ex);
            ok = false;
        }

        await this.validateUiState();
        msg.clear();

        if (ok)
            msg.showOk("Compounding stake rewards success!");
        else
            msg.showError("Compounding stake rewards failed!");
    };

    btnAdd_Clicked = async () => {
        var net = ns.getFromMap(WalletProvider.chainId);

        if (!net)
            return;

        var amount = parseFloat($("#inAddAmount").val());
        if (isNaN(amount) || amount <= 0) {
            msg.showWarn("Invalid amount entered");
            return;
        }

        var balance = await this.getBalance(net);

        if (isNaN(balance) || balance < amount) {
            msg.showWarn("Amount exceeds balance");
            return;
        }

        var stakingContract = new wallet.web3.eth.Contract(config.app.stakeAbi, net.fmtaToken.stakingAddress);
        var au = convert.toAtomicUnitsHexPrefixed(amount, net.fmtaToken.decimals);

        msg.clear();
        msg.showWarn("Processing. Please wait...");
        this.disableNavBar();
        this.enableTab("Add", false);

        var ok = false;

        try {
            var tx = await stakingContract.methods.createStake(au).send({ from: wallet.web3.eth.defaultAccount });
            console.log("Transaction: ", tx);
            ok = tx.status;
        } catch (ex) {
            console.error(ex);
            ok = false;
        }

        await this.validateUiState();
        msg.clear();

        if (ok)
            msg.showOk("Creating stake success!");
        else
            msg.showError("Creating stake failed!");

        $("#inAddAmount").val('');
    };

    btnRemove_Clicked = async () => {
        var net = ns.getFromMap(WalletProvider.chainId);

        if (!net)
            return;

        var amount = parseFloat($("#inRemoveAmount").val());
        if (isNaN(amount) || amount <= 0) {
            msg.showWarn("Invalid amount entered");
            return;
        }

        var balance = await this.getStake(net);

        if (isNaN(balance) || balance < amount) {
            msg.showWarn("Amount exceeds balance");
            return;
        }

        var stakingContract = new wallet.web3.eth.Contract(config.app.stakeAbi, net.fmtaToken.stakingAddress);
        var au = convert.toAtomicUnitsHexPrefixed(amount, net.fmtaToken.decimals);

        msg.clear();
        msg.showWarn("Processing. Please wait...");
        this.disableNavBar();
        this.enableTab("Remove", false);

        var ok = false;

        try {
            var tx = await stakingContract.methods.removeStake(au).send({ from: wallet.web3.eth.defaultAccount });
            console.log("Transaction: ", tx);
            ok = tx.status;
        } catch (ex) {
            console.error(ex);
            ok = false;
        }

        await this.validateUiState();
        msg.clear();

        this.enableTab("Remove", true);

        if (ok)
            msg.showOk("Removing stake success!");
        else
            msg.showError("Removing stake failed!");

        $("#inRemoveAmount").val('');
    };

    render() {
        return (
            <div className="ps-3 pe-3">
                <div className="page-flex-container d-flex flex-row justify-content-center align-items-center">
                    <div className="page-content">
                        <form autocomplete="off" className="card border border-primary shadow">
                            <div className="card-header">Staking</div>
                            <div className="card-body">
                                <div id="form">
                                    <div className="d-flex p-0">
                                        <div className="w-100 justify-content-start">
                                            <Navbar style={{ outline: "none", border: "none", boxShadow: "none" }} collapseOnSelect expand="sm" className="navbar navbar-dark navbar-expand-sm p-0 m-0">
                                                <Navbar.Toggle />
                                                <Navbar.Collapse>
                                                    <Nav>
                                                        <button type="button" className="btn btn-link nav-link text-start ps-0"
                                                            style={{ outline: "none", border: "none", boxShadow: "none" }} id="btnTake" onClick={async () => {
                                                                msg.clear();
                                                                this.showTab("#divTake");
                                                            }}>Take</button>
                                                        <button type="button" className="btn btn-link nav-link text-start"
                                                            style={{ outline: "none", border: "none", boxShadow: "none" }} id="btnCompound" onClick={async () => {
                                                                msg.clear();
                                                                this.showTab("#divCompound");
                                                            }}>Compound</button>
                                                        <button type="button" className="btn btn-link nav-link text-start" id="btnAdd"
                                                            style={{ outline: "none", border: "none", boxShadow: "none" }} onClick={async () => {
                                                                msg.clear();
                                                                this.showTab("#divAdd");
                                                            }}>Add</button>
                                                        <button type="button" className="btn btn-link nav-link text-start" id="btnRemove"
                                                            style={{ outline: "none", border: "none", boxShadow: "none" }} onClick={async () => {
                                                                msg.clear();
                                                                this.showTab("#divRemove");
                                                                disable("#btnRemove");
                                                            }}>Remove</button>
                                                    </Nav>
                                                </Navbar.Collapse>
                                            </Navbar>
                                        </div>
                                    </div>
                                    <div className="d-flex pb-3">
                                        <div className="text-end">
                                            <div>FMTA Balance:&nbsp;</div>
                                            <div>Staked FMTA:&nbsp;</div>
                                            <div>Rewards:&nbsp;</div>
                                        </div>
                                        <div className="text-start">
                                            <div id="lblBalance">0</div>
                                            <div id="lblStake">0</div>
                                            <div id="lblReward">0</div>
                                        </div>
                                    </div>

                                    <div id="divTake">
                                        <button className="round btn btn-primary w-100" onClick={this.btnTake_Clicked}>Take</button>
                                    </div>
                                    <div id="divCompound">
                                        <button className="round btn btn-primary w-100" onClick={this.btnCompound_Clicked}>Compound</button>
                                    </div>
                                    <div id="divAdd">
                                        <div className="input-group mb-3">
                                            <input type="number" id="inAddAmount" className="round-left btn-primary form-control" placeholder="Enter amount" />
                                            <button className="round-right btn btn-primary" onClick={this.btnAdd_Clicked}>Add</button>
                                        </div>
                                    </div>
                                    <div id="divRemove">
                                        <div className="input-group mb-3">
                                            <input type="number" id="inRemoveAmount" className="round-left btn-primary form-control" placeholder="Enter amount" />
                                            <button className="round-right btn btn-primary" onClick={this.btnRemove_Clicked}>Remove</button>
                                        </div>
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