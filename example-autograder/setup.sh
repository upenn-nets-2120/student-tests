#!/bin/bash

sudo apt-get update
sudo apt-get install -y curl nodejs npm

cd /autograder/source/sample-server

npm install
