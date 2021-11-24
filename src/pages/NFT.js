import React from 'react';
import EventEmitter from 'events';

import { Config as config } from '../js/config'
import { enable, disable } from '../js/ui';
import { WalletProvider as wallet } from '../js/walletProvider'
import { Conversions as convert } from '../js/conversions';

import { MessagePanel as msg, MessagePanelComponent } from '../components/MessagePanel'

export default class NFT extends React.Component {

    async validateUiState() {
        
        msg.clear();
        disable("#button");

        if (!wallet.isConnected())
            return;

        if (!wallet.chainId || wallet.chainId === 0)
            return;

        var network = await config.getFromMap(wallet.chainId);
        if (!network)
            return;

        var nftMinter = config.app.nftMinters[wallet.chainId];

        if (!nftMinter)
        {
            msg.showWarn('The NFT cannot be minted on this network');
            return;
        }

        var fmtaToken = await config.getFmtaToken(network);

        var tokenContract = new wallet.web3.eth.Contract(config.app.tokenAbi, fmtaToken.address);
        var minterContract = new wallet.web3.eth.Contract(config.app.minterAbi, nftMinter);

        var hasMinted = await minterContract.methods.hasMinted(wallet.web3.eth.defaultAccount).call();

        if (hasMinted)
        {
            msg.showWarn('This address already has the NFT on this network');
            return;
        }

        var req = await minterContract.methods.fmtaNeeded().call();
        if (!req) req = 0;
        var required = convert.fromAu(req, 18).toString();

        var bal = await tokenContract.methods.balanceOf(wallet.web3.eth.defaultAccount).call();
        if (!bal) bal = 0;
        var balance = convert.fromAu(bal, 18).toString();

        if (balance < required)
        {
            msg.showWarn('A balance of 100 FMTA is required to mint the NFT');
            return;
        }

        enable("#button");
    }

    async componentDidMount() {
        msg.clear();

        if (!wallet.hasListener('nft')) {
            var em = new EventEmitter();

            em.on('connect', async () => {
                await this.validateUiState();
            });

            em.on('disconnect', async () => {
                await this.validateUiState();
            });

            em.on('accountsChanged', async (accounts) => {
                await this.validateUiState();
            });

            em.on('chainChanged', async () => {
                await this.validateUiState();
            });

            wallet.addListener('nft', em);
        }

        await this.validateUiState();
    }

    btnNFT_Clicked = async () => {
        var nftMinter = config.app.nftMinters[wallet.chainId];
        var minterContract = new wallet.web3.eth.Contract(config.app.minterAbi, nftMinter);

        await minterContract.methods.mint().send({ from: wallet.web3.eth.defaultAccount });
    }

    componentWillUnmount() {
        wallet.removeListener('nft');
    }

    render() {
        return (
            <div className="ps-3 pe-3">
                <div className="page-flex-container d-flex flex-row justify-content-center align-items-center">
                    <div className="page-content">
                        <form autoComplete="off" className="card border border-primary shadow">
                            <div className="card-header">Free FMTA NFT</div>
                            <div className="card-body">
                                <div id="form">
                                    <div className="mb-3 text-center">
                                        Fundamenta's turning one! In celebration of this milestone, we've decided to immortalize the moment in an NFT, cause why not?
                                    </div>
                                    <div className="mb-3 text-center">
                                        So feel free to mint your own. Just need 100 fmta in your wallet and you can mint a different NFT on each chain. 
                                        Get in and collect them all so you can say "I was there!" to your grandkids.
                                    </div>
                                    <div>
                                        <button type="button" id="button" className="round btn btn-primary w-100" onClick={this.btnNFT_Clicked}>Mint!</button>
                                    </div>
                                </div>
                                <MessagePanelComponent />
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        )
    }
}