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

    var schema;

    class ValueOption extends React.Component {
        render() {
            return (<option value={this.props.value}>{this.props.value}</option>)
        }
    }

    class Row extends React.Component {
        render() {
            var cells = [];
            this.props.fields.forEach(field => {
                cells.push(<td key={field}>{this.props.object[field]}</td>);
            });
            return <tr>{cells}</tr>;
        }
    }

    class GridView extends React.Component {
        constructor() {
            super();
            this.state = {
                collection: 'user',
                params: {
                    page: 1,
                    limit: 96
                },
                rows: []
            };
            this.state.fields = this.getRequired();
        }

        componentWillMount() {
            this.query(true);
        }

        getEnabledFields() {
            var fields = [];
            _.each(this.state.fields, function (enabled, name) {
                if (enabled) {
                    fields.push(name);
                }
            });
            return fields;
        }

        getRequired() {
            var fields = {_id: true, time: true};
            _.each(schema[this.state.collection], function (field, name) {
                if (field.required) {
                    fields[name] = true;
                }
            });
            return fields;
        }

        selectCollection = (e) => {
            this.setState({
                collection: e.target.value,
                fields: this.getRequired()
            });
            this.query(true);
        };

        checkField = (e) => {
            var fields = this.state.fields;
            fields[e.target.getAttribute('name')] = e.target.checked;
            this.setState({
                fields: fields,
                rows: []
            });
            this.query(true);
        };

        query(reset, params) {
            params = _.merge(this.state.params, params, {
                select: this.getEnabledFields().join('.')
            });
            if (reset) {
                params.page = 1;
            }
            var url = '/api/' + this.state.collection + '?' + $.param(params);
            if (url !== this.busy) {
                this.busy = url;
                $.getJSON(url + '&_=' + Date.now().toString(36), rows => {
                    this.busy = false;
                    if (!reset) {
                        if (0 === rows.length) {
                            return;
                        }
                        rows = this.state.rows.concat(rows);
                    }
                    delete params.select;
                    this.setState({
                        rows: rows,
                        params: params
                    });
                });
            }
        }

        search = (e) => this.query(true, {
            q: e.target.value
        });

        scroll = (e) => {
            var delta = e.target.scrollHeight - innerHeight - e.target.scrollTop;
            if (delta < 100) {
                this.query(false, {page: this.state.params.page + 1});
            }
        };

        filter = (e) => {
            var name = e.target.getAttribute('name');
            if (e.target.value) {
                this.state.params[name] = e.target.value;
            }
            else {
                delete this.state.params[name];
            }
            this.query(true);
        };

        render() {
            var collections = [];
            for (let name in schema) {
                collections.push(<ValueOption key={name} value={name}/>);
            }
            var checkboxes = [];
            var collection = schema[this.state.collection].schema;
            for (let name in collection) {
                checkboxes.push(
                    <li key={name}>
                        <input
                            type="checkbox"
                            name={name}
                            onChange={this.checkField}
                            value={this.state.fields[name]}
                            checked={this.state.fields[name]}
                        />
                        <label>{name}</label>
                    </li>
                );
            }
            var enabledFields = this.getEnabledFields();
            var fields = enabledFields.map(field => <th key={field}>{field}</th>);
            var filters = enabledFields.map(name => {
                var field = collection[name];
                var value = '';
                if (field.enum) {
                    if (field.enum[0]) {
                        field.enum.unshift('');
                    }
                    value =
                        <select name={name} value={this.state.params[name]} onChange={this.filter}>
                            {field.enum.map(v => <ValueOption key={v} value={v}/>)}
                        </select>
                }
                return <th key={name}>{value}</th>
            });
            return (
                <div className="view grid scroll" onScroll={this.scroll}>
                    <select key="collections"
                            value={this.state.collection}
                            onChange={this.selectCollection}>
                        {collections}
                    </select>
                    <ul key="fields" className="fields">{checkboxes}</ul>
                    <input type="search" value={this.state.search} onChange={this.search}/>
                    <table key="table">
                        <thead>
                        <tr key="fields">{fields}</tr>
                        <tr key="filters">{filters}</tr>
                        </thead>
                        <tbody>
                        {this.state.rows.map(row => <Row
                            key={row._id}
                            fields={enabledFields}
                            object={row}
                        />)}
                        </tbody>
                    </table>
                </div>
            )
        }
    }

    function render() {
        ReactDOM.render(<GridView/>, $$('#main'));
    }


    return new Grid.Router({
        controller: {
            grid: function () {
                $.getJSON('/api/', function (meta) {
                    schema = meta.schema;
                    render();
                })
            }
        }
    });
});
