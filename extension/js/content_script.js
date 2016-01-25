'use strict';

let injected = false;

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {

    let countVisibleInputs = (inputs) => {
            var visibleInputs = 0;
            for (var j = 0; j < inputs.length; j++) {
                if (inputs[j].type.toLowerCase() === 'email' || inputs[j].type.toLowerCase() === 'text') {
                    visibleInputs++;
                }
            }
            return visibleInputs == 1;
        },

        hasOnePasswordInput = (inputs) => {
            var passwordInputsNo = 0;
            for (var j = 0; j < inputs.length; j++) {
                if (inputs[j].type.toLowerCase() === 'password') {
                    passwordInputsNo++;
                }
            }
            return passwordInputsNo == 1
        },

        hasSubmitElement = (form) => {
            var allChildElements = form.getElementsByTagName('*'),
                submitElement = 0;
            for (var j = 0; j < allChildElements.length; j++) {
                if (typeof(allChildElements[j].type) !== 'undefined') {
                    if (allChildElements[j].type.toLowerCase() === 'submit') {
                        submitElement++;
                    }
                }
            }
            return submitElement > 0;
        },

        getSubmitElement = (form) => {
            var allChildElements = form.getElementsByTagName('*'),
                submitElement = 0;
            for (var j = 0; j < allChildElements.length; j++) {
                if (typeof(allChildElements[j].type) !== 'undefined') {
                    if (allChildElements[j].type.toLowerCase() === 'submit') {
                        submitElement++;
                    }
                }
            }
            return submitElement;
        },

        getLoginForm = () => {
            var tempFormArr = document.getElementsByTagName('FORM'),
                loginFormsArrs = [];
            for (var i = 0; i < tempFormArr.length; i++) {
                var inputs = tempFormArr[i].getElementsByTagName('input'),
                    visibleInputs = countVisibleInputs(inputs),
                    hasPwdInput = hasOnePasswordInput(inputs),
                    hasSubmit = hasSubmitElement(tempFormArr[i]);
                if (hasPwdInput && hasSubmit && visibleInputs) {
                    loginFormsArrs.push(tempFormArr[i]);
                }
            }
            return loginFormsArrs;
        },


        setInputValues = (content) => {
            var loginForms = getLoginForm();
            for (var i = 0; i < loginForms.length; i++) {
                var inputs = loginForms[i].getElementsByTagName('input');
                for (var j = 0; j < inputs.length; j++) {
                    switch (inputs[j].type.toLowerCase()) {
                        case 'email':
                            inputs[j].value = content.username;
                            break;
                        case 'text':
                            inputs[j].value = content.username;
                            break;
                        case 'password':
                            inputs[j].value = content.password;
                            inputs[j].focus();
                            break;
                    }
                }
            }

        },

        proceedInjection = () => {
            if (!injected) {
                injected = true;
                setInputValues(request.content);
            }
        };

    switch (request.type) {
        case 'fillData':
            if (document.addEventListener) {
                document.addEventListener("DOMContentLoaded", proceedInjection, false);
                window.addEventListener("load", proceedInjection, false);
            }
            break;

        case 'isScriptExecuted':
            sendResponse({type: 'scriptReady'});
            break;

        default:
            console.warn('Unknown msg ', request, sender);
    }
    return true;
});