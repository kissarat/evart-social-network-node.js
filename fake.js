var faker = require('faker');

module.exports = {
    user: function(_) {
        _.res.send({
            email: faker.internet.email(),
            password: '1',
            forename: faker.name.firstName(),
            surname: faker.name.lastName()
        });
    }
};
