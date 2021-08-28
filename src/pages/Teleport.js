import React from 'react';
import $ from 'jquery';
import EventEmitter from 'events';

import { Config as config } from '../js/config'
import { CancellationToken } from '../js/cancellationToken';
import { Conversions as convert } from '../js/conversions';
import { Energizer } from '../js/energizer';
import { enable, disable } from '../js/ui';
import { WalletProvider as wallet } from '../js/walletProvider'

import { MessagePanel as msg, MessagePanelComponent } from '../components/MessagePanel'
import { NetworkSelect as ns } from '../components/NetworkSelect';

export default class Teleport extends React.Component {

    constructor(props) {
        super(props);
        this.completedTeleport = null;
        this.cancellationToken = new CancellationToken();
    }

    async populateTokenDropDown() {
        $("#sourceToken").empty();
        $("#destination").empty();
        $("#sourceToken").append($("<option />").text("Select token"));
        $("#destination").append($("<option />").text("Select destination"));

        await this.validateUiState();
        
        var network = ns.getFromMap(wallet.chainId);

        if (!network)
            return;

        $("#sourceToken").append($("<option />").text(network.fmtaToken.ticker));

        $.each(network.tokens, function () {
            if (this.bridgeAddress)
                $("#sourceToken").append($("<option />").text(this.ticker));
        });
    }

    getSourceTokenFromDropdown() {
        var network = ns.getFromMap(wallet.chainId);
        if (!network)
            return;

        var sourceTokenTicker = $("#sourceToken option:selected").text();
        var token;
        if (sourceTokenTicker === network.fmtaToken.ticker) {
            token = network.fmtaToken;
        } else {
            $.each(network.tokens, function () {
                if (this.ticker === sourceTokenTicker) {
                    token = this;
                    return false;
                }
            });
        }

        return token;
    }

    getDestinationNetworkFromDropDown() {
        var destNetworkName = $("#destination option:selected").text();
        var network;

        $.each(config.network, function () {
            if (this.network === destNetworkName) {
                network = this;
                return false;
            }
        });
        return network;
    }

    getDestinationTokenFromDropDown() {
        var sourceToken = this.getSourceTokenFromDropdown();
        var network = this.getDestinationNetworkFromDropDown();

        var token;
        if (sourceToken.ticker === network.fmtaToken.ticker) {
            token = network.fmtaToken;
        } else {
            $.each(network.tokens, function () {
                if (this.ticker === sourceToken.ticker) {
                    token = this;
                    return false;
                }
            });
        }

        return token;
    }

    async validateUiState() {
        var net = ns.getFromMap(wallet.chainId);
        
        msg.clear();
        disable("#button");
        
        var balance = await this.getTokenBalance();

        if (!net)
        {
            disable("#form");
            return;
        }

        if (net.chainId !== wallet.chainId)
            return;

        var index = $("#destination").prop('selectedIndex') - 1;
        if (index < 0)
            return;

        var amount = parseFloat($("#amount").val());
        if (isNaN(amount) || amount <= 0 || isNaN(balance) || balance < amount) {
            msg.showWarn("Invalid amount entered");
            disable("#button");
            return;
        }
        
        enable("#button");
    };

    async getTokenBalance() {
        var network = ns.getFromMap(wallet.chainId);
        var token = this.getSourceTokenFromDropdown();

        if (!network || !token) {
            $("#amount").attr("placeholder", "Enter amount");
            return;
        }

        if (wallet.chainId === network.chainId && wallet.web3.eth.defaultAccount) {
            var contract = new wallet.web3.eth.Contract(config.app.tokenAbi, token.tokenAddress);
            var bal = await contract.methods.balanceOf(wallet.web3.eth.defaultAccount).call();
            if (!bal)
                bal = 0;

            var balance = convert.fromAtomicUnits(bal, token.decimals).toString();

            $("#amount").attr('placeholder', `Enter amount (max ${balance})`);
            return parseFloat(balance);
        }
    }

    createNonce() {
        var address = wallet.web3.eth.defaultAccount.toString().slice(-40);
        var timestamp = convert.to32bitHex(Date.now());

        //todo: proper hex conversion from 8 bytes to 8 hex digits
        var array = new Uint8Array(8);
        window.crypto.getRandomValues(array);
        var hex = convert.bin2hex(array);
        return (timestamp + address + hex);
    }

