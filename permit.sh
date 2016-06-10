#!/bin/bash
mkdir -p static/id
mkdir static/md5
ln -s $PWD/static/video app/video
ln -s $PWD/static/photo app/photo
ln -s $PWD/static/file app/file
ln -s $PWD/static/md5 app/md5
mkdir server/nginx/logs
chmod 777 server/nginx/logs
if [ -f /usr/local/bin/mongod ]
then
    mkdir -p server/mongodb/data
    chmod 777 server/mongodb/data
    /usr/local/bin/mongod --dbpath=server/mongodb/data &
    ps -A | grep mongod
fi
