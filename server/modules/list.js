'use strict';

var list_fields = {
    follow: 'deny',
    deny: 'follow',
    friend: null,
    request: null
};

module.exports = {
    GET: function ($) {
        var name = $.param('name');
        if (!list_fields.hasOwnProperty(name)) {
            $.invalid('name');
        }
        var fields = {};
        fields['friend' === name ? 'follow' : name] = 1;
        var id = $.has('id') ? $.id : $.user._id;
        User.findOne(id, fields, $.wrap(function (user) {
            if ('friend' === name) {
                search($, {
                    _id: {
                        $in: user.follow.map(ObjectID)
                    },
                    follow: user._id
                }, true);
            } else {
                search($, user[name], true);
            }
        }));
/*
        if ($.has('domain') && $.has('list')) {
            var list_name = $.param('list');
            if (list_name !== 'follow' && list_name !== 'deny') {
                $.invalid('list', 'is not follow or deny');
            }
            User.findOne({
                domain: $.param('domain')
            }).select(list_name).then(function (user) {
                return search($, user[list_name]);
            });
        } else {
            return search($);
        }
  */
    },

    POST: modify_list(true),
    DELETE: modify_list(false)
};

function modify_list(add) {
    return function ($) {
        var name = $.param('name');
        var source_id = $.has('source_id') ? $.get('source_id') : $.user._id;
        var target_id = $.param('target_id');
        if (!list_fields.hasOwnProperty(name)) {
            $.invalid('name');
        }
        var result = {success: true};
        return new Promise(function (resolve, reject) {
            User.findOne(source_id, {follow: 1}).catch(reject).then(function (user) {
                var index = _.findIndex(user.follow, function (current_id) {
                    return target_id.toString() == current_id.toString();
                });
                result.found = index >= 0;
                if (result.found == add) {
                    result.success = result.found && !add;
                    resolve(result);
                }
                else {
                    result.modified = true;
                    if (add) {
                        user.follow.push(target_id);
                    }
                    else {
                        user.follow.splice(index, 1);
                    }
                    user.save().catch(reject).then(function (user) {
                        resolve(result);
                    });
                }
            })
        });
    }
}

function search($, where, send) {
    var isArray = where instanceof Array;
    var ands = !where || isArray ? {} : where;
    if ($.has('q')) {
        var ORs = [];
        var q = $.search;
        ['domain', 'surname'].forEach(function (param) {
            var d = {};
            d[param] = {
                $regex: q
            };
            ORs.push(d);
        });
        if (ORs.length > 0) {
            ands.$or = ORs;
        }
    }
    ['country', 'city', 'sex', 'forename', 'relationship', 'type'].forEach(function (param) {
        if ($.has(param)) {
            ands[param] = $.param(param);
        }
    });
    if (isArray) {
        ands._id = {
            $in: where.map(function (id) {
                return ObjectID(id);
            })
        };
    }
    var r = User.find(ands).select($.select(['domain'], User.fields.update.user));
    if (send) {
        r.exec($.wrap(function (users) {
            return $.send(users);
        }));
    } else {
        return r;
    }
}
