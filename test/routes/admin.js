var should = require('should'); 
var assert = require('assert');
var request = require('supertest');  
var fs = require('fs');

var helper = require('../helper.js');
var adminuser = helper.adminuser;
var stduser = helper.stduser;

describe('Admin API', function() {
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
          res.body.should.have.property('_id');
          stduser.id = res.body._id;

          done();
        });
      });
      it('list all accounts', function(done) {
        request(helper.url)
        .get('/admin/accounts')
        .expect(200)
        .auth(adminuser.username, adminuser.password)
        .end(function(err, res) {
          if (err) {
            throw err;
          }
          res.body.should.containDeep([{'_id': adminuser.id}]);
          res.body.should.containDeep([{'_id': stduser.id}]);
          done();
        });
      });
      it('list a user account', function(done) {
        request(helper.url)
        .get('/admin/account/' + stduser.id)
        .expect(200)
        .auth(adminuser.username, adminuser.password)
        .end(function(err, res) {
          if (err) {
            throw err;
          }
          res.body.should.containEql({'_id': stduser.id});
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
