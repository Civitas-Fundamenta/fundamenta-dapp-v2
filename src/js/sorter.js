import $ from 'jquery';

export class Sorter {
    static wrappable(data) {
        var processed = [];
        $.each(data, function () {
            var net = this;
            var netData = {
                chainId: this.chainId,
                name: this.name,
                ticker: this.ticker,
                tokens: []
            };

            $.each(net.tokens, function () {
                if (this.backingToken) {
                    netData.tokens.push(this);
                }
            });

            if (netData.tokens.length > 0) {
                processed.push(netData);
            }
        });

        return processed;
    }
}