import { Config as config } from './config'
import { Conversions as convert } from '../js/conversions';
import { WalletProvider as wallet } from '../js/walletProvider'

export class LpApprove {

    static async allowance(net, info) {
        var tokenContract = new wallet.web3.eth.Contract(config.app.tokenAbi, info.poolInfo.ContractAddress);

        try {
            var al = await tokenContract.methods.allowance(wallet.web3.eth.defaultAccount, net.liquidityMining.address).call();
            if (!al)
                return;

            var allowance = convert.fromAtomicUnits(al, 18).toString();
            return parseFloat(allowance);
        }
        catch (ex)
        {
            console.error(ex);
            return;
        }
    }

    static async approve(net, info)
    {
        var tokenContract = new wallet.web3.eth.Contract(config.app.tokenAbi, info.ContractAddress);

        try {
            var au2 = convert.toAtomicUnitsHexPrefixed(100000000, 18);
            await tokenContract.methods.approve(net.liquidityMining.address, au2).send({ from: wallet.web3.eth.defaultAccount });
        }
        catch (ex)
        {
            console.error(ex);
            return;
        }
    }
}