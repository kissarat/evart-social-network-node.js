function findStyle(selector, match) {
    if (false !== match) {
        match = true;
    }
    var rules = [];
    for(var i = 0; i < document.styleSheets.length; i++) {
        var styleSheet = document.styleSheets[i];
        for(var j = 0; j < styleSheet.cssRules.length; j++) {
            var rule = styleSheet.cssRules[j];
            if (rule.selectorText) {
                var s = rule.selectorText.trim().replace(/\s+/g, ' ');
                if (match ? s == selector : s.indexOf(selector)) {
                    rules.push(rule);
                }
            }
        }
    }
    return rules;
}

App.on('login', function () {
    if ('admin' == App.user.type) {
        var rule = findStyle('.admin');
        rule.removeProperty('display');
    }
});
