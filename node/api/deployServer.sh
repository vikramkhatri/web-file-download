#!/bin/bash

if [ $(id -u) -ne 0 ] ; then
   echo "This script $0 needs to run as root" 1>&2
   exit 1
fi

SERVICENAME=api
PORT=3000
DIR=/node/api
mkdir -p $DIR/log 
chown -R nginx.nginx $DIR

cat << EOF > /lib/systemd/system/${SERVICENAME}.service
[Unit]
Description=API server
Documentation=https://zinox.com
After=network.target

[Service]
Environment=NODE_PORT=$PORT
Type=simple
User=nginx
WorkingDirectory=${DIR}
ExecStart=/usr/bin/node ${DIR}/server.js
StandardOutput=append:${DIR}/log/apiout.log
StandardError=append:${DIR}/log/apierror.log
Restart=on-failure

[Install]
WantedBy=multi-user.target
EOF

systemctl enable $SERVICENAME
systemctl start  $SERVICENAME
systemctl status $SERVICENAME
