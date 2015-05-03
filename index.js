'use strict';
var hapi = require('hapi');
var config = require('config');
var good = require('good');
var goodFile = require('good-file');
var url = require('url');
var path = require('path');
var boom = require('boom');
var wreck = require('wreck');
var zlib = require('zlib');
var thenifyAll = require('thenify-all');
var simpleErrorCodes = [404];

thenifyAll(zlib, zlib, ['unzip', 'deflate']);
thenifyAll(wreck, wreck, ['read']);

/**
 * Convert a response to a boom error object
 * @param {httpIncomingMessage} res is the response from
 * from the upstream server
 * @return {Promise} resolves to a boom Error object
 */
function convertResponseToError(res) {
    return wreck.read(res, null)
        .then(function unzipPayload(payload) {
            if (simpleErrorCodes.indexOf(res.statusCode) >= 0) {
                return Promise.resolve(null);
            }

            if (res.headers['content-encoding'] === 'gzip') {
                return zlib.unzip(payload)
                    .then(function(buffer) {
                        return buffer.toString();
                    });
            } else {
                return Promise.resolve(payload);
            }
        }).then(function convertToError(payload) {
            return boom.create(res.statusCode, payload);
        }).catch(function catchReadError(err) {
            return boom.wrap(err);
        });
}

/**
 * remove the upstream p handlefrom any redirects
 * this is necessary to fix Apache's auto-appending of
 * trailing slashes to requests (e.g. coins.mrn.org/micis
 *  becomes coins.mrn.org/micis/).
 * @param {httpIncomingMessage} res is the response from
 * from the upstream server
 * @param {object} request is the original request
 * @return {httpIncomingMessage} the mutated res object
 */
function reformatRedirect(res, request) {
    var redirectUrl = url.parse(res.headers.location);
    if (redirectUrl.hostname === request.info.hostname) {
        // the redirect is to another resource on the same host
        // avoid redirecting the client to the upstream port
        redirectUrl.port = null;
        redirectUrl.protocol = 'https:';
        redirectUrl.host = redirectUrl.hostname;
        res.headers.location = url.format(redirectUrl);
    }

    return res;
}

var server = new hapi.Server();

var connectionOptions = {
    port: config.get('port'),
    host: config.get('host')
};

var goodOptions = {
    requestPayload: false,
    responsePayload: false,
    filter: {
        query: 'censor'
    },
    reporters: [
        {
            reporter: goodFile,
            config: './logs/ops.log',
            events: { ops: '*' }
        },
        {
            reporter: goodFile,
            config: './logs/response.log',
            events: { response: '*' }
        },
        {
            reporter: goodFile,
            config: './logs/error.log',
            events: { error: '*' }
        },
        {
            reporter: goodFile,
            config: './logs/request.log',
            events: { request: '*' }
        },
        {
            reporter: goodFile,
            config: './logs/log.log',
            events: { log: '*' }
        }
    ]
};

server.connection(connectionOptions);

server.route({
    method: '*',
    path: '/{path*}',
    handler: {
        proxy: {
            passThrough: true,
            redirects: false,
            xforward: false,
            mapUri: function(request, callback) {
                var headers = request.headers;
                /*
                if (headers['accept-encoding']) {
                    delete(headers['accept-encoding']);
                }
                */
                var uri = url.format({
                    protocol: 'http',
                    hostname: config.get('proxyToHost'),
                    port: config.get('proxyToPort'),
                    pathname: request.path,
                    query: request.query
                });
                callback(null, uri, headers);
            },

            onResponse: function(err, res, request, reply) {
                var context;
                function displayErrorView(err) {
                    err = boom.wrap(err);
                    context = {
                        errorCode: err.output.statusCode,
                        errorMessage: err.message,
                        requestPath: request.path,
                        requestId: request.id,
                        errorObj: JSON.stringify(err.output.payload)
                    };
                    return reply.view('error.jade', context)
                        .code(err.output.statusCode);
                }

                if (!err && res && res.headers.location) {
                    // the upstream server has issued a redirect
                    res = reformatRedirect(res, request);
                    return reply(res);
                } else if (!err && res.statusCode < 400) {
                    return reply(res);
                } else if (!err) {
                    return convertResponseToError(res, request, reply)
                        .then(displayErrorView);
                } else {
                    return displayErrorView(err);
                }
            }
        }
    }
});

server.route({
    method: 'GET',
    path: '/error/images/{path*}',
    handler: {
        directory: {
            path: __dirname + '/public/error/images',
            listing: true
        }
    }
});

server.views({
    engines: {
        jade: require('jade')
    },
    path: path.join(__dirname, 'templates')
});

server.register({
    register: good,
    options: goodOptions
}, function(err) {
    if (err) {
        console.error(err);
    } else {
        if (!module.parent) {
            server.start(function() {
                console.log('Server started', server.info.uri);
            });
        }
    }
});

module.exports = server;
