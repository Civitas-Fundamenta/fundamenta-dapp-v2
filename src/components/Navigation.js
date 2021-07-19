import React from 'react';
import { Navbar, Nav } from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap'
import { NetworkSelectComponent } from './NetworkSelect'

export class Navigation extends React.Component {
    render() {
        return (
            <div>
                <div className="alert alert-warning p-0" role="alert">
                    The CiviPort Web Teleporter is Beta software.
                </div>
                <div className="d-flex p-0 ps-3 pe-3">
                    <div className="w-100 justify-content-start">
                        <Navbar collapseOnSelect expand="md" className="navbar navbar-expand-md p-0">
                            <Navbar.Toggle />
                            <Navbar.Collapse>
                                <Nav>
                                    <LinkContainer to="/staking">
                                        <Nav.Link className="ps-0">Staking</Nav.Link>
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
                                </Nav>
                            </Navbar.Collapse>
                        </Navbar>
                    </div>
                    <div className="justify-content-end">
                        <NetworkSelectComponent />
                    </div>
                </div>
                <div className="p-0 ps-3 pe-3 pt-3">
                    <div id="_aAcc" className="popup-div-margins alert alert-success d-flex align-items-center input-group" role="alert">
                        <div id="_aAccText" className="text-truncate d-inline-block" />
                    </div>
                    <div id="_aNoAcc" className="popup-div-margins alert alert-danger d-flex align-items-center input-group" role="alert">
                        <div className="text-truncate d-inline-block">
                            No account connected.
                        </div>
                    </div>
                    <div id="_aInvNet" className="popup-div-margins alert alert-warning d-flex align-items-center input-group" role="alert">
                        <div id="_aInvNetText" className="text-truncate d-inline-block" />
                    </div>
                </div>
            </div>
        )
    }
}
