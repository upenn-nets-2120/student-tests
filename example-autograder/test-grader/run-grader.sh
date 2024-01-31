#!/bin/bash

cd /autograder/source/test-grader

if [ -f .env ]; then
    export $(cat .env | xargs)
fi

cd /autograder/submission

python3 /autograder/source/test-grader/grader.py
