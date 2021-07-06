import React from 'react';
import { Modal, Button } from 'react-bootstrap';
import { show, hide } from '../js/ui';
import { WalletProvider as wallet } from '../js/walletProvider'
import EventEmitter from 'events';
import $ from 'jquery'

export class ConnectButton extends React.Component {
    state = {
        isOpen: false
    };

    openModal = () => this.setState({ isOpen: true });
    closeModal = () => this.setState({ isOpen: false });

    connect_Clicked = async () => {
        if (wallet.isMetamaskAvailable()) {
            console.log("Metamask is available. Displaying modal");
            this.openModal();
        }
        else {
            console.log("Metamask not available. Defaulting to Wallet Connect");
            var connected = await wallet.walletConnect();
            if (connected) {
                hide("#btnConnect");
                show("#btnDisconnect");
            }
            else {
                hide("#btnDisconnect");
                show("#btnConnect");
            }
        }
    }

    disconnect_Clicked = async () => {
        await wallet.disconnect();
    }

    handleClose = () => {
        this.closeModal();
    }

    walletConnect_Click = async () => {
        this.closeModal();
        var connected = await wallet.walletConnect();
        if (connected) {
            hide("#btnConnect");
            show("#btnDisconnect");
        }
        else {
            hide("#btnDisconnect");
            show("#btnConnect");
        }
    }

    metamask_Click = async () => {
        this.closeModal();
        var connected = await wallet.metamask();
        if (connected) {
            hide("#btnConnect");
            show("#btnDisconnect");
        }
        else {
            hide("#btnDisconnect");
            show("#btnConnect");
        }
    }

    async componentDidMount() {
        if (!wallet.hasListener('button')) {
            console.log("Registering button component wallet listeners");
            var em = new EventEmitter();
            em.on('connect', (connectInfo) => {
                hide("#btnConnect");
                show("#btnDisconnect");
            });

            em.on('disconnect', (disconnectInfo) => {
                hide("#btnDisconnect");
                show("#btnConnect");
            });

            em.on('accountsChanged', (accounts) => {
                if (accounts.length === 0) {
                    hide("#btnDisconnect");
                    show("#btnConnect");
                }
                else {
                    hide("#btnConnect");
                    show("#btnDisconnect");
                }
            });

            em.on('chainChanged', (chainId) => {
                $("#btnDisconnect").text(wallet.getNetworkName());
            });

            wallet.addListener('button', em);
        }

        if (wallet.isConnected()) {
            hide("#btnConnect");
            show("#btnDisconnect");
        }
        else {
            hide("#btnDisconnect");
            show("#btnConnect");
        }
    }

    render() {
        return (
            <div>
                <Button variant="outline-success" id="btnConnect" onClick={this.connect_Clicked}>Connect</Button>
                <Button variant="outline-danger" id="btnDisconnect" onClick={this.disconnect_Clicked}>Disconnect</Button>
                <Modal show={this.state.isOpen} animation={false} backdrop="static" onHide={this.handleClose}>
                    <Modal.Header>
                        <Modal.Title>Select Wallet</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <div>
                            <Button variant="outline-primary" onClick={this.walletConnect_Click} className="p-3 mb-3 w-100">
                                Wallet Connect
                            </Button>
                        </div>
                        <div>
                            <Button variant="outline-warning" onClick={this.metamask_Click} className="p-3 w-100">
                                MetaMask
                            </Button>
                        </div>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="danger" onClick={this.handleClose}>
                            Exit
                        </Button>
                    </Modal.Footer>
                </Modal>
            </div>
        )
    }
}
