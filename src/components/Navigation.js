import React from 'react';
import { Navbar, Nav } from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap'
import { ConnectButton } from './ConnectButton'

import logo from '../logo.svg';

class Navigation extends React.Component {
    
    render() {
        return (
            <div>
                <div className="alert alert-warning" role="alert">
                    The CiviPort Web Teleporter is Beta software.
                </div>
                <Navbar collapseOnSelect expand="sm" className="navbar navbar-expand-sm p-3">
                    <Navbar.Toggle aria-controls="basic-navbar-nav" />
                    <Navbar.Brand>
                        <img src={logo}
                            alt="CF Logo"
                            width="30"
                            height="30"
                            className="d-inline-block align-top" />
                    </Navbar.Brand>
                    <Navbar.Collapse>
                        <Nav className="mr-auto">
                            <LinkContainer to="/staking">
                                <Nav.Link>
                                    Staking
                                </Nav.Link>
                            </LinkContainer>

                            <LinkContainer to="/mining">
                                <Nav.Link>
                                    Mining
                                </Nav.Link>
                            </LinkContainer>

                            <LinkContainer to="/teleport">
                                <Nav.Link>
                                    Teleport
                                </Nav.Link>
                            </LinkContainer>

                            <LinkContainer to="/wrap">
                                <Nav.Link>
                                    Wrap
                                </Nav.Link>
                            </LinkContainer>

                            <LinkContainer to="/unwrap">
                                <Nav.Link>
                                    Unwrap
                                </Nav.Link>
                            </LinkContainer>

                            <LinkContainer to="/energize">
                                <Nav.Link>
                                    Energize
                                </Nav.Link>
                            </LinkContainer>
                        </Nav>
                    </Navbar.Collapse>
                    <ConnectButton />
                </Navbar>
            </div>
        )
    }
}

export default Navigation;