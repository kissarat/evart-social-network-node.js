#!/bin/bash
mkdir static
mkdir static/photo
mkdir -p static/video/thumbnail
mkdir static/upload/video
mkdir server/nginx/logs
chmod 777 server/nginx/logs
if [ -f /usr/local/bin/mongod ]
then
    mkdir server/mongodb/data
    chmod 777 server/mongodb/data
    /usr/local/bin/mongod --dbpath=server/mongodb/data &
fi
