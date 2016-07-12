#!/usr/bin/env bash

mkdir -p static/id
mkdir static/md5
mkdir -p server/nginx/logs
chmod 777 server/nginx/logs

for i in babel-cli node-sass gulp bower
do
    if [ 'Darwin' == `uname` ]
    then
        npm install -g ${i}
    else
        sudo npm install -g ${i}
    fi
done
npm update
cd client
bower update
cd ../server
npm update
cd ../test
npm update

cd ..
gulp
