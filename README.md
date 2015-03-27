# passportauthexample

Example nodejs passport application with local, basic and facebook authenication

## Configure

Create config/local.json

add the following:

```
{
  "AWS": {
    "awsAccessKey": "<your aws access key>",
    "awsSecretKey": "<your aws secret key>"
  },
  
  "Facebook": {
    "appID": "<facebook appid>",
    "appSecret": "<facebook appsecret>",
    "callbackURL": "http://localhost:8888/auth/facebook/callback"
  }
}
```


## Test

in one window start up the app

grunt

in another window run the mocha tests

grunt test


To test the database run

grunt testdb


