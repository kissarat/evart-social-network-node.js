"use strict";

(function () {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        window.capture = function (constraints, call) {
        };
    }

    if (!window.RTCPeerConnection) {
        return console.warn('Peer connection is not supported');
    }

    var stun = '23.21.150.121:3478	iphone-stun.strato-iphone.de:3478	numb.viagenie.ca:3478	s1.taraba.net:3478	s2.taraba.net:3478	stun.12connect.com:3478	stun.12voip.com:3478	stun.1und1.de:3478	stun.2talk.co.nz:3478	stun.2talk.com:3478	stun.3clogic.com:3478	stun.3cx.com:3478	stun.a-mm.tv:3478	stun.aa.net.uk:3478	stun.acrobits.cz:3478	stun.actionvoip.com:3478	stun.advfn.com:3478	stun.aeta-audio.com:3478	stun.aeta.com:3478	stun.alltel.com.au:3478	stun.altar.com.pl:3478	stun.annatel.net:3478	stun.antisip.com:3478	stun.arbuz.ru:3478	stun.avigora.com:3478	stun.avigora.fr:3478	stun.awa-shima.com:3478	stun.awt.be:3478	stun.b2b2c.ca:3478	stun.bahnhof.net:3478	stun.barracuda.com:3478	stun.bluesip.net:3478	stun.bmwgs.cz:3478	stun.botonakis.com:3478	stun.budgetphone.nl:3478	stun.budgetsip.com:3478	stun.cablenet-as.net:3478	stun.callromania.ro:3478	stun.callwithus.com:3478	stun.cbsys.net:3478	stun.chathelp.ru:3478	stun.cheapvoip.com:3478	stun.ciktel.com:3478	stun.cloopen.com:3478	stun.colouredlines.com.au:3478	stun.comfi.com:3478	stun.commpeak.com:3478	stun.comtube.com:3478	stun.comtube.ru:3478	stun.cope.es:3478	stun.counterpath.com:3478	stun.counterpath.net:3478	stun.cryptonit.net:3478	stun.darioflaccovio.it:3478	stun.datamanagement.it:3478	stun.dcalling.de:3478	stun.decanet.fr:3478	stun.demos.ru:3478	stun.develz.org:3478	stun.dingaling.ca:3478	stun.doublerobotics.com:3478	stun.drogon.net:3478	stun.duocom.es:3478	stun.dus.net:3478	stun.e-fon.ch:3478	stun.easybell.de:3478	stun.easycall.pl:3478	stun.easyvoip.com:3478	stun.efficace-factory.com:3478	stun.einsundeins.com:3478	stun.einsundeins.de:3478	stun.ekiga.net:3478	stun.epygi.com:3478	stun.etoilediese.fr:3478	stun.eyeball.com:3478	stun.faktortel.com.au:3478	stun.freecall.com:3478	stun.freeswitch.org:3478	stun.freevoipdeal.com:3478	stun.fuzemeeting.com:3478	stun.gmx.de:3478	stun.gmx.net:3478	stun.gradwell.com:3478	stun.halonet.pl:3478	stun.hellonanu.com:3478	stun.hoiio.com:3478	stun.hosteurope.de:3478	stun.ideasip.com:3478	stun.imesh.com:3478	stun.infra.net:3478	stun.internetcalls.com:3478	stun.intervoip.com:3478	stun.ipcomms.net:3478	stun.ipfire.org:3478	stun.ippi.fr:3478	stun.ipshka.com:3478	stun.iptel.org:3478	stun.irian.at:3478	stun.it1.hr:3478	stun.ivao.aero:3478	stun.jappix.com:3478	stun.jumblo.com:3478	stun.justvoip.com:3478	stun.kanet.ru:3478	stun.kiwilink.co.nz:3478	stun.kundenserver.de:3478	stun.l.google.com:19302	stun.linea7.net:3478	stun.linphone.org:3478	stun.liveo.fr:3478	stun.lowratevoip.com:3478	stun.lugosoft.com:3478	stun.lundimatin.fr:3478	stun.magnet.ie:3478	stun.manle.com:3478	stun.mgn.ru:3478	stun.mit.de:3478	stun.mitake.com.tw:3478	stun.miwifi.com:3478	stun.modulus.gr:3478	stun.mozcom.com:3478	stun.myvoiptraffic.com:3478	stun.mywatson.it:3478	stun.nas.net:3478	stun.neotel.co.za:3478	stun.netappel.com:3478	stun.netappel.fr:3478	stun.netgsm.com.tr:3478	stun.nfon.net:3478	stun.noblogs.org:3478	stun.noc.ams-ix.net:3478	stun.node4.co.uk:3478	stun.nonoh.net:3478	stun.nottingham.ac.uk:3478	stun.nova.is:3478	stun.nventure.com:3478	stun.on.net.mk:3478	stun.ooma.com:3478	stun.ooonet.ru:3478	stun.oriontelekom.rs:3478	stun.outland-net.de:3478	stun.ozekiphone.com:3478	stun.patlive.com:3478	stun.personal-voip.de:3478	stun.petcube.com:3478	stun.phone.com:3478	stun.phoneserve.com:3478	stun.pjsip.org:3478	stun.poivy.com:3478	stun.powerpbx.org:3478	stun.powervoip.com:3478	stun.ppdi.com:3478	stun.prizee.com:3478	stun.qq.com:3478	stun.qvod.com:3478	stun.rackco.com:3478	stun.rapidnet.de:3478	stun.rb-net.com:3478	stun.refint.net:3478	stun.remote-learner.net:3478	stun.rixtelecom.se:3478	stun.rockenstein.de:3478	stun.rolmail.net:3478	stun.rounds.com:3478	stun.rynga.com:3478	stun.samsungsmartcam.com:3478	stun.schlund.de:3478	stun.services.mozilla.com:3478	stun.sigmavoip.com:3478	stun.sip.us:3478	stun.sipdiscount.com:3478	stun.sipgate.net:10000	stun.sipgate.net:3478	stun.siplogin.de:3478	stun.sipnet.net:3478	stun.sipnet.ru:3478	stun.siportal.it:3478	stun.sippeer.dk:3478	stun.siptraffic.com:3478	stun.skylink.ru:3478	stun.sma.de:3478	stun.smartvoip.com:3478	stun.smsdiscount.com:3478	stun.snafu.de:3478	stun.softjoys.com:3478	stun.solcon.nl:3478	stun.solnet.ch:3478	stun.sonetel.com:3478	stun.sonetel.net:3478	stun.sovtest.ru:3478	stun.speedy.com.ar:3478	stun.spokn.com:3478	stun.srce.hr:3478	stun.ssl7.net:3478	stun.stunprotocol.org:3478	stun.symform.com:3478	stun.symplicity.com:3478	stun.sysadminman.net:3478	stun.t-online.de:3478	stun.tagan.ru:3478	stun.tatneft.ru:3478	stun.teachercreated.com:3478	stun.tel.lu:3478	stun.telbo.com:3478	stun.telefacil.com:3478	stun.tis-dialog.ru:3478	stun.tng.de:3478	stun.twt.it:3478	stun.u-blox.com:3478	stun.ucallweconn.net:3478	stun.ucsb.edu:3478	stun.ucw.cz:3478	stun.uls.co.za:3478	stun.unseen.is:3478	stun.usfamily.net:3478	stun.veoh.com:3478	stun.vidyo.com:3478	stun.vipgroup.net:3478	stun.virtual-call.com:3478	stun.viva.gr:3478	stun.vivox.com:3478	stun.vline.com:3478	stun.vo.lu:3478	stun.vodafone.ro:3478	stun.voicetrading.com:3478	stun.voip.aebc.com:3478	stun.voip.blackberry.com:3478	stun.voip.eutelia.it:3478	stun.voiparound.com:3478	stun.voipblast.com:3478	stun.voipbuster.com:3478	stun.voipbusterpro.com:3478	stun.voipcheap.co.uk:3478	stun.voipcheap.com:3478	stun.voipfibre.com:3478	stun.voipgain.com:3478	stun.voipgate.com:3478	stun.voipinfocenter.com:3478	stun.voipplanet.nl:3478	stun.voippro.com:3478	stun.voipraider.com:3478	stun.voipstunt.com:3478	stun.voipwise.com:3478	stun.voipzoom.com:3478	stun.vopium.com:3478	stun.voxgratia.org:3478	stun.voxox.com:3478	stun.voys.nl:3478	stun.voztele.com:3478	stun.vyke.com:3478	stun.webcalldirect.com:3478	stun.whoi.edu:3478	stun.wifirst.net:3478	stun.wwdl.net:3478	stun.xs4all.nl:3478	stun.xtratelecom.es:3478	stun.yesss.at:3478	stun.zadarma.com:3478	stun.zadv.com:3478	stun.zoiper.com:3478	stun1.faktortel.com.au:3478	stun1.l.google.com:19302	stun1.voiceeclipse.net:3478	stun2.l.google.com:19302	stun3.l.google.com:19302	stun4.l.google.com:19302	stunserver.org:3478';
    stun = stun.split("\t").map(function (s) {
        return 'stun:' + s
    });
    var shuffle = function () {
        return 1 - Math.random() * 2
    };
    stun.sort(shuffle);

    var iceServerConfig = {
        iceServers: [
            {
                urls: 'turn:game-of-business.com:3478',
                credential: 'one',
                username: 'one'
            },
            {
                urls: 'turn:numb.viagenie.ca',
                credential: 'muazkh',
                username: 'webrtc@live.com'
            },
            {
                urls: 'turn:192.158.29.39:3478?transport=udp',
                credential: 'JZEOEt2V3Qb0y27GRntt2u2PAYA=',
                username: '28224511:1379330808'
            },
            {
                urls: 'turn:192.158.29.39:3478?transport=tcp',
                credential: 'JZEOEt2V3Qb0y27GRntt2u2PAYA=',
                username: '28224511:1379330808'
            }
        ]
    };
    iceServerConfig.iceServers.sort(shuffle);
    iceServerConfig.iceServers.unshift({urls: stun});

    function Peer(params) {
        this.params = extract(params, ['chat_id', 'target_id']);
        this.offers = [];
        this.connection = new RTCPeerConnection(iceServerConfig, {
            optional: [{RtpDataChannels: true}]
        });
        var self = this;
        var c = this.connection;
        if (DEBUG) {
            c.addEventListener('identityresult', _debug);
            c.addEventListener('idpassertionerror', _error);
            c.addEventListener('idpvalidationerror', _error);
            c.addEventListener('negotiationneeded', _debug);
            c.addEventListener('peeridentity', _debug);
            c.addEventListener('iceconnectionstatechange', function(e) {
                console.log('# connection: ' + e.target.iceConnectionState);
            });
            c.addEventListener('signalingstatechange', function(e) {
                console.log('# singnal: ' + e.target.signalingState);
            });
            DEBUG.peer = this;
        }

        this.candidates_count = 0;
        this.candidates = [];

        c.addEventListener('icecandidate', function(e) {
           if (e.candidate) {
               server.send(merge(self.params, {
                   type: 'candidate',
                   candidate: e.candidate
               }));
           }
        });

        //c.addEventListener('signalingstatechange', function(e) {
        //    if ('stable' == e.target.signalingState) {
        //        c._candidates.forEach(function(candidate) {
        //            e.target.addIceCandidate(candidate);
        //        });
        //        c._candidates = [];
        //    }
        //});
    }

    Peer.prototype = {
        offer: function (options) {
            var self = this;
            return new Promise(function (resolve, reject) {
                self.connection.createOffer(function (offer) {
                    _debug('Peer.offer', offer);
                    self.connection.setLocalDescription(offer, function () {
                        var message = merge(offer.toJSON(), self.params);
                        server.send(message).then(resolve, reject);
                    }, reject);
                }, reject, options);
            });
        },

        answer: function (offer) {
            var self = this;
            return new Promise(function (resolve, reject) {
                offer = new RTCSessionDescription({type: 'offer', sdp: offer.sdp});
                self.connection.setRemoteDescription(offer, function () {
                    self.connection.createAnswer(function (answer) {
                        _debug('Peer.answer', offer, answer);
                        self.connection.setLocalDescription(answer, function () {
                            var message = merge(answer.toJSON(), self.params);
                            server.send(message).then(resolve, reject);
                        });
                    });
                })
            });
        },

        call: function (options) {
            return this.offers.length > 0
                ? this.answer(this.offers.shift())
                : this.offer(options);
        }
    };

    extend(Peer, EventEmitter);

    window.Peer = Peer;
})();
