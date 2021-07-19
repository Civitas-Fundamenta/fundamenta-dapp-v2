import React from 'react';

import { NetworkSelect as ns } from '../components/NetworkSelect'

export default class Home extends React.Component {
    async componentDidMount() {
        ns.populateAll();      
    }

    render() {
        return(
            <div className="ps-3 pe-3" />
        )
    }
}