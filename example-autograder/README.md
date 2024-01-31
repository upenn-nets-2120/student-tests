This is an example autograder, to upload it to gradescope, zip these files together and upload.

### Instructions for Administrators

To setup the autograder, follow the following steps:

1. You may start either with an existing autograder, or just copy everything from this directory (`example-autograder`). If you already have an existing grader, you don't need to copy the `run_autograder` and `setup.sh`. Instead, add on the single line of each of these to the end of your corresponding files.

2. In the `test-grader` folder, modify the `config.json` to match what you want. You can find a description of the variables below. It is important that you include the `assignmenTitle` field (and preferably it should match the Gradescope assignment title, but this isn't required and it should still work).

3. Again, in the `test-grader` folder, add a `.env` file that includes 3 variables:

    ```
    SERVER_IP=...
    SERVER_PORT=...
    AUTH_TOKEN=...
    ```

    These correspond to the server IP and port that the backend server and database is running on (probably an EC2 instance or something similar). The `AUTH_TOKEN` is the token that this server requires to authenticate Gradescope. Set it to be the value of the token required by the server (which is set in the `.env` file in the `testit-server` server directory when it's started). Make sure this `.env` file is included when zipping the autograder, but it should be by default.

4. In the `sample-server` directory, add in all files required to run your sample solution to the assignment. You may delete/replace the already existing `index.js` and `package.json` that show an example.

5. Modify `setup-server.sh` to contain the command(s) needed to setup the environment of your sample solution. For example, when running an express server, it would just be `npm install` to install the required libraries. For running a java server, it may be `mvn install` or maybe compiling some classes.

    NOTE: This should NOT include any setup for the entire autograder docker container. For example, things like `apt-get update`, `apt-get install ...`, `pip install ...`, etc. should NOT be included in this file. These should be at the top of `setup.sh` at the root of the autograder. If you're confused about this distinction, think about it like this: would I need to run this command for every project/assignment I do, or just once on my entire computer? If it's the former, include it, if it's the later, don't.

6. Modify `run-server.sh` to contain the command(s) to run your server. For example, with an express server, it might just be `node index.js`. For a java server, if you have a JAR file, it may be something like `java -jar server-name.jar`, or if you're running compiled classes, it might be `java -cp classpath the.main.Class`. Note that these commands should be identical to the ones that the students would run to start their servers, so make sure to instruct them that their solutions must run with these commands.

7. Finally, put your default test cases in `default-tests.json`, if you have any. For a description of the format and fields of these tests, please see the README of the parent (root) directory.

8. When you're done, zip this entire directory together and upload it to Gradescope!

### Config Variables

Here are a list of the config variables and what they affect:

- `assignmentTitle`: This is just the title of the assignment. It is what will appear on the Website to browse tests. Ideally it should match the Gradescope assignment title, but this isn't required and it should still work.

- `numPublicTestsForAccess`: This is the number of valid test cases a student must submit before having access to other students' test cases. Note that they can still run the default tests no matter what. A valid test case just means that it is public, and that it was submitted at least 3 days before the due date (THIS `3` WILL BE MADE A CONFIG VAR EVENTUALLY).

- `maxTestsPerStudent`: This is the maximum number of tests a student may submit. If they go over this limit, any new tests will not be submitted, and they must delete them from the Website after logging in.

- `maxNumReturnedTests`: This is the maximum number of returned test cases, that is, the total number of tests that are run on the student's submission. For example, with every student submitting 10 test cases, for 100 students that's 1000 tests total, which would take too long to run on each submission. This variable limits the number that are returned and run on each student's submission. At the moment, this just uses random sampling, but if there are other suggested methods or feedback let us know.

- `weightReturnedTests`: A boolean that specifies if the random sampling for `maxNumReturnedTests` is weighted or not. If it is weighted, then the random sample of returned tests will be weighted on the number of likes each test case has (but it will still include those with no likes).
