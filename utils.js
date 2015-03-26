var crypto = require('crypto');
var uuid = require('node-uuid');
var email = require('config').Email;
var server = require('config').Server;
var aws = require('config').AWS;

// Setup SMTP
//@TODO: need to change this to something that doesn't require AWS keys for testing
var nodemailer = require("nodemailer");
var ses = require('nodemailer-ses-transport');
var transport = nodemailer.createTransport(ses({
  accessKeyId: aws.awsAccessKey,
  secretAccessKey: aws.awsSecretKey
}));

function hash(passwd, salt) {
  return crypto.createHmac('sha256', salt).update(passwd).digest('hex');
}



module.exports = {

  hash: function(passwd, salt) {
          return hash(passwd, salt);
        },

  salt: function() {
          var buffer = new Array(32);
          uuid.v4(null, buffer, 0);
          return uuid.unparse(buffer);
        },

  updateModel: function(body, model, callback) {
                 for(var obj in body){
                   if (body[obj] instanceof Array) {
                     model[obj] = body[obj];
                   } else if (body[obj] instanceof Object) {
                     model[obj] = body[obj]._id;
                   } else {
                     model[obj] = body[obj];
                   }
                 }

                 if (callback) { callback(model); }
               },

  ArrayHasJsonEntry: function(arr, obj) {
                       var key = Object.keys(obj)[0];
                       var val = obj[key];
                       for (var i=0; i < arr.length; i++) {
                         if (arr[i][key] == val) {
                           return true;
                         }
                       }
                       return false;
                     },

  ArrayDeleteJsonEntry: function(arr, obj) {
                          var key = Object.keys(obj)[0];
                          var val = obj[key];
                          for (var i=0; i < arr.length; i++) {
                            //console.log(arr[i][key] + ", " + val);
                            if (arr[i][key] == val) {
                              arr.splice(i, 1);
                              return arr;
                            }
                          }
                          return arr;
                        },

  ArrayHasEntry: function(arr, val) {
                   for (var i=0; i < arr.length; i++) {
                     if (arr[i] == val) {
                       return true;
                     }
                   }
                   return false;
                 },

  ArrayDeleteEntry: function(arr, val) {
                      for (var i=0; i < arr.length; i++) {
                        if (arr[i] == val) {
                          arr.splice(i, 1);
                          return arr;
                        }
                      }
                      return arr;
                    },

  checkEmail: function(email) {
                var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
                return re.test(email);
              },

  verifyEmail: function(user, cb) {
                 if (! user) {
                   if (cb) { cb("utils.verifyEmail: No user defined", null); }
                   return;
                 }
                 var url = server.servername + "/#verify/" + user.email + "/" + hash(user.email, user.verifySalt);
                 var textData = "Use this URL to verify your account: " + url;
                 var htmlData = "Use this URL to verify your account: <a href=\"" + url + "\">" + url + "</a>";
                 var message = {
                   to: user.email,
                   from: email.senderaddress,
                   subject: 'Verify Account',
                   text: textData,
                   html: htmlData
                 };
                 transport.sendMail(message, function(err){
                   if (cb) { cb(err, "Message Sent"); }
                 });
               },

  forgottenPasswordEmail: function(user, cb) {
                            if (! user) {
                              if (cb) { cb("utils.forgottenPasswordEmail: No user defined", null); }
                              return;
                            }
                            var url = server.servername + "/#recover/" + user.username + "/" + hash(user.username, user.recoverSalt);
                            var textData = "Use this URL to recover your account: " + url;
                            var htmlData = "Use this URL to recover your account: <a href=\"" + url + "\">" + url + "</a>";
                            var message = {
                              to: user.email,
                              from: config.senderaddress,
                              subject: 'Forgotten Password',
                              text: textData,
                              html: htmlData
                            };
                            transport.sendMail(message, function(err){
                              if (cb) { cb(err, "Message sent"); }
                            });
                          },

  fullnameToRole: function(name) {
                    if (name) {
                      name = name.replace(/\./g, '_');
                    }

                    return name;
                  },

  checkDnsName: function(name) {
                  var re = /^(?=.{1,255}$)[0-9A-Za-z](?:(?:[0-9A-Za-z]|\b-){0,61}[0-9A-Za-z])?(?:\.[0-9A-Za-z](?:(?:[0-9A-Za-z]|\b-){0,61}[0-9A-Za-z])?)*\.?$/;
                  return re.test(name);
                },

  getRoute53: function(servername, cb) {
                var params = {
                  HostedZoneId : config.route53.zoneid,
                  Type: 'A',
                  Name: servername.toLowerCase() + '.' + config.route53.domainname 
                };
                r53.ListResourceRecordSets(params, function(err, data) {
                  var result = { };
                  if (! err) {
                    for(var rec in data.Body.ListResourceRecordSetsResponse.ResourceRecordSets.ResourceRecordSet) {
                      if (data.Body.ListResourceRecordSetsResponse.ResourceRecordSets.ResourceRecordSet[rec].Name == servername.toLowerCase() + '.' + config.route53.domainname + '.') {
                        result = data.Body.ListResourceRecordSetsResponse.ResourceRecordSets.ResourceRecordSet[rec];
                        break;
                      }
                    }
                  }
                  cb && cb(err, result);
                });
              },

  updateRoute53: function(server, cb) {
                   getRoute53(server.name, function(err, r53data) {
                     if (err) {
                       return cb && cb(err, null);
                     }
                     var resourceRecords = [];
                     var changes = new Array();
                     if (r53data.ResourceRecords) {
                       resourceRecords.push(r53data.ResourceRecords.ResourceRecord.Value);
                       changes.push({
                         Action          : 'DELETE',
                         Name            : r53data.Name,
                         Type            : r53data.Type,
                         Ttl             : r53data.TTL,
                         ResourceRecords : resourceRecords
                       });
                     }
                     ec2.DescribeInstances({"InstanceId": [server.instance]}, function(err, result) {
                       if (err) {
                         return cb && cb(err, null);
                       }
                       console.log(result);
                       resourceRecords = new Array();
                       resourceRecords.push(result.reservationSet.item.instancesSet.item.ipAddress);
                       changes.push({
                         Action          : 'CREATE',
                         Name            : server.name.toLowerCase() + '.' + config.route53.domainname + '.',
                         Type            : 'A',
                         Ttl             : '60',
                         ResourceRecords : resourceRecords
                       });
                       var params = {
                         HostedZoneId : config.route53.zoneid,
                     Comment: 'Updating ' + server.name.toLowerCase() + '.' + config.route53.domainname,
                     Changes: changes
                       };
                       r53.ChangeResourceRecordSets(params, function(err, data) {
                         cb && cb(err, data);
                       });
                     });
                   });
                 },

  cnameRoute53: function(server, cb) {
                  getRoute53(server.name, function(err, r53data) {
                    if (err) {
                      return cb && cb(err, null);
                    }
                    var resourceRecords = new Array();
                    if (r53data.ResourceRecords) {
                      resourceRecords.push(r53data.ResourceRecords.ResourceRecord.Value);
                      var changes = new Array();
                      changes.push({
                        Action          : 'DELETE',
                        Name            : r53data.Name,
                        Type            : r53data.Type,
                        Ttl             : r53data.TTL,
                        ResourceRecords : resourceRecords
                      });
                    }
                    resourceRecords = new Array();
                    resourceRecords.push(config.route53.cname);
                    changes.push({
                      Action          : 'CREATE',
                      Name            : server.name.toLowerCase() + '.' + config.route53.domainname + '.',
                      Type            : 'CNAME',
                      Ttl             : '60',
                      ResourceRecords : resourceRecords
                    });
                    var params = {
                      HostedZoneId : config.route53.zoneid,
                      Comment: 'Deleting ' + server.name.toLowerCase() + '.' + config.route53.domainname,
                      Changes: changes
                    }
                    r53.ChangeResourceRecordSets(params, function(err, data) {
                      cb && cb(err, data);
                    });
                  });
                },

  deleteRoute53: function(servername, cb) {
                   getRoute53(servername, function(err, r53data) {
                     if (err) {
                       return cb && cb(err, null);
                     }
                     var resourceRecords = new Array();
                     if (r53data.ResourceRecords) {
                       resourceRecords.push(r53data.ResourceRecords.ResourceRecord.Value);
                       var changes = new Array();
                       changes.push({
                         Action          : 'DELETE',
                         Name            : r53data.Name,
                         Type            : r53data.Type,
                         Ttl             : r53data.TTL,
                         ResourceRecords : resourceRecords
                       });
                     }
                     var params = {
                       HostedZoneId : config.route53.zoneid,
                   Comment: 'Deleting ' + servername.toLowerCase() + '.' + config.route53.domainname,
                   Changes: changes
                     }
                     r53.ChangeResourceRecordSets(params, function(err, data) {
                       cb && cb(err, data);
                     });
                   });
                 },


  sizeMap:  {"tiny": "t1.micro",
              "small": "m1.small",
              "medium": "m1.medium",
              "large": "m1.large",
              "xlarge": "m1.xlarge"
            },


};
