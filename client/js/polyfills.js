"use strict";

if (!('classList' in Element.prototype)) {
    Object.defineProperty(Element.prototype, 'classList', {
        get: function () {
            var self = this;
            return {
                add: function (name) {
                    self.setAttribute('class', self.getAttribute('class') + ' ' + name);
                },

                contains: function (name) {
                    return self.getAttribute('class').indexOf(name) >= 0;
                },

                remove: function (name) {
                    self.setAttribute('class', self.getAttribute('class').replace(name, ''));
                }
            }
        }
    })
}

window.webkit = !!window.webkitRTCPeerConnection;

if (!('requestFullscreen' in Element.prototype)) {
    Element.prototype.requestFullscreen =
        Element.prototype.webkitRequestFullScreen || Element.prototype.mozRequestFullScreen;
}


if (!navigator.mediaDevices.getUserMedia && navigator.webkitGetUserMedia) {
    navigator.mediaDevices.getUserMedia = function (options) {
        return new Promise(function (resolve, reject) {
            navigator.webkitGetUserMedia(options, resolve, reject);
        });
    }
}

if (!window.RTCPeerConnection && window.webkitRTCPeerConnection) {
    window.RTCPeerConnection = window.webkitRTCPeerConnection;
    (function () {
        var webkitCreateOffer = this.createOffer;
        this.createOffer = function (options) {
            var self = this;
            return new Promise(function (resolve, reject) {
                webkitCreateOffer.call(self, resolve, reject, options);
            });
        };

        var webkitCreateAnswer = this.createAnswer;
        this.createAnswer = function (offer) {
            var self = this;
            return new Promise(function (resolve, reject) {
                webkitCreateAnswer.call(self, resolve, reject, offer);
            });
        }
    }).call(RTCPeerConnection.prototype);
}

