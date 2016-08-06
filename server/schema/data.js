require('../server');
const mongodb = require('mongodb');
const utils = require('../utils');

server.on('start', function () {
    const user = {
        "_id": mongodb.ObjectID('010000000000000000000000'),
        "domain": "admin",
        "type": "admin",
        "phone": "380671234567",
        "email": "kissarat@gmail.com",
        "password": "1"
    };
    user.hash = utils.hash(user.password);
    new User(user).save(user)
        .then(function () {
            process.exit();
        })
        .catch(function (err) {
            console.error(err);
            process.exit(1);
        })
});
server.start();
