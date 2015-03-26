var utils = require('../utils.js');
var uuid = require('node-uuid');

module.exports = function(params) {

  var mongoose = params.mongoose;
  var Schema = mongoose.Schema;
  var ObjectId = Schema.ObjectId;

  var UserSchema = new Schema({
    username: {type: String, required: true, unique: true},
      passwordHash: {type: String},
      salt: {type: String, required: true, default: uuid.v1},
      firstname: {type: String},
      lastname: {type: String},
      email: {type: String, required: true, unique: true},
      pubkey: {type: String},
      privkey: {type: String},
      isadmin: {type: Boolean, default: false},
      verifiedEmail: {type: Boolean, default: false},
      verifySalt: {type: String},
      recoverSalt: {type: String},
      externalAuth: {type: String},
      externalId: {type: String},
      externalToken: {type: String},
      created: {type: Date, default: Date.now}
  });


  UserSchema.methods.setPassword = function(passwordString) {
    this.passwordHash = utils.hash(passwordString, this.salt);
  };

  UserSchema.methods.isPasswordValid = function(passwordString) {
    return (this.passwordHash === utils.hash(passwordString, this.salt));
  };

  UserSchema.methods.createVerifySalt = function() {
    var buffer = new Array(32);
    uuid.v4(null, buffer, 0);
    this.recoverSalt = uuid.unparse(buffer);
  };

  UserSchema.methods.sanitizeUser = function() {
    var suser = (this !== undefined ? this.toJSON() : undefined);
    if (suser !== undefined) {
      delete suser.passwordHash;
      delete suser.salt;
      delete suser.recoverSalt;
      delete suser.verifySalt;
      delete suser.privkey;
      delete suser.isadmin;
    }
    return suser;
  };

  UserSchema.methods.checkName = function() {
    var re = /^(?=.{1,255}$)[0-9A-Za-z](?:(?:[0-9A-Za-z]|\b-){0,61}[0-9A-Za-z])?(?:\.[0-9A-Za-z](?:(?:[0-9A-Za-z]|\b-){0,61}[0-9A-Za-z])?)*\.?$/;
    return re.test(this.name);
  };

  UserSchema.methods.checkEmail = function() {
    return utils.checkEmail(this.email);
  };

  mongoose.model('User', UserSchema);
  var User = mongoose.model('User');

  return User;

};
