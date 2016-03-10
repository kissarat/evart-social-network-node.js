"use strict";

(function () {
    if (!window.RTCPeerConnection) {
        return console.warn('Peer connection is not supported');
    }

    var iceServerConfig = {
        iceServers: [
            {
                urls: ['turn:game-of-business.com:3478'],
                credential: 'one',
                username: 'one'
            },
            {
                urls: [
                    'stun:stun.l.google.com:19302',
                    'stun:stun2.l.google.com:19302',
                    'stun:stun3.l.google.com:19302',
                    'stun:stun.services.mozilla.com'
                ]
            }
        ]
    };

    function Peer() {
        this.connection = new RTCPeerConnection(iceServerConfig);
        var self = this;
        var c = this.connection;
        if (DEBUG) {
            c.addEventListener('identityresult', _debug);
            c.addEventListener('idpassertionerror', _error);
            c.addEventListener('idpvalidationerror', _error);
            c.addEventListener('negotiationneeded', _debug);
            c.addEventListener('peeridentity', _debug);
            c.addEventListener('iceconnectionstatechange', function (e) {
                console.log('# connection: ' + e.target.iceConnectionState);
            });
            c.addEventListener('signalingstatechange', function (e) {
                console.log('# singnal: ' + e.target.signalingState);
            });
        }

        c.addEventListener('icecandidate', function (e) {
            if (e.candidate) {
                var candidate = {
                    type: 'candidate',
                    candidate: e.candidate
                };
                if (self.params) {
                    server.send(merge(self.params, candidate));
                }
                else {
                    console.error('send candidate: Phone is not initialized');
                }
            }
        });
    }

    Peer.prototype = {
        init: function (params) {
            this.params = extract(params, ['chat_id', 'target_id']);
        },

        offer: function (options) {
            var self = this;
            return new Promise(function (resolve, reject) {
                self.connection.createOffer(function (offer) {
                    self.connection.setLocalDescription(offer, function () {
                        var message = merge(self.params, offer.toJSON());
                        server.send(message).then(resolve, reject);
                    }, reject);
                }, reject, options);
            });
        },

        answer: function (offer) {
            var peer = this.connection;
            var self = this;
            return new Promise(function (resolve, reject) {
                offer = new RTCSessionDescription({type: 'offer', sdp: offer.sdp});
                peer.setRemoteDescription(offer).then(function () {
                    var options = {offerToReceiveAudio: true, offerToReceiveVideo: true};

                    function setLocalDescription(answer) {
                        peer.setLocalDescription(answer, function () {
                            var message = merge(self.params, answer.toJSON());
                            server.send(message).then(resolve, reject);
                        }, reject)
                    }

                    if (isFirefox) {
                        peer.createAnswer(options).then(setLocalDescription);
                    }
                    else {
                        peer.createAnswer().then(setLocalDescription);
                    }
                }, reject);
            });
        },

        reconnect: function () {
            this.connection.close();
            this.connection = null;
            Peer.call(this, this.params)
        },

        isClosed: function () {
            return ['closed', 'disconnected', 'failed'].indexOf(this.connection.iceConnectionState) >= 0;
        },

        isCompleted: function () {
            return ['completed', 'closed', 'disconnected', 'failed'].indexOf(this.connection.iceConnectionState) >= 0;
        },

        trace: function () {
            return {
                connection: this.connection.iceConnectionState,
                signal: this.connection.signalingState,
                streams: this.connection.getRemoteStreams()
            }
        }
    };

    extend(Peer, EventEmitter);

    addEventListener('load', function () {
        server.register({
            candidate: function (message) {
                var candidate = new RTCIceCandidate(message.candidate);
                if (phone) {
                    phone.connection.addIceCandidate(candidate);
                }
                else {
                    console.error('candidate: Phone is not initialized');
                }
            },

            offer: function (offer) {
                if (phone) {
                    phone.answer({type: 'offer', sdp: offer.sdp});
                }
                else {
                    console.error('offer: Phone is not initialized');
                }
            },

            answer: function (answer) {
                if (phone) {
                    var description = new RTCSessionDescription({type: 'answer', sdp: answer.sdp});
                    phone.connection.setRemoteDescription(description).then(_debug, _error);
                }
                else {
                    console.error('answer: Phone is not initialized');
                }
            },

            call: function (params) {
                phone = new Peer();
                phone.init({target_id: params.source_id});
                new Notify(merge(phone.params, {
                    type: 'message',
                    title: 'Call',
                    text: 'Call'
                }));
            }
        });
    });

    Peer.create = function (params) {
        if (phone) {
            if (phone.params) {
                if (camera) {
                    phone.connection.addStream(camera);
                }
                else {
                    console.warn('No camera');
                }
                phone.offer();
            }
            else {
                console.error('call: Phone is not initialized');
            }
        }
        else {
            phone = new Peer();
            phone.init(params);
            if (camera) {
                phone.connection.addStream(camera);
            }
            else {
                console.warn('No camera');
            }
            server.send(merge(extract(params, ['chat_id', 'target_id']), {
                type: 'call'
            }));
        }
        return phone;
    };

    window.Peer = Peer;
})();

var phone;
var camera;
