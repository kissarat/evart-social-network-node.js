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

    var peerConstrains = {
        optional: [
            //{RtpDataChannels: true},
            {DtlsSrtpKeyAgreement: true}
        ]
    };

    function Peer(params) {
        this.connection = new RTCPeerConnection(iceServerConfig, peerConstrains);
        var self = this;
        var c = this.connection;
        if (params) {
            this.init(params);
        }
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
                    self.send(candidate);
                }
                else {
                    console.error('send candidate: peer is not initialized');
                }
            }
        });
    }

    Peer.prototype = {
        init: function (params) {
            this.params = extract(params, ['chat_id', 'target_id']);
        },

        send: function (message) {
            return server.send(merge(this.params, message));
        },

        offer: function (options) {
            var self = this;
            return new Promise(function (resolve, reject) {
                self.connection.createOffer(options).then(function (offer) {
                    self.connection.setLocalDescription(offer).then(function () {
                        self.send(offer.toJSON()).then(resolve, reject);
                    }, reject);
                }, reject);
            });
        },

        answer: function (offer, options) {
            var self = this;
            return new Promise(function (resolve, reject) {
                offer = new RTCSessionDescription({type: 'offer', sdp: 'string' == typeof offer ? offer : offer.sdp});
                self.connection.setRemoteDescription(offer).then(function () {
                    self.connection.createAnswer(options).then(function (answer) {
                        self.connection.setLocalDescription(answer).then(function () {
                            self.send(answer.toJSON()).then(resolve, reject);
                        }, reject)
                    }, reject);
                }, reject);
            });
        },

        success: function(options) {
            if (camera) {
                this.connection.addStream(camera);
            }
            if (this.isRespondent) {
                this.offer(options);
            }
            else {
                this.send({type: 'call'});
            }
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
                var peer = Peer.create(message.source_id);
                var candidate = new RTCIceCandidate(message.candidate);
                peer.connection.addIceCandidate(candidate);
            },

            offer: function (offer) {
                var peer = Peer.create(offer.source_id);
                if (camera && isBroadcasting) {
                    peer.connection.addStream(camera);
                }
                peer.answer(offer, Peer.offerConstraints(true, true));
            },

            answer: function (answer) {
                var peer = peers[answer.source_id];
                if (peer) {
                    var description = new RTCSessionDescription(answer);
                    peer.connection.setRemoteDescription(description).then(_debug, _error);
                }
                else {
                    console.error('answer: peer not found');
                }
            },

            call: function (params) {
                var peer = Peer.create(params.source_id);
                peer.isRespondent = true;
                new Notify(merge(peer.params, {
                    type: 'message',
                    title: 'Call',
                    text: 'Call'
                }));
            }
        });
    });

    Peer.create = function (params) {
        if ('string' == typeof params) {
            params = {target_id: params};
        }
        var peer = peers[params.target_id];
        if (!peer) {
            peer = new Peer(params);
            peers[params.target_id] = peer;
        }
        return peer;
    };

    Peer.offerConstraints = function (audio, video) {
        audio = !!audio;
        video = !!video;
        return isFirefox
            ? {offerToReceiveAudio: audio, offerToReceiveVideo: video}
            : {mandatory: {OfferToReceiveAudio: audio, OfferToReceiveVideo: video}};
    };

    window.Peer = Peer;
})();

var peers = {};
var camera;
