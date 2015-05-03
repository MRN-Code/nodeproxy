'use strict';

var should = require('should');
var server = require('./../');
var defaultOptions = {
    method: 'GET',
    url: '/test'
};
var serverFixture;

describe('Proxy', function() {
    before('start test server to proxy to', function () {
        var spawn = require('child_process').spawn;
        serverFixture = spawn('node', ['./fixtures/server.js']);
        serverFixture.on('close', function(code) {
            console.log('Fixture server shut down successfully: ' + code);
        });
    });
    after('stop test server', function() {
        serverFixture.kill();
    });
    it('should proxy a request to the test server', function(done) {
        server.inject(defaultOptions, function(response) {
            response.result.should.be.eql('{ message: "success", warning: null }');
        });
    });
});
