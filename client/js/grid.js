"use strict";

function $tag(name, attributes, children) {
    var tag = document.createElement(name);
    if ('string' === typeof attributes) {
        tag.value = attributes;
    }
    else {
        _.each(attributes, function (value, name) {
            if ('boolean' == typeof value) {
                tag[name] = value;
            }
            else {
                tag.setAttribute(name, value);
            }
        });
    }
    if ('string' === typeof children) {
        tag.innerHTML = children;
    }
    else {
        tag.append(children);
    }
    return tag;
}

function $$(selector) {
    return document.querySelector(selector);
}

function $import(selector) {
    return document.importNode(document.querySelector(selector), true).content;
}

function $create(selector) {
    var root = $tag('div', {class: selector.replace('#view-', 'view ')})
    root.appendChild($import(selector));
    return root;
}

_.extend(Element.prototype, {
    $: function (selector) {
        return this.querySelector(selector);
    },

    append: function (children) {
        _.each(children, function (child) {
            if (child instanceof Node) {
                this.appendChild(child);
            }
            else {
                console.error(child);
            }
        }, this);
        return this;
    },

    register: function (listeners) {
        return register(this, listeners);
    },

    on: function (name, handler) {
        this.addEventListener(name, handler);
        return this;
    },

    once: function (name, handler) {
        function once() {
            handler.apply(this, arguments);
            this.removeEventListener(name, once);
        }

        this.on(name, once);
        return this;
    },

    $all: function (selector) {
        return _.toArray(this.querySelectorAll(selector));
    },

    $each: function (selector, cb) {
        return _.each(this.querySelectorAll(selector), cb);
    },

    clear: function () {
        this.innerHTML = '';
        return this;
    }
});

App.module('Grid', function (Grid) {
    Grid.Router = Marionette.AppRouter.extend({
        initialize: function () {
            this.appRoute(/^grid/, 'grid');
        }
    });

    function render(schema) {
        var url = location.pathname.replace(/^\/grid\//, '');
        var grid = $create('#view-grid');

        grid.$('.collections')
            .clear()
            .append(_.map(schema, function (value, name) {
                return $tag('option', name, name);
            }))
            .on('change', function () {
                if (this.value) {
                    selectColumns();
                }
            });

        function getCollectionName() {
            return grid.$('.collections').value;
        }

        function getCollectionSchema() {
            return schema[getCollectionName()].schema;
        }

        function getColumns() {
            return grid.$all('.columns :checked').map(function (checkbox) {
                return checkbox.getAttribute('name');
            })
        }

        function selectColumns() {
            var collection_schema = getCollectionSchema();
            collection_schema._id.required = true;
            grid.$('.columns')
                .clear()
                .append(_.map(collection_schema, function (column, name) {
                    return $tag('li', {'data-name': name}, [
                        $tag('input', {
                            type: 'checkbox',
                            value: name,
                            id: 'field-' + name,
                            name: name,
                            checked: !!column.required
                        })
                            .on('change', function () {
                                grid.$('table tbody').clear();
                                query();
                            }),
                        $tag('label', {for: 'field-' + name}, name)
                    ]);
                }));
            var time = grid.$('[name=time]');
            time.enabled = false;
            time.checked = true;
            thead.$('.name').clear();
            thead.$('.filter').clear();
            query()
        }

        function query(params) {
            var size = 96;
            var columns = getColumns();
            params = _.merge({
                select: columns.join('.'),
                limit: size
            }, params);
            $.getJSON('/api/' + getCollectionName() + '?' + $.param(params), function (rows) {
                renderTable(rows)
            });
        }

        function renderHeaders() {
            var thead = grid.$('table thead');
            var collection_schema = getCollectionSchema();
            var namesHeader = thead.$('.name');
            var filtersHeader = thead.$('.filter');
            var filterValues = [];
            var columns = getColumns();
            namesHeader.$all('[data-name]').forEach(function (nameHeader) {
                if (!_.contains(columns, nameHeader.getAttribute('data-name'))) {
                    nameHeader.remove();
                }
            });
            columns.forEach(function (name) {
                if (namesHeader.$('[data-name="' + name + '"]')) {
                    return;
                }
                namesHeader.appendChild($tag('th', {'data-name': name}, name));
                var column = collection_schema[name];
                if (column.enum) {
                    column.enum.unshift('');
                    var select = $tag('select', null, column.enum.map(function (value) {
                        return $tag('option', value, value)
                    }))
                        .on('change', function () {
                            var params = {};
                            filterValues.forEach(function (filter) {
                                filter(params);
                            });
                            query(params);
                        });
                    filterValues.push(function (params) {
                        if (select.value) {
                            params[name] = select.value;
                        }
                    });
                    filtersHeader.appendChild($tag('td', null, [select]));
                }
                else {
                    filtersHeader.appendChild($tag('td'));
                }
            });
        }

        function renderTable(rows) {
            renderHeaders();
            var columns = getColumns();
            grid.$('tbody')
                .append(rows.map(function (row) {
                    var cells = _.map(columns, function (name) {
                        var value = row[name];
                        var attrs = {'data-name': name};
                        switch (name) {
                            case '_id':
                            case 'source':
                            case 'target':
                            case 'owner':
                                attrs.title = value;
                                value = $tag('input', {value: value.slice(-6), size: 6})
                                    .once('click', function () {
                                        this.value = attrs.title;
                                        this.setAttribute('size', '26');
                                    });
                                value = [value];
                                break;
                            case 'time':
                                if (value) {
                                    value = new Date(value).toLocaleString();
                                }
                                break;
                        }
                        return $tag('td', attrs, value);
                    });
                    cells.push($tag('td', null, $tag('a')));
                    return $tag('tr', {id: row._id}, cells);
                }))
        }

        selectColumns();
        $$('#main').appendChild(grid);
    }

    return new Grid.Router({
        controller: {
            grid: function () {
                $.getJSON('/api/', function (meta) {
                    render(meta.schema);
                })
            }
        }
    });
});
