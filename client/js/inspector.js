"use strict";

var inspectorProxy = {
    get: function (target, name) {
        var value = target.ui[name];
        if (!value && target.getRegion) {
            value = target.getRegion(name);
            value = value && value.currentView ? value.currentView : null;
        }
        if (value) {
            console.log(value); 
            value = new Proxy(value, inspectorProxy);
        }
        return value;
    },

    ownKeys: function (target) {
        var keys = Object.keys(target.ui);
        if (target.getRegions) {
            keys = keys.concat(Object.keys(target.getRegions()));
        }
        return keys;
    }
};

function root() {
    return new Proxy(App.mainRegion.currentView, inspectorProxy);
}

var inspector = {
    events: {
        drag: ['dragstart', 'dragenter', 'dragover', 'dragleave', 'drop', 'dragend']
    },
    
    logEvents: function (target, events_names) {
        if('string' == typeof events_names) {
            events_names = inspector.events[events_names];
        }
        var events = {};
        events_names.forEach(function (name) {
            events[name] = function (e) {
                console.log(e.type, e.target);
            }
        });
        register(target, events);
    }
};
