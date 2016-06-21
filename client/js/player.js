function player(id, src) {
    var audio = document.getElementById(id);
    if (!audio) {
        audio = document.createElement('audio');
        audio.id = id;
        document.body.appendChild(audio);
    }
    if (src) {
        var source = audio.querySelector('source');
        if (!source) {
            source = document.createElement('source');
            audio.appendChild(source);
        }
        source.src = src;
    }
    return audio;
}

function sound(name) {
    var audio = player('sound-' + name, '/sound/' + name + '.mp3');
    audio.play();
    return audio;
}

function oclock() {
    // var audio = player('oclock', '/images/church-bell.mp3');
    // audio.play();
    // return audio;
    var now = moment().format('LT');
    now = new SpeechSynthesisUtterance(now);
    speechSynthesis.speak(now);
}

// setInterval(oclock, 300000);

// window.oc = oclock();

