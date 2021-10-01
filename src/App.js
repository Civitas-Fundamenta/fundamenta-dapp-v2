import React from 'react';
import { Route, Switch } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Navigation } from './components/Navigation';

import Home from './pages/Home'
import Staking from './pages/Staking'
import Mining from './pages/Mining'
import Teleport from './pages/Teleport'
import Wrap from './pages/Wrap'
import Unwrap from './pages/Unwrap'
import Energize from './pages/Energize'

import './App.css';
import './themes/lux.bootstrap.css';
import './themes/lux.bootstrap.overrides.css';

class App extends React.Component {

    render() {
        return (
            <div className="App">
                <Navigation />
                <Switch>
                    <Route exact path="/" component={Home} />
                    <Route path="/staking" component={Staking} />
                    <Route path="/mining" component={Mining} />
                    <Route path="/teleport" component={Teleport} />
                    <Route path="/wrap" component={Wrap} />
                    <Route path="/unwrap" component={Unwrap} />
                    <Route path="/energize" component={Energize} />
                </Switch>
            </div>
        )
    }
}

export default App;