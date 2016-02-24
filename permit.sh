#!/bin/bash
mkdir static
mkdir static/photo
mkdir static/file
mkdir static/md5
mkdir -p static/video/thumbnail
mkdir -p static/upload/video
ln -s $PWD/static/video app/video
ln -s $PWD/static/photo app/photo
ln -s $PWD/static/file app/file
ln -s $PWD/static/md5 app/md5
mkdir server/nginx/logs
chmod 777 server/nginx/logs
if [ -f /usr/local/bin/mongod ]
then
    mkdir server/mongodb/data
    chmod 777 server/mongodb/data
    /usr/local/bin/mongod --dbpath=server/mongodb/data &
    ps -A | grep mongod
fi
