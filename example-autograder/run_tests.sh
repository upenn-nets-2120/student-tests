#!/bin/bash

# this is written in a separate file for modularity, since maybe other autograders that use this
# test case grader will have different setup steps and parts of the autograder

# Run student tests against sample solution
# need to add student ID as query parameter before sending here (and in later requests)
# curl -X POST http://localhost:3000 -d @tests.json -H "Content-Type: application/json" > results.json

# Submit student tests to database if successful
# ...

# Run returned tests against student solution
# ...
