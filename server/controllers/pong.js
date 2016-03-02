var clients = {};

function unsafe_uid() {
    return Math.round(Math.random() * 1679615).toString(36);
}

function get_names() {
    var names = {};
    for(var id in clients) {
        names[id] = clients[id].name;
    }
    return names;
}

module.exports = {
    PUT: function($) {
        var id = unsafe_uid();
        $.setCookie('id', id);
        $.send({
            clients: get_names()
        });
        
    }
};