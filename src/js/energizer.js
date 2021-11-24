
import { Config as config } from './config'
import { WalletProvider as wallet } from './walletProvider'

import EventEmitter from 'events';
import $ from 'jquery';

export class Energizer {
    constructor(teleport, cancellationToken) {
        this.teleport = teleport;
        this.emitter = new EventEmitter();
        this.cancelRequested = false;
        this.cancellationToken = cancellationToken;
    }

    async on(ev, callback) {
        this.emitter.on(ev, callback);
    }

    delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    static async recover(txHash) {
        var receipt = await wallet.web3.eth.getTransactionReceipt(txHash);

        if (!receipt) {
            console.log("Receipt not found. Recovery failed");
            return;
        }

        var blockNumber = receipt.blockNumber.toString(16);

        var sn, dn, t, sender, amount, nonce;

        $.each(receipt.logs, async function () {
            if (this.topics[0] === config.app.withdrawEventHash) {
                var data = this.data.slice(2);

                sender = data.slice(24, 64);

                sn = data.slice(120, 128);
                amount = data.slice(128, 192);

                nonce = this.topics[1].slice(2);
                dn = this.topics[2].slice(58);
                t = this.topics[3].slice(58);

                return false;
            }
        });

        var address = sender.toString().slice(-40).padStart(64, 0);

        var transactionData = '0x' + amount + sn + dn + t + address + nonce;

        var did = parseInt(dn, 16);
        var tid = parseInt(t, 16);

        var destination = await config.getFromMap(did);
        var destinationToken = await config.getToken(destination, tid);

        return {
            txHash,
            blockNumber,
            transactionData,
            destination,
            destinationToken
        };
    }

    async start() {
        while (true) {
            if (this.cancellationToken.cancelRequested) {
                console.warn('Energize task cancelled by token');
                return;
            }

            console.log('Attempting energize');
            if (await this.energize())
                return;

            await this.delay(10000);
        }
    }

    async energize() {
        var transactionData = this.teleport.transactionData;
        var blockNumber = this.teleport.blockNumber;

        var destBridgeContract = new wallet.web3.eth.Contract(config.app.bridgeAbi, this.teleport.destination.bridge);
        var tokenInfo = await destBridgeContract.methods.queryToken(this.teleport.destinationToken.id).call();

        var confs = tokenInfo.numSigners;

        var approval = await this.getApproval(blockNumber, transactionData, confs);

        if (approval.length < confs) {
            if (this.cancellationToken.cancelRequested)
                return true;

            if (approval.length > 0) {
                if (approval[0].code !== 0) {
                    this.emitter.emit('error', approval[0].code, approval[0].data.s);

                    if (approval[0].code !== 100)
                        return true;
                }
            }
            else
                this.emitter.emit('error', -1, 'Not Approved');

            return false;
        }

        var serverSignatures = [];

        $.each(approval, function () {
            serverSignatures.push(`0x${this.data.s}`);
        });

        this.emitter.emit('ok', serverSignatures);
        return true;
    }

    async getApproval(block, txData, confs) {
        var responses = [];

        for (var i = 1; i <= config.app.serverCount; i++) {
            var response = await this.getServerApproval(i, block, txData);

            if (response == null) {
                console.log('No response');
                continue;
            }

            if (response.code !== 0) {
                console.log('Server responded with error', response.code);
                responses.push(response);
                return responses;
            }

            console.log('Server responded OK');
            responses.push(response);
            if (responses.length >= confs)
                break;
        }

        return responses;
    }

    async getServerApproval(index, block, txData) {
        var url = `https://cp${index}.${config.app.serverDomain}/validate/?n=${config.app.net}&d=${txData}&b=${block}`;

        console.log('Contacting server:', index);

        var result = await $.ajax({
            url: url,
            method: 'GET',
            dataType: 'json',
            cache: 'false'
        });
        console.log(result);
        return result;
    }
}