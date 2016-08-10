#!/usr/bin/env bash

set -e

SERVER=/usr/local/socex/server
NAME=socex
PID=/run/$NAME.pid
LOG=/usr/local/socex/server/log

start()
{
    if [ -z $LOG ]
    then
        mkdir $LOG
    fi
    forever start --pidFile $PID $SERVER/server.js -o $LOG/service-output.log -e $LOG/service-error.log
}

stop()
{
    forever stop  --pidFile $PID $SERVER/server.js
}


case "$1" in
    start)
        start
        ;;
    stop)
        stop
        ;;
    restart)
        stop
        start
        ;;
    *)
	    echo "Usage: "$1" {start|stop|restart}"
	    exit 1
esac

exit 0
