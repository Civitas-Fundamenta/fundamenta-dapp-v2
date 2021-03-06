#!/bin/bash
dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

reset

rm -rf ${dir}/build

source ${dir}/credentials

function _deploy_file() {
    HOST=$1
    SRC=$2
    DEST=$3
    echo Deploying file ${SRC} to ${HOST}:${DEST}
    rsync --rsh="ssh -i ${SSH_KEY} -p ${PORT}" ${dir}/${SRC} ${USER}@${HOST}:${DEST}
}

function _deploy_directory() {
    HOST=$1
    SRC=$2
    DEST=$3
    echo Deploying directory ${SRC} to ${HOST}:${DEST}
    rsync --rsh="ssh -i ${SSH_KEY} -p ${PORT}" -r ${dir}/${SRC} ${USER}@${HOST}:${DEST}
}

npm run build

files=(
    asset-manifest.json
    favicon.ico
    index.html
    logo192.png
    logo512.png
    manifest.json
    robots.txt
)

for i in "${files[@]}"; do
    _deploy_file ${SERVER} "build/$i" "/var/www/html/$i"
done

_deploy_directory ${SERVER} "build/static" "/var/www/html"
