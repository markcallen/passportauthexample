var ConnectRoles = require('connect-roles');

module.exports = function() {

  var connectroles = new ConnectRoles({
    failureHandler: function (req, res, action) {
      // optional function to customise code that runs when
      // user fails authorisation
      var accept = req.headers.accept || '';
      res.status(403);
      if (~accept.indexOf('html')) {
        res.render('access-denied', {action: action});
      } else {
        res.send('Access Denied - You don\'t have permission to: ' + action);
      }
    }
  });

connectroles.use(function (req, action) {
  if (! req.isAuthenticated()) {
      return action === 'anonymous';
  }

  // Check to see if the user has the requested action as a role
  if (action instanceof Array) {
    if (req.user.roles) {
      for (var i in action) {
        for (var j in req.user.roles) {
          if (action[i] == req.user.roles[j]) {
            return true;
          }
        }
      }
    }
  }
});

return connectroles;

};
