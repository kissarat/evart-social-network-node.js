//var iceServerConfig = {
//    iceServers: [
//        {
//            url: isChrome
//                ? 'stun:stun.l.google.com:19302'
//                : 'stun:23.21.150.121'
//        },
//        {
//            url: 'turn:homeo@turn.bistri.com:80',
//            credential: 'homeo'
//        }
//    ]
//};


var iceServerConfig = {
    'iceServers': [
        {
            'url': 'stun:stun.l.google.com:19302'
        },
        {
            'url': 'turn:192.158.29.39:3478?transport=udp',
            'credential': 'JZEOEt2V3Qb0y27GRntt2u2PAYA=',
            'username': '28224511:1379330808'
        },
        {
            'url': 'turn:192.158.29.39:3478?transport=tcp',
            'credential': 'JZEOEt2V3Qb0y27GRntt2u2PAYA=',
            'username': '28224511:1379330808'
        }
    ]
};


function Peer(source_id, servers) {
    this.source_id = source_id || localStorage.user_id || Math.round(Math.random() * 100);
    this.connection = new RTCPeerConnection(servers, {optional: []});
}

Peer.prototype = {
    init: function () {
        this.connection.addEventListener('icecandidate', this.onicecandidate.bind(this));
        this.connection.addEventListener('iceconnectionstatechange', morozov);
        this.trace('constructed');
    },

    onicecandidate: function (e) {
        console.log(this.target_id, e);
        if (e.candidate) {
            server.send(this.target_id, {
                type: 'candidate',
                candidate: e.candidate
            });
        }
        else {
            this.trace('No candidate', 'error');
        }
    },

    trace: function (message, type) {
        if (!type) {
            type = 'log';
        }
        console[type](this.source_id + ': ' + message);
    },

    offer: function () {
        var self = this;
        this.connection.createOffer(function (offer) {
            self.connection.setLocalDescription(offer, function () {
                server.send(self.target_id, {
                    type: 'offer',
                    source_id: self.source_id,
                    sdp: offer.sdp
                })
            }, morozov);
        }, morozov, {
            offerToReceiveAudio: 1,
            offerToReceiveVideo: 1
        });
    },

    capture: function (call) {
        var self = this;
        var constraints = {audio: true, video: true};
        navigator.mediaDevices.getUserMedia(constraints).then(function (mediaStream) {
            self.stream = mediaStream;
            call(mediaStream);
        })
            .catch(morozov);
    },

    shareVideo: function() {
        this.connection.addStream(this.stream);
    }
};

var peer;

server.on('login', function () {
    peer = new Peer(null, iceServerConfig);
    server.on('candidate', function (e) {
        var candidate = new RTCIceCandidate(e.candidate);
        peer.connection.addIceCandidate(candidate);
    });

    server.on('offer', function (offer) {
        peer.target_id = offer.source_id;
        offer = new RTCSessionDescription({type: 'offer', sdp: offer.sdp});
        peer.connection.setRemoteDescription(offer, morozov, morozov);
        peer.connection.createAnswer(function (answer) {
            peer.connection.setLocalDescription(answer, function () {
                    server.send(peer.target_id, {
                        type: 'answer',
                        sdp: offer.sdp
                    })
                },
                morozov);
        });
    });

    server.on('answer', function (desc) {
        desc = new RTCSessionDescription({type: 'answer', sdp:desc.sdp});
        peer.connection.setRemoteDescription(desc, morozov, function(e) {
            console.error(e);
        });
    })
});
