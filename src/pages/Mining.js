import React from 'react';
import $ from 'jquery'
import EventEmitter from 'events';
import { Navbar, Nav } from 'react-bootstrap';

import { Config as config } from '../js/config'
import { Conversions as convert } from '../js/conversions';
import { LpApprove as approve } from '../js/lpApprove';
import { show, hide, disable, enable } from '../js/ui';
import { WalletProvider as wallet } from '../js/walletProvider'

import { MessagePanel as msg, MessagePanelComponent } from '../components/MessagePanel'

export default class Mining extends React.Component {
    constructor(props) {
        super(props);
        this.currentTab = null;
        this.currentInfo = null;
    }

    async getInfo(network, poolIndex) {
        disable("#selPool");

        try {
            if (wallet.web3.eth.defaultAccount !== null) {
                var lpContract = new wallet.web3.eth.Contract(config.app.miningAbi, network.liquidityMining.address);
                var poolInfo = await lpContract.methods.poolInfo(poolIndex).call();
                var tokenContract = new wallet.web3.eth.Contract(config.app.tokenAbi, poolInfo.ContractAddress);
                var u = await tokenContract.methods.balanceOf(wallet.web3.eth.defaultAccount).call();
                if (!u) u = 0;
                var unlocked = convert.fromAtomicUnits(u, 18);
                var pos = await lpContract.methods.accountPosition(wallet.web3.eth.defaultAccount, poolIndex).call();
                var l = 0
                if (!pos)
                    l = 0;
                else
                    l = pos._lockedAmount;

                var locked = convert.fromAtomicUnits(l, 18);
                var block = await wallet.web3.eth.getBlockNumber();
                var lockPeriods = await lpContract.methods.showCurrentLockPeriods().call();
                var remaining = pos._unlockHeight - block;
                if (remaining < 0)
                    remaining = 0;

                var status = null;

                if (remaining === 0)
                    status = "Unlocked";
                else
                    status = `Unlocks in ${remaining} blocks`;

                this.currentInfo = {
                    unlocked: unlocked,
                    locked: locked,
                    remaining: remaining,
                    status: status,
                    poolIndex: poolIndex,
                    poolInfo: poolInfo,
                    lockPeriods: lockPeriods
                }
            }
        }
        catch (ex) {
            console.error(ex);
            this.currentInfo = null;
        }

        enable("#selPool");
    }

    populatePoolDropDown() {
        $("#selPool").empty();
        $("#selPool").append(`<option>Select Pool</option>`);

        var pools = config.app.lpPools[wallet.chainId];

        if (!pools)
            return;

        $.each(pools, function (k, v) {
            $("#selPool").append(`<option value="${k}">${v}</option>`);
        })
    }

    disableNavBar() {
        disable("#btnTake");
        disable("#btnAdd");
        disable("#btnRemove");
        disable("#selPool");
    }

