import React from 'react';
import $ from 'jquery';
import Web3 from "web3";

import { Config as config } from '../js/config'
import { Conversions as convert } from '../js/conversions';

import { MessagePanel as msg, MessagePanelComponent } from '../components/MessagePanel'

export default class Stats extends React.Component {

    static rpcUrls = new Map([
        [1, "https://mainnet.infura.io/v3/9354d2b6c5ee45c2a4036efd7b617783"],
        [4, "https://rinkeby.infura.io/v3/9354d2b6c5ee45c2a4036efd7b617783"],
        [5, "https://goerli.infura.io/v3/9354d2b6c5ee45c2a4036efd7b617783"],
        [56, "https://bsc-dataseed.binance.org/"]
    ]);

    static niceNames = new Map([
        [1, "Ethereum"],
        [4, "Rinkeby"],
        [5, "Goerli"],
        [56, "Binance"]
    ]);

    static prices = null;

    btnCalc_Clicked = async () => {
        msg.clear();
        var amount = parseFloat($("#amount").val());
        var time = parseFloat($("#time").val());

        if (isNaN(amount) || isNaN(time) || amount === 0 || time === 0)
        {
            msg.showError("Invalid amounts entered");
        }

        var total = ((amount / 500) * time).toFixed(2);
        msg.showOk(+ time + " day stake reward: " + total + " FMTA, " + (total * Stats.prices.fundamenta.usd).toFixed(2) + " USD")
    };

    async componentDidMount() {
        $("#stats").empty();
        msg.clear();

        var priceUrl = 'https://api.coingecko.com/api/v3/simple/price?ids=fundamenta&vs_currencies=usd&include_market_cap=false&include_24hr_vol=false&include_24hr_change=false&include_last_updated_at=false'

        Stats.prices = await $.ajax({
            url: priceUrl,
            method: "GET",
            dataType: 'json',
            cache: 'false'
        });

        await config.fetchNetworkConfig();

        $.each(config.networkMap, async function () {
            if (this.fmtaToken) {
                var web3 = new Web3(new Web3.providers.HttpProvider(Stats.rpcUrls.get(this.chainId)));

                var fmtaContract = new web3.eth.Contract(config.app.tokenAbi, this.fmtaToken.tokenAddress);
                var stakingContract = new web3.eth.Contract(config.app.stakeAbi, this.fmtaToken.stakingAddress);
                var lpContract = new web3.eth.Contract(config.app.miningAbi, this.liquidityMining.address);

                var poolInfo0 = await lpContract.methods.poolInfo(0).call();
                var poolBalance0 = convert.fromAtomicUnits(poolInfo0.TotalRewardsPaidByPool, 18);

                var exclude = 0;
                var poolBalance = poolBalance0;

                if (this.chainId === 1) {
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

                var tot = await stakingContract.methods.totalStakes().call();
                var totalStaked = convert.fromAtomicUnits(tot, 18);

                var sup = await fmtaContract.methods.totalSupply().call();
                var totalSupply = convert.fromAtomicUnits(sup, 18);

                var stRew = await stakingContract.methods.totalRewardsPaid().call();
                var stakeRewards = convert.fromAtomicUnits(stRew, 18);

                var circulating = (totalSupply + totalStaked) - exclude;

                var mc = circulating * Stats.prices.fundamenta.usd;

                $("#stats").append(
                    '<form class="card mb-3 border border-primary shadow">' +
                        '<div class="card-header">' + Stats.niceNames.get(this.chainId) + ' supply</div>' +
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
        });
    }

    render() {
        return (
            <div className="ps-3 pe-3">
                <div className="page-flex-container d-flex flex-row justify-content-center align-items-center">
                    <div className="page-content">
                        <div id="stats" />
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