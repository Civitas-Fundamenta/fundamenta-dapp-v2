import React from 'react';
import $ from 'jquery'
import EventEmitter from 'events';

import { Config as config } from '../js/config'
import { CancellationToken } from '../js/cancellationToken';
import { Conversions as convert } from '../js/conversions';
import { Energizer } from '../js/energizer';
import { enable, disable } from '../js/ui';
import { WalletProvider as wallet } from '../js/walletProvider'

import { MessagePanel as msg, MessagePanelComponent } from '../components/MessagePanel'

export default class Teleport extends React.Component {

    constructor(props) {
        super(props);
        this.completedTeleport = null;
        this.cancellationToken = new CancellationToken();
    }

    getSourceNetworkFromDropdown() {
        var sourceIndex = $("#source").prop('selectedIndex') - 1;
        if (sourceIndex < 0)
            return;
        var network = config.network[sourceIndex];
        return network;
    }

    getSourceTokenFromDropdown() {
        var network = this.getSourceNetworkFromDropdown();
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
        var net = this.getSourceNetworkFromDropdown();

        disable("#button");
        msg.clearAll();

        if (!net)
            return;

        if (net.chainId !== wallet.chainId) {
            if (wallet.isMetamask) {
                msg.showWarn("Switch to the " + net.network + " network to teleport");
                return;
            }
            else if (wallet.isWalletConnect) {
                msg.showWarn("Sending request to change to the " + net.network + " network for teleport");
                wallet.switchNetwork(net.chainId);
                return;
            }
        }

        var index = $("#destination").prop('selectedIndex') - 1;
        if (index < 0)
            return;

        var balance = await this.getCurrentSourceTokenBalance();
        var amount = parseFloat($("#amount").val());
        if (isNaN(amount) || amount <= 0 || isNaN(balance) || balance < amount) {
            msg.showError("Enter an amount to teleport");
            disable("#button");
        }
        else
            enable("#button");
    };

    async getCurrentSourceTokenBalance() {
        var network = this.getSourceNetworkFromDropdown();
        var token = this.getSourceTokenFromDropdown();

        if (!network || !token) {
            $("#balance").empty();
            return;
        }

        if (wallet.chainId === network.chainId && wallet.web3.eth.defaultAccount) {
            var contract = new wallet.web3.eth.Contract(config.app.tokenAbi, token.tokenAddress);
            var bal = await contract.methods.balanceOf(wallet.web3.eth.defaultAccount).call();
            if (!bal) {
                bal = 0;
            }
            $("#balance").text(" (max " + convert.fromAtomicUnits(bal, token.decimals) + " " + token.ticker + ")");
            return bal;
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
        msg.clearAll();
        if (!wallet.hasListener('teleport')) {
            console.log("Registering teleport component wallet listeners");
            var em = new EventEmitter();

            em.on('connect', () => {
                enable("#form");
            });

            em.on('disconnect', () => {
                disable("#form");
                this.cancellationToken.cancel();
            });

            em.on('accountsChanged', async (accounts) => {
                if (accounts.length === 0) {
                    disable("#form");
                    return;
                }

                enable("#form");
                await this.validateUiState();
            });

            em.on('chainChanged', async (chainId) => {
                msg.clearAll();
                if (this.completedTeleport == null) {
                    await this.validateUiState();
                    return;
                }

                var net = this.getSourceNetworkFromDropdown();

                if (this.completedTeleport.destination.chainId !== wallet.chainId) {
                    msg.showWarn("Switch to the " + net.network + " network to energize");
                    return;
                }

                msg.showOk("Waiting for energize. Do not close this page");
                
                this.cancellationToken = new CancellationToken();
                var energizer = new Energizer(this.completedTeleport, this.cancellationToken);
                energizer.on('error', (code, error) => {
                    if (code !== 100) {
                        msg.hideOk();
                        enable("#form");
                    }

                    msg.showError("Error " + code + ": " + error);
                });

                energizer.on('ok', async (serverSignatures) => {
                    msg.hideWarn();
                    msg.hideError();
                    msg.showOk("Energized confirmed. Processing transaction...");
                    try {
                        var destBridgeContract = new wallet.web3.eth.Contract(config.app.bridgeAbi, energizer.teleport.destinationToken.bridgeAddress);
                        var depositTx = await destBridgeContract.methods.deposit(energizer.teleport.signature, serverSignatures, energizer.teleport.transactionData).send({ from: wallet.web3.eth.defaultAccount });
                        console.log("Deposit: ", depositTx);
                        enable("#form");
                        msg.showOk("Energized: " + depositTx.transactionHash);
                    }
                    catch
                    {
                        msg.hideOk();
                        msg.showError("Transaction failed");
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

        config.fetchNetworkConfig(function (data) {
            $("#source").append($("<option />").text("Select network"));
            $.each(data, function () {
                $("#source").append($("<option />").text(this.network));
            });
        });

        $("#source").on('change', async () => {
            var network = this.getSourceNetworkFromDropdown();
            $("#sourceToken").empty();
            $("#destination").empty();
            $("#sourceToken").append($("<option />").text("Select token"));
            $("#destination").append($("<option />").text("Select destination"));

            await this.validateUiState();

            if (!network)
                return;

            $("#sourceToken").append($("<option />").text(network.fmtaToken.ticker));

            $.each(network.tokens, function () {
                if (!this.bridgeAddress)
                    $("#sourceToken").append($("<option />").text(this.ticker));
            });
        });

        $("#sourceToken").on('change', async () => {
            var network = this.getSourceNetworkFromDropdown();
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
            msg.clearAll();
            disable("#form");
            var source = this.getSourceNetworkFromDropdown();
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

            msg.showOk("Requesting signature...");
            var signature;

            try {
                signature = await wallet.web3.eth.personal.sign(transactionData, wallet.web3.eth.defaultAccount);
            }
            catch
            {
                msg.hideOk();
                msg.showError("Transaction signing failed");
                enable("#form");
                return
            }

            try {
                msg.showOk("Processing teleport. Please wait...");
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

                msg.showOk("Teleport completed.");

                if (wallet.isMetamask)
                    msg.showWarn("Switch to " + destination.network + " to energize");
                else if (wallet.isWalletConnect) {
                    msg.showWarn("Requesting netework switch to " + destination.network + " to energize");
                    await wallet.switchNetwork(destination.chainId);
                }
            }
            catch (ex) {
                msg.hideOk();
                msg.showError("Teleport transaction failed");
                console.log(ex);
                enable("#form");
            }

            await this.getCurrentSourceTokenBalance();
        });
    }

    componentWillUnmount() {
        wallet.removeListener('teleport');
        this.cancellationToken.cancel();
    }

    render() {
        return (
            <div className="p-3">
                <div className="row">
                    <div className="col-sm">
                        <div>
                            <form className="card">
                                <div className="card-header">Teleport</div>
                                <div className="card-body">
                                    <div id="form">
                                        <div>From</div>
                                        <div className="input-group mb-3">
                                            <select id="source" className="form-control form-select"></select>
                                            <select id="sourceToken" className="form-control form-select"></select>
                                        </div>
                                        <div>To</div>
                                        <div className="mb-3">
                                            <select id="destination" className="form-control form-select"></select>
                                        </div>
                                        <div className="input-group">
                                            <div>Amount</div>&nbsp;<div id="balance"></div>
                                        </div>
                                        <div className="mb-3">
                                            <input type="number" id="amount" className="form-control input-sm numeric-input"
                                                placeholder="Enter amount" />
                                        </div>
                                        <div>
                                            <button type="button" id="button" className="btn btn-primary">Teleport!</button>
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