    async validateUiState() {
        var net = await config.getFromMap(wallet.chainId);
        msg.clear();

        if (!net) {
            this.disableNavBar();
            this.hideAllTabs();
            $("#lblUnlocked").text("0.00");
            $("#lblLocked").text("0.00");
            $("#lblStatus").text("N/A");
            $("#inTakeAmount").attr("placeholder", "Enter amount");
            $("#inAddAmount").attr("placeholder", "Enter amount");
            return;
        }

        enable("#selPool");

        var val = $("#selPool option:selected").val();
        var poolIndex = parseInt(val);

        if (isNaN(poolIndex)) {
            disable("#btnTake");
            disable("#btnAdd");
            disable("#btnRemove");
            this.hideAllTabs();
            $("#lblUnlocked").text("0.00");
            $("#lblLocked").text("0.00");
            $("#lblStatus").text("N/A");
            $("#inTakeAmount").attr("placeholder", "Add to position");
            $("#inAddAmount").attr("placeholder", "Enter amount");
            return;
        }

        await this.getInfo(net, poolIndex);

        var i = this.currentInfo;

        $("#selLockPeriod").empty();
        $("#selLockPeriod").append(`<option value="${i.lockPeriods[0]}">${i.lockPeriods[0]} days</option>`);
        $("#selLockPeriod").append(`<option value="${i.lockPeriods[1]}">${i.lockPeriods[1]} days</option>`);
        $("#selLockPeriod").append(`<option value="${i.lockPeriods[2]}">${i.lockPeriods[2]} days</option>`);
        //$("#selLockPeriod").append(`<option value="${parseInt(i.lockPeriods[0])}">${i.lockPeriods[0]} days: ${i.poolInfo.lockPeriod0BasisPoint} BP, ${i.poolInfo.compYield0}% Comp. BP</option>`);
        //$("#selLockPeriod").append(`<option value="${parseInt(i.lockPeriods[1])}">${i.lockPeriods[1]} days: ${i.poolInfo.lockPeriod1BasisPoint} BP, ${i.poolInfo.compYield1}% Comp. BP</option>`);
        //$("#selLockPeriod").append(`<option value="${parseInt(i.lockPeriods[2])}">${i.lockPeriods[2]} days: ${i.poolInfo.lockPeriod2BasisPoint} BP, ${i.poolInfo.compYield2}% Comp. BP</option>`);

        var fmtr = new Intl.NumberFormat('us-us', {
            style: 'decimal',
            useGrouping: false,
            minimumFractionDigits: 2,
            maximumFractionDigits: 10
        });

        $("#lblUnlocked").text(fmtr.format(i.unlocked));
        $("#lblLocked").text(fmtr.format(i.locked));
        $("#lblStatus").text(i.status);

        $("#inTakeAmount").attr("placeholder", `Add to position (max ${i.unlocked})`);
        $("#inAddAmount").attr("placeholder", `Enter amount (max ${i.unlocked})`);

        this.enableTab("Take", i.remaining === 0 && i.locked > 0);
        this.enableTab("Add", i.unlocked > 0 && i.locked === 0);
        this.enableTab("Remove", i.remaining === 0 && i.locked > 0);
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
        hide("#divAdd");
        hide("#divRemove");
        this.currentTab = null;
    }

    showTab(element) {
        if (element === this.currentTab)
            return;

        hide("#divTake");
        hide("#divAdd");
        hide("#divRemove");

        show(element);
        this.currentTab = element;
    }

    async componentDidMount() {
        msg.clear();

        this.hideAllTabs();

        if (!wallet.hasListener('mining')) {
            var em = new EventEmitter();

            em.on('connect', async () => {
                this.populatePoolDropDown();
                await this.validateUiState();
            });

            em.on('disconnect', async () => {
                this.populatePoolDropDown();
                await this.validateUiState();
            });

            em.on('accountsChanged', async () => {
                await this.validateUiState();
            });

            em.on('chainChanged', async () => {
                this.populatePoolDropDown();
                await this.validateUiState();
            });

            wallet.addListener('staking', em);
        }

        if (wallet.isConnected())
            this.populatePoolDropDown();

        await this.validateUiState();
    }

    componentWillUnmount() {
        wallet.removeListener('mining');
    }

    btnTake_Clicked = async () => {
        var net = await config.getFromMap(wallet.chainId);

        if (!net)
            return;

        var lpContract = new wallet.web3.eth.Contract(config.app.miningAbi, net.liquidityMining.address);

        var amount = parseFloat($("#inTakeAmount").val());
        if (isNaN(amount) || amount <= 0)
            amount = 0;

        if (amount > 0) {
            var allowance = await approve.allowance(net, this.currentInfo);
            if (allowance < amount)
                await approve.approve(net, this.currentInfo);
        }

        msg.clear();
        msg.showWarn("Processing. Please wait...");
        this.disableNavBar();
        this.enableTab("Take", false);

        var ok = false;

        try {
            var au = convert.toAtomicUnitsHexPrefixed(amount, 18);
            var tx = await lpContract.methods.withdrawAccruedYieldAndAdd(this.currentInfo.poolIndex, au).send({ from: wallet.web3.eth.defaultAccount });
            console.log("Transaction: ", tx);
            ok = tx.status;
        } catch (ex) {
            console.error(ex);
            ok = false;
        }

        await this.validateUiState();
        msg.clear();

        if (ok)
            msg.showOk("Taking mining yield success!");
        else
            msg.showError("Taking mining yield failed!");

        $("#inTakeAmount").val('');
    };

