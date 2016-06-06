"use strict";
App.module('Peer', function (Peer, App) {
    Peer.Router = Marionette.AppRouter.extend({
        appRoutes: {
            'phone/:id': 'phone'
        }
    });

    Peer.Model = Backbone.Model.extend({
        initialize: function (attributes, options) {
            var rtc = new RTCPeerConnection(App.config.peer, {
                optional: [{DtlsSrtpKeyAgreement: true}, {RtpDataChannels: true}]
            });
            this.candidates = [];
            if (DEV) {
                register(rtc, {
                    identityresult: App.debug.trace,
                    idpassertionerror: App.debug.error,
                    idpvalidationerror: App.debug.error,
                    // negotiationneeded: App.debug.trace,
                    peeridentity: App.debug.trace,
                    iceconnectionstatechange: function (e) {
                        App.debug.trace('CONNECTION: ' + e.target.iceConnectionState);
                    },
                    signalingstatechange: function (e) {
                        App.debug.trace('SIGNAL: ' + e.target.signalingState);
                    }
                });
            }
            for (var name in this) {
                var method = this[name];
                if (0 === name.indexOf('on')) {
                    rtc.addEventListener(name.replace(/^on/, '').toLowerCase(), method.bind(this));
                }
            }
            this.connection = rtc;
        },

        initializeDataChannel: function (channel) {
            this.channel = channel;
            register(channel, {
                open: function () {
                    App.debug.trace('OPEN CHANNEL');
                },
                message: function (e) {
                    App.debug.trace('CHANNEL MESSAGE', e.data);
                },
                close: function () {
                    App.debug.trace('CLOSE CHANNEL');
                }
            });
        },

        addCandidates: function () {
            var candidate = this.candidates.shift();
            if (candidate) {
                this.connection.addIceCandidate(candidate);
                this.addCandidates();
            }
        },

        onSignalingStateChange: function (e) {
            if ('have-remote-offer' === e.target.signalingState) {
                this.addCandidates();
            }
            this.trigger('signal', e);
        },

        onIceConnectionStateChange: function (e) {
            this.trigger('connection', e);
        },

        onIceCandidate: function (e) {
            if (e.candidate) {
                this.pushMessage({
                    type: 'candidate',
                    candidate: e.candidate
                });
            }
            // else {
            //     App.debug.error('No candidate');
            // }
        },

        onAddStream: function (e) {
            this.set('stream', e.stream);
            // TODO
            // setTimeout(function () {
            document.querySelector('#modal video').srcObject = e.stream;
            // }, 3000);
            this.trigger('addstream', e.stream);
        },

        trace: function () {
            return {
                connection: this.connection.iceConnectionState,
                signal: this.connection.signalingState,
                streams: this.connection.getRemoteStreams()
            };
        },

        isClosed: function () {
            return ['closed', 'disconnected', 'failed'].indexOf(this.connection.iceConnectionState) >= 0;
        },

        isCompleted: function () {
            return this.isClosed && 'completed' === this.connection.iceConnectionState;
        },

        pushMessage: function (o) {
            o.target_id = this.get('target_id');
            App.push(o);
        },

        offer: function (options) {
            var self = this;
            if (!options) {
                options = Peer.Model.makeMediaConstraints(true, true);
            }
            return new Promise(function (resolve, reject) {
                self.connection.createOffer(options).catch(reject).then(function (offer) {
                    self.connection.setLocalDescription(offer).catch(reject);
                    resolve(offer);
                });
            })

        },

        offerCall: function (audio, video) {
            var self = this;
            if (audio == null) {
                audio = true;
            }
            if (video == null) {
                video = true;
            }
            this.getCamera({audio: audio, video: video}).then(function () {
                self.offer(Peer.Model.makeMediaConstraints(audio, video)).then(function (offer) {
                    self.pushMessage({
                        type: 'offer',
                        sdp: offer.sdp
                    });
                })
            });
        },

        answer: function (offer, options) {
            var self = this;
            if (offer instanceof RTCSessionDescription) {
                offer = new RTCSessionDescription({
                    type: 'offer',
                    sdp: 'string' === typeof offer ? offer : offer.sdp
                });
            }
            return this.connection.setRemoteDescription(offer).then(function () {
                self.addCandidates();
                return self.connection.createAnswer(options).then(function (answer) {
                    return self.connection.setLocalDescription(answer).then(function () {
                        return answer;
                    });
                });
            });
        },

        answerCall: function (audio, video) {
            var self = this;
            if (audio == null) {
                audio = true;
            }
            if (video == null) {
                video = true;
            }
            this.getCamera({
                audio: audio,
                video: video
            }).then(function () {
                return self.answer(self.get('offer'), Peer.Model.makeMediaConstraints(true, true));
            }).then(function (answer) {
                self.trigger('answer', answer);
                self.pushMessage({
                    type: 'answer',
                    sdp: answer.sdp
                });
            });
        },

        receiveCall: function (offer) {
            offer = new RTCSessionDescription({
                type: 'offer',
                sdp: offer.sdp
            });
            this.set('offer', offer);
            this.trigger('offer', this, offer);
        },

        getCamera: function (options) {
            var self = this;
            return new Promise(function (resolve, reject) {
                if (App.camera) {
                    self.connection.addStream(App.camera);
                    resolve(App.camera);
                } else {
                    navigator.mediaDevices.getUserMedia(options).catch(reject).then(function (camera) {
                        App.camera = camera;
                        self.connection.addStream(camera);
                        resolve(camera);
                    })
                }
            });
        },

        trigger: function (name, e) {
            return App.trigger('peer:' + name, this, e);
        }

    }, {
        // STATIC
        makeMediaConstraints: function (audio, video) {
            audio = !!audio;
            video = !!video;
            return isFirefox
                ? {
                offerToReceiveAudio: audio,
                offerToReceiveVideo: video
            }
                : {
                mandatory: {
                    OfferToReceiveAudio: audio,
                    OfferToReceiveVideo: video
                }
            }
        }
    });

    Peer.peers = {};
    Peer.find = function (target_id) {
        if (App.features.peer.enabled) {
            if (!Peer.peers[target_id]) {
                Peer.peers[target_id] = new Peer.Model({
                    target_id: target_id
                });
            }
            return Peer.peers[target_id];
        }
    };

    App.on('login', function () {
        return react(App, (function (message) {
            return Peer.find(message.source_id);
        }), {
            candidate: function (message) {
                var candidate = new RTCIceCandidate(message.candidate);
                if (this.get('offer')) {
                    this.candidates.push(candidate);
                } else {
                    this.connection.addIceCandidate(candidate);
                }
            },

            offer: function (message) {
                this.receiveCall(message);
            },

            answer: function (message) {
                var answer;
                answer = new RTCSessionDescription({
                    type: 'answer',
                    sdp: message.sdp
                });
                this.connection.setRemoteDescription(answer);
            }
        });
    });

    Peer.Conference = Marionette.View.extend({
        template: '#view-conference',

        attributes: {
            "class": 'conference'
        },

        events: {
            'click .fullscreen': 'fullscreen',
            'click .phone': 'audioCall',
            'click .microphone': 'microphone',
            'click .camera': 'videoCall',
            'click .mute': 'mute',
            'click .hide': 'hide'
        },

        ui: {
            video: 'video',
            audio: 'audio',
            audioSource: 'audio > source',
            fullscreen: '.fullscreen',
            phone: '.phone',
            microphone: '.microphone',
            camera: '.camera',
            mute: '.mute',
            hide: '.hide'
        },

        modelEvents: {
            'addstream': 'addStream'
        },

        addStream: function (stream) {
            console.log('STREAM', stream);
            this.ui.video[0].srcObject = this.model.get('stream');
        },

        fullscreen: function () {
            if (App.features.fullscreen) {
                return this.ui.video[0].requestFullscreen();
            } else {
                return console.warn('Fullscreen is not available');
            }
        },

        hide: function () {
            this.ui.hide.toggleClass('fa-angle-double-up');
            this.ui.hide.toggleClass('fa-angle-double-down');
            return this.ui.video.toggle();
        },

        audioCall: function () {
            var peer = App.Peer.find(this.model.get('target_id'));
            peer.constraints = App.Peer.Model.makeMediaConstraints(true, false);
            return peer.offer(peer.constraints);
        },

        onRender: function () {
            this.model.on('addstream', this.addStream);
            if (this.model.get('stream')) {
                this.ui.video[0].srcObject = this.model.get('stream');
            }
        }
    });

    Peer.IncomingCall = Marionette.View.extend({
        template: '#view-incoming-call',

        behaviors: {
            Bindings: {}
        },

        ui: {
            avatar: 'img',
            name: 'h2',
            answer: '.answer',
            dismiss: '.dismiss'
        },

        events: {
            'click .answer': 'answer',
            'click .dismiss': 'dismiss'
        },

        onRender: function () {
            this.ui.avatar.attr('src', App.avatarUrl(this.model.get('target_id')));
            this.ui.name.text(this.model.get('name'));
        },

        answer: function () {
            return App.navigate('/phone/' + this.model.get('target_id'));
        }

    }, {
        // STATIC
        open: function (peer) {
            App.modalRegion.show(new Peer.IncomingCall({
                model: peer
            }));
        }
    });

    Peer.Presentation = Marionette.View.extend({
        template: '#view-presentation',
        tagName: 'iframe',

        behaviors: {
            Bindings: {}
        },

        ui: {
            // canvas: 'canvas'
        },

        events: {},

        onRender: function () {
            this.el.src = '/pdf.js/web/viewer.html?file=http://localhost/images/ipad_user_guide.pdf';
        },

        onShow: function () {
            // var canvas = this.ui.canvas[0];
            // var box = canvas.getBoundingClientRect();
            // canvas.width = box.width * devicePixelRatio;
            // canvas.height = box.height * devicePixelRatio;
        }
    });

    App.on('peer:offer', function (peer) {
        return Peer.IncomingCall.open(peer);
    });

    new Peer.Router({
        controller: {
            phone: function (id) {
                var peer = App.Peer.find(id);
                if (peer) {
                    App.modalRegion.show(new Peer.Conference({
                        model: peer
                    }));
                    if (peer.get('offer')) {
                        peer.answerCall(id);
                    } else {
                        peer.offerCall(id);
                    }
                } else {
                    App.navigate('/unsupported/peer');
                }
            }
        }
    });
});
