'use strict';
var hapi = require('hapi');
var config = require('config');
var good = require('good');
var goodFile = require('good-file');

var server = new hapi.Server();

var connectionOptions = {
    port: config.get('port')
};

var goodOptions = {
    reporters: [
        {
            reporter: goodFile,
            args: [ './logs/ops.log', { ops: '*' } ]
        },
        {
            reporter: goodFile,
            args: [ './logs/response.log', { response: '*' } ]
        },
        {
            reporter: goodFile,
            args: [ './logs/error.log', { error: '*' } ]
        },
        {
            reporter: goodFile,
            args: [ './logs/request.log', { request: '*' } ]
        },
        {
            reporter: goodFile,
            args: [ './logs/log.log', { log: '*' } ]
        }
    ]
};

server.connection(connectionOptions);

server.route({
    method: '*',
    path: '/{path*}',
    handler: {
        proxy: {
            host: 'localhost',
            port: 3080,
            protocol: 'http',
            passThrough: true,
            redirects: 5
        }
    }
});
 
server.register({
    register: good,
    options: goodOptions
}, function(err) {
    if (err) {
        console.error(err);
    } else {
        server.start(function() {
            console.log(server.info.uri);
        });
    }
});

