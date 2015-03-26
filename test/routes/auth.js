var should = require('should'); 
var assert = require('assert');
var request = require('supertest');  
var superagent = require('superagent');  
var fs = require('fs');

var helper = require('../helper.js');
var adminuser = helper.adminuser;
var stduser = helper.stduser;

describe('Auth API', function() {
    before(function(done) {
        helper.createUser(adminuser, function(err, user) {
          adminuser.id = user.id;
          done();
        });
    });

    var agent = superagent.agent();

    describe('Account', function() { 
      it('create a new account', function(done) {
        request(helper.url)
        .post('/api/account')
        .send({username: stduser.username, password: stduser.password, email: stduser.email, firstname: 'Mocha', lastname: 'Test'})
        .expect(200) //Status code
        .end(function(err, res) {
          if (err) {
            throw err;
          }
          res.body.should.have.property('_id');
          stduser.id = res.body._id;

          done();
        });
      });
      it('login', function(done) {
        request(helper.url)
        .post('/auth/login')
        .send({username: stduser.username, password: stduser.password})
        .expect(302)
        .end(function(err, res) {
          if (err) {
            throw err;
          }
          //@TODO: should return something
          agent.saveCookies(res);
          done();
        });
      });
      it('list a user account', function(done) {
        var req = request(helper.url).get('/api/account');
        agent.attachCookies(req);
        req
        .expect(200)
        .end(function(err, res) {
          if (err) {
            throw err;
          }
          res.body.should.containEql({'username': stduser.username});
          stduser.id = res.body._id;
          done();
        });
      });
      it('logout', function(done) {
        request(helper.url)
        .get('/auth/logout')
        .expect(302)
        .end(function(err, res) {
          if (err) {
            throw err;
          }
          //@TODO: should return something
          agent.saveCookies(res);
          done();
        });
      });
      it('list a user account after logout', function(done) {
        var req = request(helper.url).get('/api/account');
        agent.attachCookies(req);
        req
        .expect(401)
        .end(function(err, res) {
          if (err) {
            throw err;
          }
          //@TODO: should return something
          done();
        });
      });
      it('delete a user account', function(done) {
        request(helper.url)
        .delete('/admin/account/' + stduser.id)
        .expect(200)
        .auth(adminuser.username, adminuser.password)
        .end(function(err, res) {
          if (err) {
            throw err;
          }
          //@TODO: look for something
          done();
        });
      });
    });

    after(function(done) {
      helper.deleteUser(adminuser, function(err, user) {
        done();
      });
    });

});
