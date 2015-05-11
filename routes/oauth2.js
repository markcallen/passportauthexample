var utils = require('../utils');
var oauth2orize = require('oauth2orize')
var localAuth = require('config').LocalAuth;
var login = require('connect-ensure-login');
var ClientPasswordStrategy = require('passport-oauth2-client-password').Strategy;
var BearerStrategy = require('passport-http-bearer').Strategy

// oauth2 Authentication

module.exports = function(params) {

  var app = params.app;
  var Client = params.models.client;
  var User = params.models.user;
  var AccessToken = params.models.accesstoken;
  var AuthorizationCode = params.models.authorizationcode;
  var Permission = params.models.permission;
  var passport = params.passport;

passport.use(new ClientPasswordStrategy(
  function(clientId, clientSecret, done) {
    Client.findOne({clientId: clientId}, function(err, client) {
      if (err) { return done(err); }
      if (!client) { return done(null, false); }
      if (client.clientSecret != clientSecret) { return done(null, false); }
      return done(null, client);
    });
  }
));

passport.use(new BearerStrategy(
  function(accessToken, done) {
    AccessToken.findOne(accessToken, function(err, token) {
      if (err) { return done(err); }
      if (!token) { return done(null, false); }

      if(token.userId != null) {
          User.findById(token.userId, function(err, user) {
              if (err) { return done(err); }
              if (!user) { return done(null, false); }
              // to keep this example simple, restricted scopes are not implemented,
              // and this is just for illustrative purposes
              var info = { scope: '*' }
              done(null, user, info);
          });
      } else {
          //The request came from a client only since userID is null
          //therefore the client is passed back instead of a user
          Client.findById(token.clientId, function(err, client) {
             if(err) { return done(err); }
             if(!client) { return done(null, false); }
             // to keep this example simple, restricted scopes are not implemented,
             // and this is just for illustrative purposes
             var info = { scope: '*' }
             done(null, client, info);
          });
      }
    });
  }
));

// create OAuth 2.0 server
var server = oauth2orize.createServer();

server.serializeClient(function(client, done) {
  return done(null, client.id);
});

server.deserializeClient(function(id, done) {
  Client.findById(id, function(err, client) {
    if (err) { return done(err); }
    return done(null, client);
  });
});

server.grant(oauth2orize.grant.code(function(client, redirectURI, user, ares, done) {

  var authorizationCode = new AuthorizationCode();
  authorizationCode.code = utils.randomId(16);
  authorizationCode.clientId = client.id;
  authorizationCode.redirectUri = redirectURI;
  authorizationCode.userId = user.id;
  authorizationCode.save(function(err, authorizationCode) {
    if (err) { return done(err); }
    done(null, authorizationCode.code);
  });
}));

server.grant(oauth2orize.grant.token(function(client, user, ares, done) {
  var token = utils.randomId(256);

  console.log("oauth2orize.grant.token");

  db.accessTokens.save(token, user.id, client.clientId, function(err) {
      if (err) { return done(err); }
      done(null, token);
  });
}));

server.exchange(oauth2orize.exchange.code(function(client, code, redirectURI, done) {
  AuthorizationCode.findOne({code: code}, function(err, authCode) {
    if (err) { return done(err); }
    if (client.id !== authCode.clientId) { return done(null, false); }
    if (redirectURI !== authCode.redirectUri) { return done(null, false); }

    var accessToken = new AccessToken();
    accessToken.token = utils.randomId(256);
    accessToken.userId = authCode.userId;
    accessToken.clientId = authCode.clientId;
    accessToken.save(function(err) {
      if (err) { return done(err); }
      done(null, accessToken.token);
    });
  });
}));

server.exchange(oauth2orize.exchange.password(function(client, username, password, scope, done) {

    console.log("oauth2orize.exchange.password");

    //Validate the client
    client.findOne({clientId: client.clientId}, function(err, localClient) {
        if (err) { return done(err); }
        if(localClient === null) {
            return done(null, false);
        }
        if(localClient.clientSecret !== client.clientSecret) {
            return done(null, false);
        }
        //Validate the user
        User.findOne({username: username}, function(err, user) {
            if (err) { return done(err); }
            if(user === null) {
                return done(null, false);
            }
            if(password !== user.password) {
                return done(null, false);
            }
            //Everything validated, return the token
            var token = utils.randomId(256);
            db.accessTokens.save(token, user.id, client.clientId, function(err) {
                if (err) { return done(err); }
                done(null, token);
            });
        });
    });
}));

server.exchange(oauth2orize.exchange.clientCredentials(function(client, scope, done) {

    console.log("oauth2orize.exchange.clientCredentials");

    //Validate the client
    Client.findOne({clientId: client.clientId}, function(err, localClient) {
        if (err) { return done(err); }
        if(localClient === null) {
            return done(null, false);
        }
        if(localClient.clientSecret !== client.clientSecret) {
            return done(null, false);
        }
        var token = utils.randomId(256);
        //Pass in a null for user id since there is no user with this grant type
        db.accessTokens.save(token, null, client.clientId, function(err) {
            if (err) { return done(err); }
            done(null, token);
        });
    });
}));

  app.get('/dialog/authorize', 
    login.ensureLoggedIn(localAuth.loginUrl),
    server.authorization(function(clientID, redirectURI, done) {
      Client.findOne({clientId: clientID}, function(err, client) {
        if (err) { return done(err); }
        // WARNING: For security purposes, it is highly advisable to check that
        //          redirectURI provided by the client matches one registered with
        //          the server.  For simplicity, this example does not.  You have
        //          been warned.
        return done(null, client, redirectURI);
      });
    }),
    function(req, res, next){
      Permission.find({clientId: req.oauth2.client.id, userId: req.user.id}, function(err, permissions) {
	if (permissions.length == 0) {
          return res.render('dialog', { transactionID: req.oauth2.transactionID, user: req.user, client: req.oauth2.client });
	} else {
          req.body.transaction_id = req.oauth2.transactionID;
          next();
	}
      });
    },
    server.decision()
  );

  app.post('/dialog/authorize/decision', 
    login.ensureLoggedIn(localAuth.loginUrl),
    function(req, res, next) {
      if (! req.body.cancel) {
        var permission = new Permission();
	permission.clientId = req.body.client_id;
	permission.userId = req.user.id;
	permission.save(function(err) {
	  if (err) {
            console.log(err);
	  }
	});
      }
      next();
    },
    server.decision()
  );

  app.post('/oauth/token', 
    passport.authenticate(['basic', 'oauth2-client-password'], { session: false }),
    server.token(),
    server.errorHandler()
  );

}
