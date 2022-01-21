import React from 'react';
import $ from 'jquery';
import Web3 from "web3";
import EventEmitter from 'events';
import BigDecimal from 'js-big-decimal'

import { Config as config } from '../js/config'
import { Conversions as convert } from '../js/conversions';
import { WalletProvider as wallet } from '../js/walletProvider'

import { MessagePanel as msg, MessagePanelComponent } from '../components/MessagePanel'

export default class Home extends React.Component {

    static prices = null;

    async displayUserBalances() {
        if (!wallet.isConnected()) return;
        if (!wallet.web3) return;
        if (!wallet.web3.eth) return;

        var networkNames = '';
        var balances = '';

        var netCount = config.networkMap.length;
        var counter = 0;

        $.each(config.networkMap, async function () {

            var fmtaToken = await config.getFmtaToken(this);

            console.log(this);

            ++counter;

            if (fmtaToken) {
                var web3 = new Web3(new Web3.providers.HttpProvider(this.rpc));
                console.log(wallet.web3);
                web3.eth.defaultAccount = wallet.web3.eth.defaultAccount;

                var fmtaContract = new web3.eth.Contract(config.app.tokenAbi, fmtaToken.address);
                var bal = await fmtaContract.methods.balanceOf(web3.eth.defaultAccount).call();
                var balance = convert.fromAu(bal, 18);

                networkNames += '<div>' + this.name + ':&nbsp;</div>';
                balances += '<div>' + balance.toFixed(2) + ' FMTA</div>';
            }

            if (counter === netCount) {
                var balanceCard =
                    '<form class="card mb-3 border border-primary shadow">' +
                    '<div class="card-header">Balances</div>' +
                    '<div className="card-body">' +
                    '<div class="ps-3 pt-3">' +
                    '<div class="d-flex pb-3">' +
                    '<div class="text-end text-body">' +
                    networkNames +
                    '</div>' +
                    '<div class="text-start text-body">' +
                    balances +
                    '</div>' +
                    '</div>' +
                    '</div>' +
                    '</div>' +
                    '</form>'

                $("#balances").html(balanceCard);
            }
        });
    }

    async displayUserStakes() {
        if (!wallet.isConnected()) return;
        if (!wallet.web3) return;
        if (!wallet.web3.eth) return;

        var networkNames = '';
        var balances = '';

        var netCount = config.networkMap.length;
        var counter = 0;

        $.each(config.networkMap, async function () {

            var fmtaToken = await config.getFmtaToken(this);

            ++counter;

            if (fmtaToken) {
                var web3 = new Web3(new Web3.providers.HttpProvider(this.rpc));
                web3.eth.defaultAccount = wallet.web3.eth.defaultAccount;

                var balance = 0;
                var reward = 0;
                if (fmtaToken.stakingAddress) {
                    var stakingContract = new web3.eth.Contract(config.app.stakeAbi, fmtaToken.stakingAddress);
                    var bal = await stakingContract.methods.stakeOf(web3.eth.defaultAccount).call();
                    var r = await stakingContract.methods.rewardsAccrued().call();

                    balance = convert.fromAu(bal, 18);
                    reward = convert.fromAu(r, 18);
                }

                networkNames += '<div>' + this.name + ':&nbsp;</div>';
                balances += '<div>' + balance.toFixed(2) + ' (' + reward.toFixed(2) + ') FMTA</div>'
            }

            if (counter === netCount) {
                var balanceCard =
                    '<form class="card mb-3 border border-primary shadow">' +
                    '<div class="card-header">Stakes</div>' +
                    '<div className="card-body">' +
                    '<div class="ps-3 pt-3">' +
                    '<div class="d-flex pb-3">' +
                    '<div class="text-end text-body">' +
                    networkNames +
                    '</div>' +
                    '<div class="text-start text-body">' +
                    balances +
                    '</div>' +
                    '</div>' +
                    '</div>' +
                    '</div>' +
                    '</form>'

                $("#stakes").html(balanceCard);
            }
        });
    }

