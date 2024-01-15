#!/bin/bash

sudo apt-get update
sudo apt-get install -y python3 python3-pip curl nodejs npm

cd /autograder/source/sample-server

npm install

pip3 install requests
