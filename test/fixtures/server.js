'use strict';
var hapi = require('hapi');
var minimist = require('minimist');
var _ = require('lodash');

var argv = minimist(process.argv.slice(2));

var server = new hapi.Server();

var connectionOptions = {
    port: argv['p'] || 3080
};

server.connection(connectionOptions);

server.route({
    method: '*',
    path: '/{path*}',
    handler: function(request, reply) {
        var body = JSON.stringify({ message: 'success', warning: null });
        setTimeout(_.partial(reply, body), 1000);
    }
});

server.start(function(err) {
    if (err) {
        console.error(err);
    } else {
        console.log(server.info.uri);
    }
});
