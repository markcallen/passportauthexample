Setup

Mongodb

API

Create account

curl -X POST -d '{"username":"markcallen","password":"admin","email":"mark@markcallen.com","firstname":"Mark","lastname":"Allen"}' -H 'Accept: application/json' -H 'Content-type: application/json' -c cookie.txt http://localhost:8888/api/account


Query account (Basic)

curl --user markcallen:admin http://localhost:8888/api/account

Query account (cookie)

curl -b cookie.txt http://localhost:8888/api/account
curl -X POST -d 'username=markcallen&password=admin' -c cookies.txt http://localhost:8888/auth/login


Authenicate

curl -b cookie.txt http://localhost:8888/api/account
