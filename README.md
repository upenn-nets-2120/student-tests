# student-tests

This framework is for having student created tests that are run against each other.

The `testit-server` directory has a docker container that runs a database and server to store test cases. It should be run separately, and permanently up, probably on some EC2 instance. More instructions in that folder.

The `example-autograder` directory provides an example autograder that uses this student test case framework. More instructions in that folder.
