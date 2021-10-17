import React from 'react';
import $ from 'jquery';
import Web3 from "web3";
import EventEmitter from 'events';

import { Config as config } from '../js/config'
import { Conversions as convert } from '../js/conversions';
import { WalletProvider as wallet } from '../js/walletProvider'
import { Navigation } from '../components/Navigation';

import { MessagePanel as msg, MessagePanelComponent } from '../components/MessagePanel'

export default class Home extends React.Component {

    static prices = null;

    async displayUserBalances()
    {
        if (!wallet.isConnected) return;

        var networkNames = '';
        var balances = '';

        var netCount = config.networkMap.length;
        var counter = 0;

        $.each(config.networkMap, async function () {

            if (this.fmtaToken) {
                var web3 = new Web3(new Web3.providers.HttpProvider(wallet.rpcUrls.get(this.chainId)));
                web3.eth.defaultAccount = wallet.web3.eth.defaultAccount;
                var fmtaContract = new web3.eth.Contract(config.app.tokenAbi, this.fmtaToken.tokenAddress);
                var bal = await fmtaContract.methods.balanceOf(web3.eth.defaultAccount).call();
                var balance = convert.fromAtomicUnits(bal, 18);

                networkNames += '<div>' + wallet.niceNames.get(this.chainId) +':&nbsp;</div>';
                balances += '<div>' + balance.toFixed(2) + ' FMTA</div>'
                ++counter;
            }

            if (counter === netCount)
            {
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

    async displayUserStakes()
    {
        if (!wallet.isConnected) return;

        var networkNames = '';
        var balances = '';

        var netCount = config.networkMap.length;
        var counter = 0;

        $.each(config.networkMap, async function () {

            if (this.fmtaToken) {
                var web3 = new Web3(new Web3.providers.HttpProvider(wallet.rpcUrls.get(this.chainId)));
                web3.eth.defaultAccount = wallet.web3.eth.defaultAccount;
                var stakingContract = new web3.eth.Contract(config.app.stakeAbi, this.fmtaToken.stakingAddress);
                var bal = await stakingContract.methods.stakeOf(web3.eth.defaultAccount).call();
                var r = await stakingContract.methods.rewardsAccrued().call();
                
                var balance = convert.fromAtomicUnits(bal, 18);
                var reward = convert.fromAtomicUnits(r, 18);

                networkNames += '<div>' + wallet.niceNames.get(this.chainId) +':&nbsp;</div>';
                balances += '<div>' + balance.toFixed(2) + ' (' + reward.toFixed(2) + ') FMTA</div>'
                ++counter;
            }

            if (counter === netCount)
            {
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

    async displayTokenomics(chainId, container)
    {
        var net = await config.getFromMap(chainId);

        if (!net) return;

        if (net.fmtaToken)
        {
            var web3 = new Web3(new Web3.providers.HttpProvider(wallet.rpcUrls.get(chainId)));

            var fmtaContract = new web3.eth.Contract(config.app.tokenAbi, net.fmtaToken.tokenAddress);
            var stakingContract = new web3.eth.Contract(config.app.stakeAbi, net.fmtaToken.stakingAddress);
            var lpContract = new web3.eth.Contract(config.app.miningAbi, net.liquidityMining.address);

            var poolBalance0 = 0;

            if (net.liquidityMining.address !== Navigation.emptyAddress)
            {
                var poolInfo0 = await lpContract.methods.poolInfo(0).call();
                poolBalance0 = convert.fromAtomicUnits(poolInfo0.TotalRewardsPaidByPool, 18);
            }

            var exclude = 0;
            var poolBalance = poolBalance0;

            if (chainId === 1) {
                var bal0 = await fmtaContract.methods.balanceOf(config.app.holder0).call();
                var balance0 = convert.fromAtomicUnits(bal0, 18);

                var bal1 = await fmtaContract.methods.balanceOf(config.app.holder1).call();
                var balance1 = convert.fromAtomicUnits(bal1, 18);

                var bal2 = await fmtaContract.methods.balanceOf(config.app.holder2).call();
                var balance2 = convert.fromAtomicUnits(bal2, 18);

                exclude = balance0 + balance1 + balance2;

                var poolInfo1 = await lpContract.methods.poolInfo(1).call();
                var poolBalance1 = convert.fromAtomicUnits(poolInfo1.TotalRewardsPaidByPool, 18);

                //0xF6de2B6eAB93d3A0AEC5863e3190b319602A1e70
                var oldPoolBalance0 = 234966.16;

                //0xB187c8E40b46Ae8fc19A6cC24bb60320a73b9abD
                var oldPoolBalance1 = 98566.84;

                poolBalance += (poolBalance1 + oldPoolBalance0 + oldPoolBalance1);
            }

            var totalStaked = 0;
            var stakeRewards = 0;

            if (net.fmtaToken.stakingAddress !== Navigation.emptyAddress)
            {
                var tot = await stakingContract.methods.totalStakes().call();
                totalStaked = convert.fromAtomicUnits(tot, 18);

                var stRew = await stakingContract.methods.totalRewardsPaid().call();
                stakeRewards = convert.fromAtomicUnits(stRew, 18);
            }

            var sup = await fmtaContract.methods.totalSupply().call();
            var totalSupply = convert.fromAtomicUnits(sup, 18);

            var circulating = (totalSupply + totalStaked) - exclude;

            var mc = circulating * Home.prices.fundamenta.usd;

            $(container).html(
                '<form class="card mb-3 border border-primary shadow">' +
                    '<div class="card-header">' + wallet.niceNames.get(chainId) + ' supply</div>' +
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
                                    '<div>' + circulating.toFixed(2) + ' FMTA</div>' +
                                    '<div>' + totalStaked.toFixed(2) + ' FMTA</div>' +
                                    '<div>' + mc.toFixed(2) + ' USD</div>' +
                                    '<div>' + stakeRewards.toFixed(2) + ' FMTA</div>' +
                                    '<div>' + poolBalance.toFixed(2) + ' FMTA</div>' +
                                '</div>' +
                            '</div>' +
                        '</div>' +
                    '</div>' +
                '</form>'
            );
        }
    }

    async displayNetworkStats()
    {
        var priceUrl = 'https://api.coingecko.com/api/v3/simple/price?ids=fundamenta&vs_currencies=usd&include_market_cap=false&include_24hr_vol=false&include_24hr_change=false&include_last_updated_at=false'

        Home.prices = await $.ajax({
            url: priceUrl,
            method: "GET",
            dataType: 'json',
            cache: 'false'
        });

        await config.fetchNetworkConfig();

        this.displayTokenomics(1, '#ethStats');
        this.displayTokenomics(56, '#bscStats');
        this.displayTokenomics(137, '#polyStats');
    }

    btnCalc_Clicked = async () => {
        msg.clear();
        var amount = parseFloat($("#amount").val());
        var time = parseFloat($("#time").val());

        if (isNaN(amount) || isNaN(time) || amount === 0 || time === 0)
        {
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
                if (wallet.web3.eth.defaultAccount !== null)
                {
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
                if (wallet.web3.eth.defaultAccount !== null)
                {
                    await this.displayUserBalances();
                    await this.displayUserStakes();
                }

                await this.displayNetworkStats();
            });

            em.on('chainChanged', async () => {
                if (wallet.web3.eth.defaultAccount !== null)
                {
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