    async displayTokenomics(chainId, container) {
        var net = await config.getFromMap(chainId);

        if (!net) return;

        var fmtaToken = await config.getFmtaToken(net);

        if (fmtaToken) {
            var web3 = new Web3(new Web3.providers.HttpProvider(net.rpc));

            var fmtaContract = new web3.eth.Contract(config.app.tokenAbi, fmtaToken.address);
            var stakingContract = new web3.eth.Contract(config.app.stakeAbi, fmtaToken.stakingAddress);
            var lpContract = undefined;

            var poolBalance0 = new BigDecimal(0);

            if (net.liquidityMining) {
                lpContract = new web3.eth.Contract(config.app.miningAbi, net.liquidityMining.address);

                if (net.liquidityMining.address) {
                    var poolInfo0 = await lpContract.methods.poolInfo(0).call();
                    poolBalance0 = convert.fromAuBigDecimal(poolInfo0.TotalRewardsPaidByPool, 18);
                }
            }

            var exclude = new BigDecimal(0);
            var poolBalance = poolBalance0;

            if (chainId === 1) {
                var bal0 = await fmtaContract.methods.balanceOf(config.app.holder0).call();
                var balance0 = convert.fromAuBigDecimal(bal0, 18);

                var bal1 = await fmtaContract.methods.balanceOf(config.app.holder1).call();
                var balance1 = convert.fromAuBigDecimal(bal1, 18);

                var bal2 = await fmtaContract.methods.balanceOf(config.app.holder2).call();
                var balance2 = convert.fromAuBigDecimal(bal2, 18);

                exclude = balance0.add(balance1).add(balance2);

                var poolInfo1 = await lpContract.methods.poolInfo(1).call();
                var poolBalance1 = convert.fromAuBigDecimal(poolInfo1.TotalRewardsPaidByPool, 18);

                //0xF6de2B6eAB93d3A0AEC5863e3190b319602A1e70
                var oldPoolBalance0 = new BigDecimal(234966.16);

                //0xB187c8E40b46Ae8fc19A6cC24bb60320a73b9abD
                var oldPoolBalance1 = new BigDecimal(98566.84);

                poolBalance = poolBalance.add(poolBalance1).add(oldPoolBalance0).add(oldPoolBalance1);
            }

            var totalStaked = new BigDecimal(0);
            var stakeRewards = new BigDecimal(0);

            if (fmtaToken.stakingAddress) {
                totalStaked = convert.fromAuBigDecimal(await stakingContract.methods.totalStakes().call());
                stakeRewards = convert.fromAuBigDecimal(await stakingContract.methods.totalRewardsPaid().call());
            }

            var totalSupply = new BigDecimal(0);

            try {
                totalSupply = convert.fromAuBigDecimal(await fmtaContract.methods.totalSupply().call());
            } catch (e) { console.log(e); }

            var circulating = totalSupply.add(totalStaked).subtract(exclude);

            var mc = new BigDecimal(0);

            if (config.app.net === 'mainnet' || config.app.net === 'mainnet.next')
                mc = circulating.multiply(new BigDecimal(Home.prices.fundamenta.usd.toString()));

            $(container).html(
                '<form class="card mb-3 border border-primary shadow">' +
                '<div class="card-header">' + net.name + '</div>' +
                '<div className="card-body">' +
                '<div class="ps-3 pt-3">' +
                '<div class="d-flex pb-3">' +
                '<div class="text-end text-body">' +
                '<div>Circulating:&nbsp;</div>' +
                '<div>Staked:&nbsp;</div>' +
                '<div>Market Cap:&nbsp;</div>' +
                '<div>Stake Rewards:&nbsp;</div>' +
                '<div>LP Rewards:&nbsp;</div>' +
                '</div>' +
                '<div class="text-start text-body">' +
                '<div>' + Number(circulating.value).toFixed(2) + ' FMTA</div>' +
                '<div>' + Number(totalStaked.value).toFixed(2) + ' FMTA</div>' +
                '<div>' + Number(mc.value).toFixed(2) + ' USD</div>' +
                '<div>' + Number(stakeRewards.value).toFixed(2) + ' FMTA</div>' +
                '<div>' + Number(poolBalance.value).toFixed(2) + ' FMTA</div>' +
                '</div>' +
                '</div>' +
                '</div>' +
                '</div>' +
                '</form>'
            );
        }
    }

