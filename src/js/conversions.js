export class Conversions {

    static to8bitHex(value) {
        return ('00' + value.toString(16)).slice(-2);
    }

    static to32bitHex(value) {
        return ('00000000' + value.toString(16)).slice(-8);
    }

    static to64bitHex(value) {
        return ('0000000000000000' + value.toString(16)).slice(-16);
    }

    static bin2hex(arr) {
        var hex = "";
        for (var i = 0; i < arr.length; i++) {
            hex += Conversions.to8bitHex(arr[i]);
        }

        return hex;
    }

    static async toBigIntHex(hex) {
        var padded = hex.toString(16).padStart(64, "0");

        var reverse = await padded.match(/[a-fA-F0-9]{2}/g).reverse().join("");
        return reverse;
    };

    static toAtomicUnitsHex(value, decimals) {
        if (isNaN(decimals)) decimals = 18;
        return (value * Math.pow(10, decimals)).toString(16).padStart(64, '0');
    }

    static toAtomicUnitsHexPrefixed(value, decimals) {
        if (isNaN(decimals)) decimals = 18;
        return `0x${(value * Math.pow(10, decimals)).toString(16).padStart(64, '0')}`;
    }

    static toAtomicUnits(value, decimals) {
        if (isNaN(decimals)) decimals = 18;
        return (value * Math.pow(10, decimals));
    }

    static fromAtomicUnits(value, decimals) {
        if (isNaN(decimals)) decimals = 18;
        return (value / Math.pow(10, decimals));
    }

}