    btnAdd_Clicked = async () => {
        var net = await config.getFromMap(wallet.chainId);

        if (!net)
            return;

        var lpContract = new wallet.web3.eth.Contract(config.app.miningAbi, net.liquidityMining.address);

        var amount = parseFloat($("#inAddAmount").val());
        if (isNaN(amount) || amount <= 0) {
            msg.showWarn("Invalid amount entered");
            return;
        }

        if (isNaN(this.currentInfo.unlocked) || this.currentInfo.unlocked < amount) {
            msg.showWarn("Amount exceeds balance");
            return;
        }

        var allowance = await approve.allowance(net, this.currentInfo);

        if (allowance < amount)
            await approve.approve(net, this.currentInfo);

        msg.clear();
        msg.showWarn("Processing. Please wait...");
        this.disableNavBar();
        this.enableTab("Add", false);

        var val = $("#selLockPeriod option:selected").val();
        var lockPeriod = parseInt(val);

        var ok = false;

        try {
            var fmtaToken = await config.getFmtaToken(net);
            var au = convert.toAtomicUnitsHexPrefixed(amount, fmtaToken.decimals);
            var tx = await lpContract.methods.addPosition(au, lockPeriod, this.currentInfo.poolIndex).send({ from: wallet.web3.eth.defaultAccount });
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
        var net = await config.getFromMap(wallet.chainId);

        if (!net)
            return;

        var lpContract = new wallet.web3.eth.Contract(config.app.miningAbi, net.liquidityMining.address);

        msg.clear();
        msg.showWarn("Processing. Please wait...");
        this.disableNavBar();
        this.enableTab("Remove", false);

        var ok = false;

        try {
            var tx = await lpContract.methods.removePosition(this.currentInfo.poolIndex).send({ from: wallet.web3.eth.defaultAccount });
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
            msg.showOk("Removing position success!");
        else
            msg.showError("Removing position failed!");
    };

    selPool_Changed = async () => {
        this.validateUiState();
    };

    render() {
        return (
            <div className="ps-3 pe-3">
                <div className="page-flex-container d-flex flex-row justify-content-center align-items-center">
                    <div className="page-content">
                        <form autoComplete="off" className="card border border-primary shadow">
                            <div className="card-header">LP Mining</div>
                            <div className="card-body">
                                <div id="form">
                                    <Navbar collapseOnSelect expand="sm" className="navbar navbar-dark navbar-expand-sm p-0">
                                        <Navbar.Toggle className="w-100 round btn"/>
                                        <Navbar.Collapse>
                                            <Nav>
                                                <button type="button" className="btn btn-link nav-link text-start ps-0"
                                                    id="btnTake" onClick={async () => {
                                                        msg.clear();
                                                        this.showTab("#divTake");
                                                    }}>Take</button>
                                                <button type="button" className="btn btn-link nav-link text-start" id="btnAdd"
                                                    onClick={async () => {
                                                        msg.clear();
                                                        this.showTab("#divAdd");
                                                    }}>Add</button>
                                                <button type="button" className="btn btn-link nav-link text-start" id="btnRemove"
                                                    onClick={async () => {
                                                        msg.clear();
                                                        this.showTab("#divRemove");
                                                    }}>Remove</button>
                                                <select id="selPool" className="btn btn-link nav-link text-start" type="button" data-toggle="dropdown" onChange={this.selPool_Changed} />
                                            </Nav>
                                        </Navbar.Collapse>
                                    </Navbar>
                                    <div className="d-flex mt-3 mb-3">
                                        <div className="text-end">
                                            <div>Unlocked:&nbsp;</div>
                                            <div>Locked:&nbsp;</div>
                                            <div>Status:&nbsp;</div>
                                        </div>
                                        <div className="text-start">
                                            <div id="lblUnlocked">0</div>
                                            <div id="lblLocked">0</div>
                                            <div id="lblStatus">N/A</div>
                                        </div>
                                    </div>

                                    <div id="divTake">
                                        <div className="input-group mb-3">
                                            <input type="number" id="inTakeAmount" className="round-left btn-primary form-control" placeholder="Enter amount" />
                                            <button className="round-right btn btn-primary" onClick={this.btnTake_Clicked}>Take</button>
                                        </div>
                                    </div>
                                    <div id="divAdd">
                                        <div className="input-group mb-3">
                                            <input type="number" id="inAddAmount" className="round-left btn-primary form-control" placeholder="Enter amount" />
                                            <select id="selLockPeriod" className="btn btn-primary dropdown-toggle" type="button" data-toggle="dropdown" style={{ width: "auto" }} />
                                            <button className="round-right btn btn-primary" onClick={this.btnAdd_Clicked}>Add</button>
                                        </div>
                                    </div>
                                    <div id="divRemove">
                                        <div className="input-group mb-3">
                                            <button className="round btn btn-primary w-100" onClick={this.btnRemove_Clicked}>Remove</button>
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