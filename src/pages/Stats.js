import React from 'react';
import $ from 'jquery';
import Web3 from "web3";

import { Config as config } from '../js/config'
import { Conversions as convert } from '../js/conversions';

import { MessagePanel as msg, MessagePanelComponent } from '../components/MessagePanel'
import { NetworkSelect as ns } from '../components/NetworkSelect'

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
        ns.populateAll();
        $("#stats").empty();
        msg.clear();

        var priceUrl = 'https://api.coingecko.com/api/v3/simple/price?ids=fundamenta&vs_currencies=usd&include_market_cap=false&include_24hr_vol=false&include_24hr_change=false&include_last_updated_at=false'

        Stats.prices = await $.ajax({
            url: priceUrl,
            method: "GET",
            dataType: 'json',
            cache: 'false'
        });

        $.each(ns.networkMap, async function () {
            if (this.fmtaToken) {
                console.log(this);
                var web3 = new Web3(new Web3.providers.HttpProvider(Stats.rpcUrls.get(this.chainId)));

                var fmtaContract = new web3.eth.Contract(config.app.tokenAbi, this.fmtaToken.tokenAddress);
                var stakingContract = new web3.eth.Contract(config.app.stakeAbi, this.fmtaToken.stakingAddress);

                var exclude = 0;

                if (this.chainId === 1) {
                    var bal0 = await fmtaContract.methods.balanceOf(config.app.holder0).call();
                    var balance0 = convert.fromAtomicUnits(bal0, 18);

                    var bal1 = await fmtaContract.methods.balanceOf(config.app.holder1).call();
                    var balance1 = convert.fromAtomicUnits(bal1, 18);

                    exclude = balance0 + balance1;
                }

                var tot = await stakingContract.methods.totalStakes().call();
                var totalStaked = convert.fromAtomicUnits(tot, 18);

                var sup = await fmtaContract.methods.totalSupply().call();
                var totalSupply = convert.fromAtomicUnits(sup, 18);

                var circulating = (totalSupply + totalStaked) - exclude;

                var mc = circulating * Stats.prices.fundamenta.usd;

                $("#stats").append(
                    '<form class="card">' +
                        '<div class="card-header">' + Stats.niceNames.get(this.chainId) + ' supply</div>' +
                        '<div className="card-body">' +
                            '<div class="ps-3 pt-3">' +
                                '<div class="d-flex pb-3">' +
                                    '<div class="text-end">' +
                                        '<div>Circulating:&nbsp;</div>' +
                                        '<div>Staked:&nbsp;</div>' +
                                        '<div>Market Cap:&nbsp;</div>' +
                                    '</div>' +
                                    '<div class="text-start">' +
                                        '<div>' + circulating.toFixed(2) + ' FMTA</div>' +
                                        '<div>' + totalStaked.toFixed(2) + ' FMTA</div>' +
                                        '<div>' + mc.toFixed(2) + ' USD</div>' +
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
                <div className="row">
                    <div className="col-sm">
                        <div id="stats" />
                        <div>
                            <form className="card">
                                <div className="card-header">Stake Calculator</div>
                                <div className="card-body">
                                    <div id="form">
                                        <div className="input-group mb-3">
                                            <input type="number" id="amount" className="form-control input-sm" placeholder="Enter amount" />
                                            <input type="number" id="time" className="form-control input-sm" placeholder="Enter time" />
                                        </div>
                                        <div>
                                            <button type="button" id="button" className="btn btn-primary w-100" onClick={this.btnCalc_Clicked}>Calculate!</button>
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