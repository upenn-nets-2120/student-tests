This is an example autograder, to upload it to gradescope, zip these files together and upload.

### Instructions for Administrators

To setup the autograder, first copy over all the files from this directory (`example-autograder`) to what you currently have for your Gradescope autograder (or just start with this). Then, replace the files in `sample-server` with the sample solution for the assignment. Finally, in `grader.py`, in the `start_server` function, modify the command needed to start the server. If it's a different server than the example (e.g. made in Java), that's fine, just replace the command so it runs the server. Finally, make suer that `setup.sh` correctly contains the setup for anything else you want autograded, but also runs the commands in the `setup.sh` we give you. The same thing goes for `run_autograder`. Finally, make sure to create a `.env` file. See the next section for more details. To add new tests, just modify `default-tests.json` accordingly. The format for `curl` tests is relatively straightforward, and `junit` tests are encoded in base64 (you can generate this by running `cat <path_to_test_file> | base64`).

### IMPORTANT

You must add a `.env` file in this directory with the following variables:

```
SERVER_IP=...
SERVER_PORT=...
AUTH_TOKEN=...
```

These correspond to the IP and port of the EC2 instance running the server to store the data and student tests. The auth token is also the token specified by this server (if you're running that too, it's the same as the one in the `.env` file for the server).

MAKE SURE TO INCLUDE THE `.env` FILE WHEN YOU ZIP IT TOGETHER!

If you are using JUnit tests for your assignment, please make sure to add the following plugin to your pom.xml so that the test results can be easily parsed:
```
<plugin>
<groupId>org.apache.maven.plugins</groupId>
<artifactId>maven-surefire-plugin</artifactId>
<version>3.2.5</version>
<configuration>
    <printSummary>true</printSummary>
    <useFile>false</useFile>
</configuration>
</plugin>
```