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
        this.candidates = [];
        this.connection = new RTCPeerConnection(iceServerConfig);
        var self = this;
        var c = this.connection;
        c.addEventListener('iceconnectionstatechange', function (e) {
            if (self.isClosed()) {
                self.connection = null;
            }
        });
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
                    self.candidates.push(candidate);
                }
            }
        });
    }

    Peer.prototype = {
        init: function (params) {
            this.params = extract(params, ['chat_id', 'target_id']);
            var self = this;
            if (camera) {
                this.connection.addStream(camera);
            }
            else {
                console.warn('No camera');
            }
            if (DEBUG && this.candidates.length > 0) {
                _debug('Candidates: ' + this.candidates.length);
            }
            this.candidates.forEach(function (candidate) {
                server.send(merge(self.params, candidate));
            });
            this.candidates = [];
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
                            if (self.params) {
                                var message = merge(self.params, answer.toJSON());
                                server.send(message).then(resolve, reject);
                            }
                            else {
                                self.expectant = answer.toJSON();
                                resolve(self.expectant);
                            }
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
                if (!phone) {
                    phone = new Peer();
                }
                phone.connection.addIceCandidate(candidate);
            },

            offer: function (offer) {
                if (!phone) {
                    phone = new Peer();
                }
                phone.answer({type: 'offer', sdp: offer.sdp});
                new Notify(merge(phone.params, {
                    type: 'message',
                    title: 'Call',
                    text: 'Call'
                }));
            },

            answer: function (answer) {
                if (phone) {
                    var description = new RTCSessionDescription({type: 'answer', sdp: answer.sdp});
                    phone.connection.setRemoteDescription(description, morozov, morozov);
                }
                else {
                    console.error('Phone is not initialized');
                }
            },

            //call: function(params) {
            //    phone = new Peer();
            //    phone.init(params);
            //}
        });
    });

    Peer.create = function (params) {
        if (!phone) {
            phone = new Peer();
        }
        phone.init(params);
        if (phone.expectant) {
            server.send(merge(params, phone.expectant));
        }
        else {
            phone.offer();
        }
        return phone;
    };

    window.Peer = Peer;
})();

var phone;
var camera;
