import React from 'react';
import EventEmitter from 'events';

import { WalletProvider as wallet } from '../js/walletProvider'

import { NetworkSelect as ns } from '../components/NetworkSelect'

export default class Mining extends React.Component {
    async componentDidMount() {
        if (!wallet.hasListener('mining')) {
            console.log("Registering home component wallet listeners");
            var em = new EventEmitter();

            em.on('connect', () => {
                ns.toggleNetworkWarning();
            });

            em.on('disconnect', () => {
                ns.toggleNetworkWarning();
            });

            em.on('accountsChanged', async () => {
                ns.toggleNetworkWarning();
            });

            em.on('chainChanged', async () => {
                ns.toggleNetworkWarning();
            });

            wallet.addListener('mining', em);
        }

        ns.populateAll();
        ns.toggleNetworkWarning();
    }

    componentWillUnmount() {
        wallet.removeListener('mining');
    }

    render() {
        return(
            <div className="ps-3 pe-3">Reserved for mining page</div>
        )
    }
}