/*jshint expr: true*/

var should = require('should'); 
var assert = require('assert');
var helper = require('../helper');

var stdclient = helper.stdclient;

describe("Clients", function(){  
  it("create new client", function(done){    
    helper.createClient(function(err, client){      
      client.id.should.be.ok;      
      client.clientId.should.be.ok;
      client.clientSecret.should.be.ok;
      stdclient.id = client.id
      done();    
    });  
  });

  it("delete standard client", function(done){    
    helper.deleteClient(stdclient, function(err, client){      
      done();    
    });  
  });

});

