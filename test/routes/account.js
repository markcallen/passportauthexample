var should = require('should'); 
var assert = require('assert');
var request = require('supertest');  
var superagent = require('superagent');
var fs = require('fs');

var helper = require('../helper');

var adminuser = helper.adminuser;
var stduser = helper.stduser;

describe('Account API', function() {

  var agent = superagent.agent();

  before(function(done) {
    helper.createUser(adminuser, function(err, user) {
      adminuser.id = user.id;
      done();
    });
  });

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
        // this is should.js syntax, very clear
        res.body.should.have.property('_id');
        stduser.id = res.body._id;

        done();
      });
    });
    it('fail creating an account with a duplicate email', function(done) {
      request(helper.url)
      .post('/api/account')
      .send({username: stduser.username, password: stduser.password, email: stduser.email, firstname: 'Mocha', lastname: 'Test'})
      //@TODO: change 500 errors to include json
      .expect('Content-Type', /text/)
      .expect(500) //Status code
      .end(function(err, res) {
        if (err) {
          throw err;
        }
        done();
      });
    });
    it('list current user account - httpauth', function(done) {
      request(helper.url)
      .get('/api/account')
      .auth(stduser.username, stduser.password)
      .expect(200)
      .end(function(err, res) {
        if (err) {
          throw err;
        }
        res.body.should.containEql({'_id': stduser.id});
        done();
      });
    });
    it('authorization required for account', function(done) {
      request(helper.url)
      .get('/api/account')
      .expect(401)
      .end(function(err, res) {
        if (err) {
          throw err;
        }
        res.body.should.have.keys('err');
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
    helper.deleteUser(adminuser, function(err, user){      
      done();    
    });  
  });
});

describe('Account API (ajax)', function() {

  var agent = superagent.agent();

  before(function(done) {
    helper.createUser(adminuser, function(err, user) {
      adminuser.id = user.id;
      done();
    });
  });

  describe('Account', function() {
    it('create a new accountajax', function(done) {
      request(helper.url)
      .post('/api/accountajax')
      .send({username: stduser.username, password: stduser.password, email: stduser.email, firstname: 'Mocha', lastname: 'Test'})
      .expect(302) //Status code
      .end(function(err, res) {
        if (err) {
          throw err;
        }
        // this is should.js syntax, very clear
        agent.saveCookies(res);

        done();
      });
    });
    it('list current users account - cookies', function(done) {
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
    helper.deleteUser(adminuser, function(err, user){      
      done();    
    });  
  });
});
