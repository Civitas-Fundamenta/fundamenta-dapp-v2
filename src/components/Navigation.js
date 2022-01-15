import React from 'react';
import EventEmitter from 'events';
import $ from 'jquery';
import { Navbar, Nav } from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap'

import { Config, Config as config } from '../js/config'
import { show, hide, disable, enable } from '../js/ui';
import { WalletProvider as wallet } from '../js/walletProvider'

export class Navigation extends React.Component {

    //static #_toggleNetworkWarningLock = false;

    static async toggleNetworkWarning() {
        if (!Config.network)
            return;

        if (!wallet.isConnected()) {
            hide("#_aInvNet");
            hide('#_aAcc');
            show('#_aNoAcc');
            hide('#_btnS');
            return;
        }

        if (wallet.web3.eth.defaultAccount == null) {
            hide("#_aInvNet");
            hide('#_aAcc');
            show('#_aNoAcc');
            hide('#_btnS');
            return;
        }
        else {
            $("#_aAccText").text(wallet.web3.eth.defaultAccount);
            hide('#_aNoAcc');
            show('#_aAcc');
        }

        show('#_btnS');

        if (!wallet.chainId || wallet.chainId === 0) {
            hide("#_aInvNet");
            $("#_btnD").text("Unknown");
            return;
        }

        var net = await config.getFromMap(wallet.chainId);

        if (!net) {
            $("#_aInvNetText").text(`Invalid network. Wallet set to chain ${wallet.chainId}`);
            show("#_aInvNet");
        }
        else
            hide("#_aInvNet");

        $("#_btnD").text(await wallet.getNetworkName());
    }

    openProviderModal() {
        $("#_modSelectProvider").addClass("d-block")
        $("#_modSelectProvider").addClass("show")
    }

    closeProviderModal() {
        $("#_modSelectProvider").removeClass("d-block")
        $("#_modSelectProvider").removeClass("show")
    }

    openNetworkSelectModal() {
        $("#_modSelectNetwork").addClass("d-block")
        $("#_modSelectNetwork").addClass("show")
    }

    closeNetworkSelectModal() {
        $("#_modSelectNetwork").removeClass("d-block")
        $("#_modSelectNetwork").removeClass("show")
    }

    _btnC_clicked = async () => {
        if (wallet.isMetamaskAvailable()) {
            console.log("Metamask is available. Displaying modal");
            this.openProviderModal();
        }
        else {
            console.log("Metamask not available. Defaulting to Wallet Connect");
            await wallet.walletConnect();
        }

        await Navigation.toggleNetworkWarning();
    }

    _btnE_clicked = async () => {
        this.closeProviderModal();
        this.closeNetworkSelectModal();
    }

    _btnD_clicked = async () => {
        await wallet.disconnect();
    }

    _btnS_clicked = async () => {

        if (config.app.net === 'mainnet' || config.app.net === 'mainnet.next') {
            hide('#testnetSwitch');
            show('#mainnetSwitch');
            hide("#_aNetChange");

            enable('#_btnEth');
            $('#_btnEth').text("ETHEREUM");

            enable('#_btnBsc');
            $('#_btnBsc').text("BINANCE SMART CHAIN");

            enable('#_btnPoly');
            $('#_btnPoly').text("POLYGON");

            enable('#_btnAvax');
            $('#_btnAvax').text("AVALANCHE");

            enable('#_btnXdai');
            $('#_btnXdai').text("GNOSIS CHAIN");

            enable('#_btnFtm');
            $('#_btnFtm').text("FANTOM");

            enable('#_btnCro');
            $('#_btnCro').text("CRONOS");

            if (wallet.chainId === 1) {
                disable('#_btnEth');
                $('#_btnEth').text("ETHEREUM (Current)");
            }
            else if (wallet.chainId === 56) {
                disable('#_btnBsc');
                $('#_btnBsc').text("BINANCE SMART CHAIN (Current)");
            }
            else if (wallet.chainId === 137) {
                disable('#_btnPoly');
                $('#_btnPoly').text("POLYGON (Current)");
            }
            else if (wallet.chainId === 43114) {
                disable('#_btnAvax');
                $('#_btnAvax').text("AVALANCHE (Current)");
            }
            else if (wallet.chainId === 100) {
                disable('#_btnXdai');
                $('#_btnXdai').text("GNOSIS CHAIN (Current)");
            }
            else if (wallet.chainId === 250) {
                disable('#_btnFtm');
                $('#_btnFtm').text("FANTOM (Current)");
            }
            else if (wallet.chainId === 25) {
                disable('#_btnCro');
                $('#_btnCro').text("CRONOS (Current)");
            }
        }
        else {
            show('#testnetSwitch');
            hide('#mainnetSwitch');
            hide("#_aNetChange");

            enable('#_btnRinkeby');
            $('#_btnRinkeby').text("RINKEBY");

            enable('#_btnGoerli');
            $('#_btnGoerli').text("GOERLI");

            enable('#_btnMumbai');
            $('#_btnMumbai').text("MUMBAI");

            if (wallet.chainId === 4) {
                disable('#_btnRinkeby');
                $('#_btnRinkeby').text("RINKEBY (Current)");
            }
            else if (wallet.chainId === 5) {
                disable('#_btnGoerli');
                $('#_btnGoerli').text("GOERLI (Current)");
            }
            else if (wallet.chainId === 80001) {
                disable('#_btnMumbai');
                $('#_btnMumbai').text("MUMBAI (Current)");
            }
        }

        this.openNetworkSelectModal();
    }



