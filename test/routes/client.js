var should = require('should'); 
var assert = require('assert');
var request = require('supertest');  
var fs = require('fs');

var helper = require('../helper.js');
var stduser = helper.stduser;
var stdclient = helper.stdclient;

describe('Client API', function() {
    before(function(done) {
        helper.createUser(stduser, function(err, user) {
          stduser.id = user.id;
          done();
        });
    });

    describe('Client', function() { 
      it('create a new client', function(done) {
        request(helper.url)
        .post('/api/client')
	.send({name: stdclient.name})
        .expect(200) //Status code
	.auth(stduser.username, stduser.password)
        .end(function(err, res) {
          if (err) {
            throw err;
          }
          res.body.should.have.property('_id');
          stdclient.id = res.body._id;

          done();
        });
      });
      it('list a client', function(done) {
        request(helper.url)
        .get('/api/client/' + stdclient.id)
	.auth(stduser.username, stduser.password)
        .expect(200)
        .end(function(err, res) {
          if (err) {
            throw err;
          }
          res.body.should.containEql({'_id': stdclient.id});
          done();
        });
      });
    });

    after(function(done) {
      helper.deleteClient(stdclient, function(err, client) {
        helper.deleteUser(stduser, function(err, user) {
          done();
        });
      });
    });

});
