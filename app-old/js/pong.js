"use strict";

browser_info.innerHTML = JSON.stringify(browser);

var isFirefox = 'Firefox' == browser.name;

var peers = {};

function _debug(e) {
    console.log(e);
}

function _error(e) {
    console.error(e);
}

var iceServerConfig = {
    iceServers: [
        {
            urls: ['turn:game-of-business.com:3478'],
            credential: 'one',
            username: 'one'
        },
        {
            urls: ['stun:stun.l.google.com:19302', 'stun:stun2.l.google.com:19302',
                'stun:stun3.l.google.com:19302', 'stun:stun.services.mozilla.com']
        }
    ]
};

var peerConstrains = {
    optional: [
        //{RtpDataChannels: true},
        {DtlsSrtpKeyAgreement: true}
    ]
};

function connection(id) {
    var peer = new RTCPeerConnection(iceServerConfig, peerConstrains);

    peer.addEventListener('icecandidate', function (e) {
        if (e.candidate) {
            if (peer.target_id) {
                post(peer.target_id, 'candidate', {candidate: e.candidate});
            }
            else {
                var publish = new XMLHttpRequest();
                publish.open('POST', '/api/pong/offer');
                publish.setRequestHeader('content-type', 'text/json');
                publish.send(JSON.stringify({
                    type: 'candidate',
                    candidate: e.candidate
                }));
            }
        }
    });

    peer.addEventListener('addstream', function (e) {
        var video = document.createElement('video');
        video.srcObject = e.stream;
        video.controls = true;
        video.muted = true;
        video.play();
        videos.appendChild(video);
    });

    peer.addEventListener('identityresult', _debug);
    peer.addEventListener('idpassertionerror', _error);
    peer.addEventListener('idpvalidationerror', _error);
    peer.addEventListener('negotiationneeded', _debug);
    peer.addEventListener('peeridentity', _debug);
    peer.addEventListener('iceconnectionstatechange', function (e) {
        console.log('# connection: ' + e.target.iceConnectionState);
    });
    peer.addEventListener('signalingstatechange', function (e) {
        console.log('# singnal: ' + e.target.signalingState);
    });

    peers[id] = peer;
    peer.target_id = id;

    return peer;
}

var client_id;

var server = new EventSource('/api/pong');

server.addEventListener('open', function () {
    client_id = /cid=(\w+)/.exec(document.cookie);
    if (client_id) {
        client_id = client_id[1];
    }
    post(null, 'name', {name: login.name.value || localStorage._pong_name});
});
server.addEventListener('error', function (e) {
    console.error(e, arguments.length);
});

server.on = function (name, cb) {
    server.addEventListener(name, function (e) {
        cb.call(server, JSON.parse(e.data));
    });
};

var clients = {};

function add(message) {
    remove(message);
    if (message.source_id == client_id) {
        return;
    }
    clients[message.source_id] = message.name;
    var div = document.createElement('div');
    div.innerHTML = message.name;
    div.id = message.source_id;
    div.onclick = function () {
        offer(this.id);
    };
    list.appendChild(div);
}

function remove(message) {
    delete clients[message.source_id];
    var contact = document.getElementById(message.source_id);
    if (contact) {
        contact.remove();
    }
}

server.on('enter', add);
server.on('exit', remove);

server.on('clients', function (message) {
    clients = message;
    for (var id in clients) {
        add({
            source_id: id,
            name: clients[id]
        });
    }
});

function post(id, event, data, async) {
    var xhr = new XMLHttpRequest();
    var url = '/api/pong?event=' + event;
    if (id) {
        url += '&id=' + id;
    }
    xhr.open('POST', url, false !== async);
    xhr.setRequestHeader('content-type', 'text/json');
    xhr.send(JSON.stringify(data));
}

function offer(id) {
    var peer = connection(id);
    return new Promise(function (resolve, reject) {
        function setLocalDesciption(desc) {
            peer.setLocalDescription(desc).then(function () {
                var message = {offer: desc.sdp};
                if (id) {
                    post(id, 'offer', message);
                }
                resolve(message);
            }, reject)
        }

        if (isFirefox) {
            peer.createOffer({offerToReceiveAudio: false, offerToReceiveVideo: true})
                .then(setLocalDesciption, reject);
        }
        else {
            peer.createOffer({mandatory: {OfferToReceiveAudio: false, OfferToReceiveVideo: true}})
                .then(setLocalDesciption, reject);

            //peer.createOffer()
            //    .then(setLocalDesciption, reject);
        }

    });
}

function answer(message) {
    var peer;
    return new Promise(function (resolve, reject) {
        capture(function (stream) {
            peer = connection(message.source_id);
            peer.addStream(stream);
            var offerDesc = new RTCSessionDescription({type: 'offer', sdp: message.offer});

            function setLocalDescription(answer) {
                peer.setLocalDescription(answer).then(function () {
                    post(message.source_id, 'answer', {answer: answer.sdp});
                    resolve({answer: answer.sdp});
                }, reject);
            }

            peer.setRemoteDescription(offerDesc).then(resolve, reject);

            if (isFirefox) {
                peer.createAnswer({offerToReceiveAudio: false, offerToReceiveVideo: true})
                    .then(setLocalDescription, reject);
            }
            else {
                peer.createAnswer({mandatory: {OfferToReceiveAudio: false, OfferToReceiveVideo: true}})
                    .then(setLocalDescription, reject);
                //peer.createAnswer()
                //    .then(setLocalDescription, reject);
            }
        });
    });
}

server.on('offer', function (message) {
    answer(message).then(_debug, _error);
});

server.on('answer', function (message) {
    var answer = new RTCSessionDescription({type: 'answer', sdp: message.answer});
    peers[message.source_id].setRemoteDescription(answer).then(_debug, _error);
});

server.on('candidate', function (message) {
    var candidate = new RTCIceCandidate(message.candidate);
    console.log(candidate);
    peers[message.source_id].addIceCandidate(candidate);
});

var _camera;
function capture(cb) {
    if (_camera) {
        cb(_camera);
    }
    else {
        navigator.mediaDevices.getUserMedia({audio: 1, video: 1}).then(function (stream) {
            _camera = stream;
            cb(stream);
        });
    }
}

enter.onclick = function () {
    localStorage._pong_name = login.name.value;
    post(null, 'name', {name: localStorage._pong_name});
    login.remove();
    list.style.removeProperty('display');
};

document.getElementById('capture').onclick = capture;

if (localStorage._pong_name) {
    login.name.value = localStorage._pong_name;
}

addEventListener('beforeunload', function () {
    post(null, 'exit', {source_id: client_id}, false);
});

var xhr = new XMLHttpRequest();
xhr.open('GET', '/api/pong/offer');
//xhr.setRequestHeader('content-type', 'text/json');
xhr.onload = function () {
    var message;
    try {
        message = JSON.parse(this.responseText);
    }
    catch (ex) {
    }
    if (message && message.source_id) {
        offer(message.source_id).then(_debug, _error);
        //if (message.candidates) {
        //    message.candidates.forEach(function (candidate) {
        //        candidate = new RTCIceCandidate(candidate);
        //        peer.addIceCandidate(candidate);
        //    });
        //}
    }
    else {
        var publish = new XMLHttpRequest();
        publish.open('POST', '/api/pong/offer');
        publish.setRequestHeader('content-type', 'text/json');
        publish.send(JSON.stringify({}));
    }
};
xhr.send(null);

function removeOffer(e) {
    var remove = new XMLHttpRequest();
    remove.open('DELETE', '/api/pong/offer', !e);
    remove.send(null);
}
