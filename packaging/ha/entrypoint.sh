#!/bin/sh
set -eu
# /data is this app's private Supervisor volume, including restored membership files.
# Supervisor writes options.json as root at each start. Drop privileges before Node.
mkdir -p /data
chown -R node:node /data
exec node ha/launcher.mjs
