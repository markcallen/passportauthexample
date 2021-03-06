# passportauthexample

Example nodejs passport application with local, basic and facebook authenication

## Setup

git clone https://github.com/markcallen/passportauthexample.git
cd passportauthexample
npm install

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

## Run

node app.js

## User Interface

http://localhost:8888

Press New Account

## Command Line
### Create account

curl -X POST -d '{"username":"markcallen","password":"admin","email":"mark@markcallen.com","firstname":"Mark","lastname":"Allen"}' -H 'Accept: application/json' -H 'Content-type: application/json' -c cookie.txt http://localhost:8888/api/account


### Query account (Basic)

curl --user markcallen:admin http://localhost:8888/api/account

### Query account (cookie)

curl -b cookie.txt http://localhost:8888/api/account
curl -X POST -d 'username=markcallen&password=admin' -c cookies.txt http://localhost:8888/auth/login


### Authenicate

curl -b cookie.txt http://localhost:8888/api/account

### Create oauth2 client

curl --user markcallen:admin -X POST -d '{"name": "sampleoauth2"}' -H 'Accept: application/json' -H 'Content-type: application/json' http://localhost:8888/api/client

## Test

in one window start up the app

grunt

in another window run the mocha tests

grunt test


To test the database run

grunt testdb


