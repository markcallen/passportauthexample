/*jshint expr: true*/

var should = require('should'); 
var assert = require('assert');
var helper = require('../helper');

var stduser = helper.stduser;
var adminuser = helper.adminuser;

describe("Users", function(){  
  it("create standard user", function(done){    
    helper.createUser(stduser, function(err, user){      
      user.id.should.be.ok;      
      user.salt.should.be.ok;
      user.passwordHash.should.be.ok;
      user.isadmin.should.be.false;
      stduser.id = user.id;
      done();    
    });  
  });

  it("delete standard user", function(done){    
    helper.deleteUser(stduser, function(err, user){      
      done();    
    });  
  });

  it("create admin user", function(done){    
    helper.createUser(adminuser, function(err, user){      
      user.id.should.be.ok;      
      user.salt.should.be.ok;
      user.passwordHash.should.be.ok;
      user.isadmin.should.be.true;
      adminuser.id = user.id;
      done();    
    });  
  });

  it("delete admin user", function(done){    
    helper.deleteUser(adminuser, function(err, user){      
      done();    
    });  
  });

});

