import React from 'react';
import { Route, Switch } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Navigation } from './components/Navigation';
import EventEmitter from 'events';

import { Config as config } from './js/config'
import { WalletProvider as wallet } from './js/walletProvider'

import Home from './pages/Home'
import Staking from './pages/Staking'
import Mining from './pages/Mining'
import Teleport from './pages/Teleport'
import Wrap from './pages/Wrap'
import Unwrap from './pages/Unwrap'
import Energize from './pages/Energize'
import NFT from './pages/NFT'

import './App.css';
import './themes/lux.bootstrap.css';
import './themes/lux.bootstrap.overrides.css';

class App extends React.Component {
    constructor() {
        super();
        this.em = new EventEmitter();
        this.em.on('update', async () => {
            console.log("app.update");
            await this.update();
        });
    }
    
    async update() {
        await config.fetchNetworkConfig();
        var provider = localStorage.getItem('provider');

        if (provider === 'walletConnect')
            await wallet.walletConnect();
        else if (provider === 'metamask')
        {
            if (wallet.isMetamaskAvailable())
                await wallet.metamask();
            else
                localStorage.setItem('provider', 'none');
        }
        else
            console.log('No existing wallet provider');

        await Navigation.toggleNetworkWarning();
    }

    render() {
        this.em.emit('update');
        return (
            <div className="App">
                <Navigation id="conn"/>
                <Switch>
                    <Route exact path="/" component={Home} />
                    <Route path="/staking" component={Staking} />
                    <Route path="/mining" component={Mining} />
                    <Route path="/teleport" component={Teleport} />
                    <Route path="/wrap" component={Wrap} />
                    <Route path="/unwrap" component={Unwrap} />
                    <Route path="/energize" component={Energize} />
                    <Route path="/nft" component={NFT} />
                </Switch>
            </div>
        )
    }
}

export default App;