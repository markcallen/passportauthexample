var utils = require('../utils');

module.exports = function(params) {

  var mongoose = params.mongoose;
  var Schema = mongoose.Schema;
  var ObjectId = Schema.ObjectId;

  var AuthorizationCodeSchema = new Schema({
      code: {type: String, required: true},
      clientId: {type: String, required: true},
      redirectUri: {type: String, required: true},
      userId: {type: String, required: true},
      created: {type: Date, default: Date.now}
  });

  mongoose.model('AuthorizationCode', AuthorizationCodeSchema);
  var AuthorizationCode = mongoose.model('AuthorizationCode');

  return AuthorizationCode;

};
