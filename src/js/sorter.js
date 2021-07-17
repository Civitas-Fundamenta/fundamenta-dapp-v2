import $ from 'jquery';

export class Sorter {
    static wrapData = null;

    static wrappable(data) {

        if (this.wrapData)
            return;

        var processed = [];
        $.each(data, function () {
            var net = this;
            var netData = {
                chainId: this.chainId,
                network: this.network,
                ticker: this.ticker,
                tokens: []
            };

            $.each(net.tokens, function () {
                if (this.wrappedTokenAddress) {
                    var tokenData = {
                        name: this.name,
                        ticker: this.ticker,
                        wrappedName: "",
                        wrappedTicker: "",
                        tokenAddress: this.tokenAddress,
                        wrappedTokenAddress: this.wrappedTokenAddress,
                        decimals: this.decimals
                    }

                    $.each(net.tokens, function () {
                        if (this.tokenAddress === tokenData.wrappedTokenAddress) {
                            tokenData.wrappedName = this.name;
                            tokenData.wrappedTicker = this.ticker;
                        }
                    });

                    netData.tokens.push(tokenData);
                }
            });

            if (netData.tokens.length > 0) {
                processed.push(netData);
            }
        });

        this.wrapData = processed;
    }
}