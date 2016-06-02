if (!('classList' in Element.prototype)) {
    Object.defineProperty(Element.prototype, 'classList', {
        get: function () {
            var self = this;
            return {
                add: function (name) {
                    self.setAttribute('class', self.getAttribute('class') + ' ' + name);
                },

                contains: function (name) {
                    return self.getAttribute('class').indexOf(name) >= 0;
                },

                remove: function (name) {
                    self.setAttribute('class', self.getAttribute('class').replace(name, ''));
                }
            }
        }
    })
}
