#!/usr/bin/env bash

SOCEX=`pwd`
mkdir -p static/id
mkdir static/md5
mkdir -p server/nginx/logs
chmod 777 server/nginx/logs

for i in babel-cli node-sass gulp bower node-gyp; do
    if [ 'Darwin' == `uname` ]; then
        npm install -g ${i}
    else
        sudo npm install -g ${i}
    fi
done

#sudo mkdir /usr/local/site/dep
#cd /usr/local/site/dep
#sudo mkdir server
#sudo mkdir socex
#sudo mkdir bower
#sudo mkdir test
#sudo chown -R $USER .
#cd $SOCEX
#ln -s /usr/local/site/dep/socex $SOCEX/node_modules
#ln -s /usr/local/site/dep/server $SOCEX/server/node_modules
#ln -s /usr/local/site/dep/bower $SOCEX/client/lib
#ln -s /usr/local/site/dep/test $SOCEX/test/node_modules

npm update
cd client
bower update
cd ../server
npm update
cd ../test
npm update

cd $SOCEX
gulp