    _wc_clicked = async () => {
        try {
            this.closeProviderModal();
            await wallet.walletConnect();
            await Navigation.toggleNetworkWarning();
        } catch (e) { console.log(e); }
    }

    _mm_clicked = async () => {
        try {
            this.closeProviderModal();
            await wallet.metamask();
            await Navigation.toggleNetworkWarning();
        } catch (e) { console.log(e); }
    }

    async componentDidMount() {
        if (!wallet.hasListener('networkSelect')) {
            var em = new EventEmitter();

            em.on('connect', async () => {
                console.log('networkSelect.connect');
                await Navigation.toggleNetworkWarning();
            });

            em.on('disconnect', async () => {
                console.log('networkSelect.disconnect');
                await Navigation.toggleNetworkWarning();
            });

            em.on('accountsChanged', async (accounts) => {
                console.log('networkSelect.accountsChanged');
                await Navigation.toggleNetworkWarning();
            });

            em.on('chainChanged', async (chainId) => {
                console.log('networkSelect.chainChanged');
                this.closeNetworkSelectModal();
                await Navigation.toggleNetworkWarning();
            });

            wallet.addListener('networkSelect', em);
        }

        await Navigation.toggleNetworkWarning();
    }

    render() {
        return (
            <div>
                <div className="alert alert-warning no-round p-0" role="alert">
                    The Fundamenta web dApp is Beta software.
                </div>
                <div className="p-0 ps-3 pe-3">
                    <div>
                        <Navbar collapseOnSelect expand="md" className="navbar navbar-nav navbar-dark navbar-expand-md p-0">
                            <Navbar.Toggle className="w-100 round btn" />
                            <Navbar.Collapse>
                                <Nav>
                                    <LinkContainer to="/">
                                        <Nav.Link>Home</Nav.Link>
                                    </LinkContainer>

                                    <LinkContainer to="/staking">
                                        <Nav.Link>Staking</Nav.Link>
                                    </LinkContainer>

                                    <LinkContainer to="/mining">
                                        <Nav.Link>Mining</Nav.Link>
                                    </LinkContainer>

                                    <LinkContainer to="/teleport">
                                        <Nav.Link>Teleport</Nav.Link>
                                    </LinkContainer>

                                    <LinkContainer to="/wrap">
                                        <Nav.Link>Wrap</Nav.Link>
                                    </LinkContainer>

                                    <LinkContainer to="/unwrap">
                                        <Nav.Link>Unwrap</Nav.Link>
                                    </LinkContainer>

                                    <LinkContainer to="/energize">
                                        <Nav.Link>Energize</Nav.Link>
                                    </LinkContainer>

                                    <LinkContainer to="/nft">
                                        <Nav.Link>NFT!</Nav.Link>
                                    </LinkContainer>

                                    <button className="round btn btn-outline-success btn-sm ms-1 me-1" id="_btnS" onClick={this._btnS_clicked}>SWITCH NETWORK</button>
                                </Nav>
                            </Navbar.Collapse>

                        </Navbar>
                    </div>
                </div>
                <div className="p-0 ps-3 pe-3 pt-3">
                    <div id="_aAcc" className="d-none d-flex p-0">
                        <button id="_aAccText" className="flex-grow-1 round-left alert alert-success text-left text-truncate d-inline-block" />
                        <button className="round-right btn btn-alert btn-danger" id="_btnD" onClick={this._btnD_clicked} />
                    </div>
                    <div id="_aNoAcc" className="d-none d-flex p-0">
                        <button id="_aAccText" className="flex-grow-1 round-left alert alert-danger text-left">No account connected</button>
                        <button className="round-right btn btn-alert btn-success" id="_btnC" onClick={this._btnC_clicked}>Connect</button>
                    </div>

                    <div id="_aInvNet" className="d-none round alert alert-warning d-flex align-items-center">
                        <div id="_aInvNetText" className="text-truncate d-inline-block" />
                    </div>
                </div>


                <div className="modal fade" id="_modSelectProvider" tabIndex="-1" role="dialog" aria-hidden="true">
                    <div className="modal-dialog modal-dialog-centered" role="document">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title" id="exampleModalLongTitle">Select Wallet</h5>
                            </div>
                            <div className="modal-body">
                                <div>
                                    <button className="round btn btn-outline-info p-3 mb-3 w-100" onClick={this._wc_clicked}>
                                        Wallet Connect
                                    </button>
                                </div>
                                <div>
                                    <button className="round btn btn-outline-warning p-3 w-100" onClick={this._mm_clicked}>
                                        MetaMask
                                    </button>
                                </div>
                                <br />
                                <div>
                                    <h4 className="text-title">Note to Wallet Connect users:</h4>
                                    <div>
                                        Fundamenta is a multi-chain system. Your ability to use this dapp may be impacted if your wallet does not
                                        support network switching.
                                    </div>
                                    <br />
                                    <div>
                                        For the best experience it is recommended to use the Fundamenta mobile wallet, available for iOS and Android.
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="round btn btn-danger" onClick={this._btnE_clicked}>Exit</button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="modal fade" id="_modSelectNetwork" tabIndex="-1" role="dialog" aria-hidden="true">
                    <div className="modal-dialog modal-dialog-centered" role="document">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title" id="exampleModalLongTitle">Select Network</h5>
                            </div>
                            <div id="mainnetSwitch" className="modal-body">
                                <button id="_btnEth" className="round btn btn-outline-secondary p-3 mb-3 w-100"
                                    onClick={async () => {
                                        $("#_btnEth").text('Sending request...');
                                        await wallet.switchNetwork(1);
                                    }}>Ethereum</button>

                                <button id="_btnBsc" className="round btn btn-outline-secondary p-3 mb-3 w-100"
                                    onClick={async () => {
                                        $("#_btnBsc").text('Sending request...');
                                        await wallet.addMetamaskChain(56);
                                        await wallet.switchNetwork(56);
                                    }}>Binance Smart Chain</button>

                                <button id="_btnPoly" className="round btn btn-outline-secondary p-3 mb-3 w-100"
                                    onClick={async () => {
                                        $("#_btnPoly").text('Sending request...');
                                        await wallet.addMetamaskChain(137);
                                        await wallet.switchNetwork(137);
                                    }}>Polygon</button>

                                <button id="_btnAvax" className="round btn btn-outline-secondary p-3 mb-3 w-100"
                                    onClick={async () => {
                                        $("#_btnAvax").text('Sending request...');
                                        await wallet.addMetamaskChain(43114);
                                        await wallet.switchNetwork(43114);
                                    }}>Avalanche</button>

                                <button id="_btnXdai" className="round btn btn-outline-secondary p-3 mb-3 w-100"
                                    onClick={async () => {
                                        $("#_btnXdai").text('Sending request...');
                                        await wallet.addMetamaskChain(100);
                                        await wallet.switchNetwork(100);
                                    }}>Gnosis Chain</button>

                                <button id="_btnFtm" className="round btn btn-outline-secondary p-3 mb-3 w-100"
                                    onClick={async () => {
                                        $("#_btnFtm").text('Sending request...');
                                        await wallet.addMetamaskChain(250);
                                        await wallet.switchNetwork(250);
                                    }}>Fantom</button>

                                <button id="_btnCro" className="round btn btn-outline-secondary p-3 mb-3 w-100"
                                    onClick={async () => {
                                        $("#_btnCro").text('Sending request...');
                                        await wallet.addMetamaskChain(25);
                                        await wallet.switchNetwork(25);
                                    }}>Cronos</button>
                                <br />
                            </div>
                            <div id="testnetSwitch" className="modal-body">
                                <button id="_btnRinkeby" className="round btn btn-outline-secondary p-3 mb-3 w-100"
                                    onClick={async () => {
                                        $("#_btnRinkeby").text('Sending request...');
                                        await wallet.switchNetwork(4);
                                    }}>Rinkeby</button>

                                <button id="_btnGoerli" className="round btn btn-outline-secondary p-3 mb-3 w-100"
                                    onClick={async () => {
                                        $("#_btnGoerli").text('Sending request...');
                                        await wallet.switchNetwork(5);
                                    }}>Goerli</button>

                                <button id="_btnMumbai" className="round btn btn-outline-secondary p-3 mb-3 w-100"
                                    onClick={async () => {
                                        $("#_btnMumbai").text('Sending request...');
                                        await wallet.addMetamaskChain(80001);
                                        await wallet.switchNetwork(80001);
                                    }}>Mumbai</button>
                                <br />
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="round btn btn-danger" onClick={this._btnE_clicked}>Exit</button>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        )
    }
}
