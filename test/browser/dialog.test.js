'use strict';

before(function (done) {
    // var xhr = new XMLHttpRequest();
    // xhr.open('GET', '/');
    // xhr.onloadend = function () {
    //     var doc = document.implementation.createHTMLDocument();
    //     doc.documentElement.innerHTML = xhr.responseText;
    //     document.head.innerHTML = doc.head.innerHTML;
    //     document.body.innerHTML = doc.body.innerHTML;
    //     done();
    // };
    // xhr.send(null);
    // addEventListener('load', load1_windowLoad);
    console.log(App);
    App.navigate('phone');
    App.__load = 1;
    done();
});

describe('dialog', function () {
    it('one', function (done) {
        done();
    })
});
