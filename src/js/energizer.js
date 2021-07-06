
import { Config as config } from './config'
import { Conversions as convert } from './conversions';

import EventEmitter from 'events';
import $ from 'jquery'

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

    async start() {
        while (true)
        {
            if (this.cancellationToken.cancelRequested)
            {
                console.log("Energize task cancelled by token");
                return;
            }

            console.log("Attempting energize");
            if (await this.energize())
                return;

            await this.delay(10000);
        }
    }

    async energize() {
        var transactionData = this.teleport.transactionData;
        var blockNumber = this.teleport.blockNumber;
        var confs = this.teleport.destinationToken.confs;

        var approval = await this.getApproval(this.teleport.signature, blockNumber, transactionData, confs);

        if (approval.length < confs) {
            if (this.cancellationToken.cancelRequested)
                return true;

            if (approval.length > 0) {
                if (approval[0].code !== 0)
                {
                    this.emitter.emit('error', approval[0].code, approval[0].data.s);

                    if (approval[0].code !== 100)
                        return true;
                }
            }
            else
                this.emitter.emit('error', -1, "Not Approved");

            return false;
        }

        var serverSignatures = [];

        $.each(approval, function () {
            serverSignatures.push("0x" + this.data.s);
        });

        this.emitter.emit("ok", serverSignatures);
        return true;
    }

    async getApproval(cSig, block, txData, confs) {
        var bigIntBlock = await convert.toBigIntHex(block);

        var responses = [];

        for (var i = 1; i <= config.app.serverCount; i++) {
            var response = await this.getServerApproval(i, bigIntBlock, txData, cSig);

            if (response == null) {
                console.log("No response");
                continue;
            }

            if (response.code !== 0) {
                console.log("Server responded with error", response.code);
                responses.push(response);
                return responses;
            }

            console.log("Server responded OK");
            responses.push(response);
            if (responses.length >= confs)
                break;
        }

        return responses;
    }

    async getServerApproval(index, block, txData, cSig) {
        var url = "https://cp" + index + "." + config.app.serverDomain + "/authorize/?n=" + config.app.cpNet +
            "&d=" + txData +
            "&s=" + cSig +
            "&b=" + block;

        console.log("Contacting server " + index);

        var result = await $.ajax({
            url: url,
            method: "GET",
            dataType: 'json',
            cache: 'false'
        });
        console.log(result);
        return result;
    }
}