    async componentDidMount() {
        msg.clear();
        if (!wallet.hasListener('teleport')) {
            var em = new EventEmitter();

            em.on('connect', () => {
                enable("#form");
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

                enable("#form");
                await this.validateUiState();
            });

            em.on('chainChanged', async (chainId) => {
                msg.clear();
                await this.populateTokenDropDown();
                if (this.completedTeleport == null) {
                    await this.validateUiState();
                    return;
                }

                var net = ns.getFromMap(wallet.chainId);

                if (this.completedTeleport.destination.chainId !== wallet.chainId) {
                    msg.showWarn("Switch to the " + net.network + " network to energize");
                    return;
                }

                msg.showWarn("Waiting for energize. Do not close this page");

                this.cancellationToken = new CancellationToken();
                var energizer = new Energizer(this.completedTeleport, this.cancellationToken);
                energizer.on('error', (code, error) => {
                    if (code !== 100) {
                        msg.clear();
                        enable("#form");
                    }

                    msg.showError("Error " + code + ": " + error);
                });

                energizer.on('ok', async (serverSignatures) => {
                    msg.clear();
                    msg.showWarn("Energized confirmed. Processing transaction...");
                    try {
                        var destBridgeContract = new wallet.web3.eth.Contract(config.app.bridgeAbi, energizer.teleport.destinationToken.bridgeAddress);
                        var tx = await destBridgeContract.methods.deposit(energizer.teleport.signature, serverSignatures, energizer.teleport.transactionData).send({ from: wallet.web3.eth.defaultAccount });
                        console.log("Transaction: ", tx);
                        enable("#form");
                        msg.showOk("Energize success!");
                    }
                    catch
                    {
                        msg.clear();
                        msg.showError("Energize faile!");
                        enable("#form");
                        return;
                    }
                });

                await energizer.start();
            });

            wallet.addListener('teleport', em);
        }

        if (wallet.isConnected())
            enable("#form");
        else
            disable("#form");

        ns.populateAll();
        await this.populateTokenDropDown();

        $("#sourceToken").on('change', async () => {
            var network = ns.getFromMap(wallet.chainId);
            var token = this.getSourceTokenFromDropdown();

            $("#destination").empty();
            $("#destination").append($("<option />").text("Select destination"));

            await this.validateUiState();

            if (!token)
                return;

            $.each(config.network, function () {
                var destNetwork = this;
                var destTokens = this.tokens;
                if (destNetwork !== network) {
                    if (token.ticker === destNetwork.fmtaToken.ticker)
                        $("#destination").append($("<option />").text(destNetwork.network));
                    else {
                        $.each(destTokens, function () {
                            if (this.ticker === token.ticker) {
                                $("#destination").append($("<option />").text(destNetwork.network));
                            }
                        });
                    }
                }
            });
        });

        $("#destination").on('change', async () => {
            await this.validateUiState();
        });

        $("#amount").on('change', async () => {
            await this.validateUiState();
        });

        $("#button").on('click', async () => {
            msg.clear();
            disable("#form");
            var source = ns.getFromMap(wallet.chainId);
            var sourceToken = this.getSourceTokenFromDropdown();
            var destination = this.getDestinationNetworkFromDropDown();
            var destinationToken = this.getDestinationTokenFromDropDown();
            var amountAtomicUnitsHex = convert.toAtomicUnitsHex($("#amount").val(), sourceToken.decimals);
            var sourceId = convert.to32bitHex(source.id) + convert.to32bitHex(sourceToken.id);
            var destId = convert.to32bitHex(destination.id) + convert.to32bitHex(destinationToken.id);
            var uuid = sourceId + destId;
            var nonce = this.createNonce();
            var address = wallet.web3.eth.defaultAccount.toString().slice(-40).padStart(64, '0');

            var transactionData = "0x" + amountAtomicUnitsHex + uuid + nonce + address;

            msg.showWarn("Requesting signature...");
            var signature;

            try {
                signature = await wallet.web3.eth.personal.sign(transactionData, wallet.web3.eth.defaultAccount);
            }
            catch
            {
                msg.clear();
                msg.showError("Transaction signing failed");
                enable("#form");
                return
            }

            try {
                msg.showWarn("Processing teleport. Please wait...");
                var sourceBridgeContract = new wallet.web3.eth.Contract(config.app.bridgeAbi, sourceToken.bridgeAddress);
                var withdrawTx = await sourceBridgeContract.methods.withdraw(signature, transactionData).send({ from: wallet.web3.eth.defaultAccount });
                console.log("Withdraw: ", withdrawTx);

                var txHash = withdrawTx.transactionHash;
                var blockNumber = withdrawTx.blockNumber;

                this.completedTeleport = {
                    txHash,
                    blockNumber,
                    transactionData,
                    source,
                    destination,
                    destinationToken,
                    signature
                };

                msg.clear();
                msg.showOk("Teleport completed.");

                if (wallet.isMetamask)
                    msg.showWarn("Switch to " + destination.network + " to energize");
                else if (wallet.isWalletConnect) {
                    msg.showWarn("Requesting netework switch to " + destination.network + " to energize");
                    await wallet.switchNetwork(destination.chainId);
                }
            }
            catch (ex) {
                msg.clear();
                msg.showError("Teleport transaction failed");
                console.error(ex);
                enable("#form");
            }

            await this.getTokenBalance();
        });
    }

    componentWillUnmount() {
        wallet.removeListener('teleport');
        this.cancellationToken.cancel();
    }

    render() {
        return (
            <div className="ps-3 pe-3">
                <div className="row">
                    <div className="col-sm">
                        <div>
                            <form className="card">
                                <div className="card-header">Teleport</div>
                                <div className="card-body">
                                    <div id="form">
                                        <div className="input-group mb-3">
                                            <select id="sourceToken" className="form-control form-select"></select>
                                            <input type="number" id="amount" className="form-control input-sm numeric-input"
                                                placeholder="Enter amount" />
                                        </div>
                                        <div className="mb-3">
                                            <select id="destination" className="form-control form-select"></select>
                                        </div>
                                        <div>
                                            <button type="button" id="button" className="btn btn-primary w-100">Teleport!</button>
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
