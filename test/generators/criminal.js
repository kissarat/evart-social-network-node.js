"use strict";

var faker = require('faker');
var constants = require('../../client/js/data');
var utils = require('../../server/utils');
var _ = require('underscore');

module.exports = function (db, $) {
    db.collection('criminal').find({}, function (err, reader) {
        if (err) {
            console.error(err);
        }
        reader.toArray(function (err, users) {
            var object = {};
            var articles = {};
            users = users.map(function (user) {
                var domain = user.FIRST_NAME + '_' + user.LAST_NAME;
                domain = domain.toLocaleLowerCase().split('').map(c => constants.t13n[c] || '').join('');
                var article = user.ARTICLE_CRIM.toLocaleLowerCase();
                article.replace(/ст.(\d+)/g, function(d) {
                    var name = d.slice(3);
                    if (name >= 10) {
                        var value = articles[name] || 0;
                        articles[name] = value + 1;
                    }
                });
                function name(value) {
                    return value ? value[0].toLocaleUpperCase() + value.slice(1).toLocaleLowerCase() : value;
                }
                return {
                    _id: utils.id12('User'),
                    type: 'user',
                    phone: faker.phone.phoneNumber().replace(/[^\d]+/g, ''),
                    domain: domain,
                    email: domain + '@yopmail.com',
                    surname: name(user.FIRST_NAME),
                    forename: name(user.LAST_NAME),
                    patronymic: name(user.MIDDLE_NAME),
                    birthday: new Date(user.BIRTH_DATE),
                    sex: 1 == user.sex ? 'male' : 'female',
                    country: 'UA',
                    city: user.LOST_PLACE.replace(/[а-я]+/ig, name),
                    created: new Date(user.LOST_DATE),
                    about: [user.OVD, user.CATEGORY, user.RESTRAINT, user.ARTICLE_CRIM, user.CONTACT].join('\n'),
                };
            });
            users.sort((a, b) => a.surname.localeCompare(b.surname) || a.forename.localeCompare(b.forename));
            users.forEach(function (user) {
                object[user.domain] = user;
            });
            db.collection('users').insertMany(_.values(object), function (err, result) {
                articles = _.pairs(articles).sort((a, b) => a[1] - b[1]);
                console.log(articles);
                process.exit();
            });
        });
    })
};
