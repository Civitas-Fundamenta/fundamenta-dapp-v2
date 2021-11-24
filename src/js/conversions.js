import BigDecimal from 'js-big-decimal';

export class Conversions {
    static to8bitHex = (value) => { return ('00' + value.toString(16)).slice(-2); }
    static to32bitHex = (value) => { return ('00000000' + value.toString(16)).slice(-8); }

    static bin2hex = (arr) => {
        var hex = "";
        for (var i = 0; i < arr.length; i++)
            hex += this.to8bitHex(arr[i]);
    
        return hex;
    }
    
    static fromAuBigDecimal = (value, decimals) => {
        if (isNaN(decimals)) decimals = 18;
        return new BigDecimal(value).divide(new BigDecimal(Math.pow(10, decimals)));
    }

    static fromAu = (value, decimals) => {
        if (isNaN(decimals)) decimals = 18;
        var b = new BigDecimal(value).divide(new BigDecimal(Math.pow(10, decimals)));
        return Number(b.value);
    }
    
    static toAuHex = (value, decimals) => {
        if (isNaN(decimals)) decimals = 18;
        var b = new BigDecimal(value).multiply(new BigDecimal(Math.pow(10, decimals)));
        return (Number(b.floor().getValue())).toString(16).padStart(64, '0');
    }

    static toAuHexPrefixed = (value, decimals) => {
        if (isNaN(decimals)) decimals = 18;
        var b = new BigDecimal(value).multiply(new BigDecimal(Math.pow(10, decimals)));
        return '0x' + (Number(b.floor().getValue())).toString(16).padStart(64, '0');
    }
}
