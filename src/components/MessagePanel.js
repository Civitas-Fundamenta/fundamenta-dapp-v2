import React from 'react';
import { show, hide } from '../js/ui';

import $ from 'jquery';

export class MessagePanel
{
    static clear() {
        hide("#okAlert");
        hide("#warnAlert");
        hide("#errorAlert");
    }
    
    static showOk(text) {
        $("#okAlertText").text(text);
        show("#okAlert");
    }
    
    static showWarn(text) {
        $("#warnAlertText").text(text);
        show("#warnAlert");
    }
    
    static showError(text) {
        $("#errorAlertText").text(text);
        show("#errorAlert");
    }
}

export class MessagePanelComponent extends React.Component {

    render() {
        return (
            <div className="mt-3">
                <div id="okAlert">
                    <div className="popup-div-margins alert alert-success d-flex align-items-center" role="alert">
                        <div id="okAlertText" className="text-truncate d-inline-block"></div>
                    </div>
                </div>
                <div id="warnAlert">
                    <div className="popup-div-margins alert alert-warning d-flex align-items-center" role="alert">
                        <div id="warnAlertText" className="text-truncate d-inline-block"></div>
                    </div>
                </div>
                <div id="errorAlert">
                    <div className="popup-div-margins alert alert-danger d-flex align-items-center" role="alert">
                        <div id="errorAlertText" className="text-truncate d-inline-block"></div>
                    </div>
                </div>
            </div>
        )
    }
}