    async displayNetworkStats() {
        var priceUrl = 'https://api.coingecko.com/api/v3/simple/price?ids=fundamenta&vs_currencies=usd&include_market_cap=false&include_24hr_vol=false&include_24hr_change=false&include_last_updated_at=false'

        Home.prices = await $.ajax({
            url: priceUrl,
            method: "GET",
            dataType: 'json',
            cache: 'false'
        });

        await config.fetchNetworkConfig();

        if (config.app.net === 'mainnet' || config.app.net === 'mainnet.next') {
            this.displayTokenomics(1, '#ethStats');
            this.displayTokenomics(56, '#bscStats');
            this.displayTokenomics(137, '#polyStats');
            this.displayTokenomics(43114, '#avaxStats');
            //this.displayTokenomics(100, '#xdaiStats');
            this.displayTokenomics(250, '#ftmStats');
            this.displayTokenomics(25, '#croStats');
        } else {
            this.displayTokenomics(4, '#ethStats');
            this.displayTokenomics(80001, '#polyStats');
        }
    }

    btnCalc_Clicked = async () => {
        msg.clear();
        var amount = parseFloat($("#amount").val());
        var time = parseFloat($("#time").val());

        if (isNaN(amount) || isNaN(time) || amount === 0 || time === 0) {
            msg.showError("Invalid amounts entered");
        }

        var total = ((amount / 500) * time).toFixed(2);
        msg.showOk(+ time + " day stake reward: " + total + " FMTA, " + (total * Home.prices.fundamenta.usd).toFixed(2) + " USD")
    };

    async componentDidMount() {
        msg.clear();

        if (!wallet.hasListener('home')) {
            var em = new EventEmitter();

            em.on('connect', async () => {
                if (wallet.web3 !== null && wallet.web3.eth.defaultAccount !== null) {
                    await this.displayUserBalances();
                    await this.displayUserStakes();
                }

                await this.displayNetworkStats();
            });

            em.on('disconnect', async () => {
                $("#balances").empty();
                $("#stakes").empty();
            });

            em.on('accountsChanged', async (accounts) => {
                if (wallet.web3 !== null && wallet.web3.eth.defaultAccount !== null) {
                    await this.displayUserBalances();
                    await this.displayUserStakes();
                }

                await this.displayNetworkStats();
            });

            em.on('chainChanged', async () => {
                if (wallet.web3.eth.defaultAccount !== null) {
                    await this.displayUserBalances();
                    await this.displayUserStakes();
                }

                await this.displayNetworkStats();
            });

            wallet.addListener('home', em);
        }

        await this.displayUserBalances();
        await this.displayUserStakes();
        await this.displayNetworkStats();
    }

    render() {
        return (
            <div className="ps-3 pe-3">
                <div className="page-flex-container d-flex flex-row justify-content-center align-items-center">
                    <div className="page-content">
                        <div id="balances" />
                        <div id="stakes" />
                        <div id="ethStats" />
                        <div id="bscStats" />
                        <div id="polyStats" />
                        <div id="avaxStats" />
                        {/*<div id="xdaiStats" />*/}
                        <div id="ftmStats" />
                        <div id="croStats" />
                        <div>
                            <form autoComplete="off" className="card border border-primary shadow">
                                <div className="card-header">Stake Calculator</div>
                                <div className="card-body">
                                    <div id="form">
                                        <div className="input-group mb-3">
                                            <input type="number" id="amount" className="round-left btn-primary form-control" placeholder="Enter amount" />
                                            <input type="number" id="time" className="round-right btn-primary form-control" placeholder="Enter time" />
                                        </div>
                                        <div>
                                            <button type="button" id="button" className="btn btn-primary round w-100" onClick={this.btnCalc_Clicked}>Calculate!</button>
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