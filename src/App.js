import React from 'react';
import { Route, Switch } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import { ConnectBanner } from './components/ConnectBanner'
import Navigation from './components/Navigation';

import Staking from './pages/Staking'
import Mining from './pages/Mining'
import Teleport from './pages/Teleport'
import Wrap from './pages/Wrap'
import Unwrap from './pages/Unwrap'
import Energize from './pages/Energize'

class App extends React.Component {
    render() {
        return (
            <div className="App main">
                <Navigation />
                <ConnectBanner />
                <Switch>
                    <Route exact path="/staking" component={Staking} />
                    <Route exact path="/mining" component={Mining} />
                    <Route exact path="/teleport" component={Teleport} />
                    <Route exact path="/wrap" component={Wrap} />
                    <Route exact path="/unwrap" component={Unwrap} />
                    <Route exact path="/energize" component={Energize} />
                </Switch>
            </div>
        )
    }
}

export default App;