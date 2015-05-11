var utils = require('../utils');

module.exports = function(params) {

  var mongoose = params.mongoose;
  var Schema = mongoose.Schema;
  var ObjectId = Schema.ObjectId;

  var PermissionSchema = new Schema({
      clientId: {type: String, required: true},
      userId: {type: String, required: true},
      access: {type: String},
      created: {type: Date, default: Date.now}
  });

  mongoose.model('Permission', PermissionSchema);
  var Permission = mongoose.model('Permission');

  return Permission;

};
