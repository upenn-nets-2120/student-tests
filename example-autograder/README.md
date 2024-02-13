This is an example autograder, to upload it to gradescope, zip these files together and upload.

### Instructions for Administrators

To setup the autograder, follow the following steps:

1. You may start either with an existing autograder, or just copy everything from this directory (`example-autograder`). If you already have an existing grader, you don't need to copy the `run_autograder` and `setup.sh`. Instead, add on the single line of each of these to the end of your corresponding files. Note that you don't need to copy `example-java-server`, as this is just a demonstration folder giving an example. If you want to copy this structure, as explained later, just rename it to `sample-submission` and delete/overwrite the other `sample-submission` folder.

2. In the `test-grader` folder, modify the `config.json` to match what you want. You can find a description of the variables below. It is important that you include the `assignmenTitle` field (and preferably it should match the Gradescope assignment title, but this isn't required and it should still work) (e.g. for Homework 1 Milestone 1 it might be `hw1_ms1`).

3. In the `test-grader` folder, add a `.env` file that includes 3 variables:

    ```
    SERVER_IP=...
    SERVER_PORT=...
    AUTH_TOKEN=...
    ```

    These correspond to the server IP and port that the backend server and database is running on (probably an EC2 instance or something similar). The `AUTH_TOKEN` is the token that this server requires to authenticate Gradescope. Set it to be the value of the token required by the server (which is set in the `.env` file in the `testit-server` server directory when it's started). Make sure this `.env` file is included when zipping the autograder, but it should be by default.

4. In the `sample-submission` directory, add in all files required to run your sample solution to the assignment. You may delete/replace the already existing `index.js` and `package.json` that show an example. Note that you can find an example of what a Java server project would look like in the `example-java-server` folder, but if you actually wanted to use something like this, you would need to rename the folder to `sample-submission`.

5. Modify `pre-test.sh` to contain the command(s) needed to setup the environment of your sample solution (before running the tests). Note that this script IS expected to terminate, so if you need to run a server or something similar to that, it must be done in the background:

    ```
    npm install
    node index.js &
    ```

    For running a Java server, it may include commands like `mvn install`, `mvn clean install -DskipTests`, `java -jar server-name.jar`, or possibly compiling some classes and running `java -cp classpath the.main.Class`.

    When writing this file and `post-test.sh` explained next, they will already be run in the correct directory. E.g. when the autograder is being set up, they will be run in `autograder/source/sample-submission`, but when a student submits they will be run in `autograder/submission`. As a result, YOU SHOULD NOT use `cd` to change directory to these, and should instead use `./` to refer to the current location. You can still use `cd` to change to these if necessary to refer to another file (or include `sample-submission` in a filepath) if this is what you intend, but just know that these files will be expected to execute as intended when run in both of the aforementioned directories.

    NOTE: This should NOT include any setup for the entire autograder docker container. For example, things like `apt-get update`, `apt-get install ...`, `pip install ...`, etc. should NOT be included in this file. These should be at the top of `setup.sh` at the root of the autograder. If you're confused about this distinction, think about it like this: would I need to run this command for every project/assignment I do, or just once on my entire computer? If it's the former, include it, if it's the later, don't.

    Don't worry about cleaning up hanging background processes in `post-test.sh`. After the post is run, any processes still running from the `pre-test.sh` will be terminated.

6. Modify `post-test.sh` to contain the command(s) that need to execute after the tests are run. Normally this file can be left empty, but for an example where it might not be, consider the following: The assignment is for students to use DynamoDB and upload tests to a table, so the `pre-test.sh` creates the table (if the students aren't responsible for that), and then `post-test.sh` might delete the table.

    Note that these commands should be identical to the ones that the students would run to start/use their submissions, so make sure to instruct them that their submissions must run with these commands. The `sample-submission` directory should exactly match the file structure of what a student submits, except with the addition of the pre and post test scripts (and the renaming of `tests.json` to `default-tests.json`) (and any other extra files your example submission might need).

7. Finally, put your default test cases in `default-tests.json`, if you have any. For a description of the format and fields of these tests, please see the README of the parent (root) directory. The only difference is that these tests have the extra optional field of `score` (see the example file). If this is specified, it's the score a student receives for passing the test on gradescope.

8. Now we can configure other scoring options. Other than setting scores for each default test, you can also set a total combined score for passing all of the default tests (this would be on top of any score specified for each test in the `score` field). To do this, use the `groupedDefaultTestsScore` config variable. Additionally, you can set a score given to any student who successfully submits the required number of tests to the database (at least `numPublicTestsForAccess` tests submitted `timeToDeadline` hours before the assignment deadline). This value can be configured in the `submitTestsScore` field of the config.

9. When you're done, zip this entire directory together and upload it to Gradescope!

### Config Variables

Here are a list of the config variables and what they affect. Note that all of these must be present in the config file, but if some aren't needed (explained below), then you may set them to empty or whatever. See the `config.json` file for an example as to what these might look like.

- `assignmentTitle`: This is just the title of the assignment. It is what will appear on the Website to browse tests. Ideally it should match the Gradescope assignment title, but this isn't required and it should still work. Note that it is possible to make hidden assignments for testing. If the title ends in `hidden`, then the assignment will only be visible to accounts with `admin` set to true. Otherwise they are not visible (for students).

- `numPublicTestsForAccess`: This is the number of valid test cases a student must submit before having access to other students' test cases. Note that they can still run the default tests no matter what. A valid test case just means that it is public, and that it was submitted at least `timeToDeadline` hours before the (Gradescope) due date.

- `maxTestsPerStudent`: This is the maximum number of tests a student may submit. If they go over this limit, any new tests will not be submitted, and they must delete them from the Website after logging in.

- `maxNumReturnedTests`: This is the maximum number of returned test cases, that is, the total number of tests that are run on the student's submission. For example, with every student submitting 10 test cases, for 100 students that's 1000 tests total, which would take too long to run on each submission. This variable limits the number that are returned and run on each student's submission. At the moment, this just uses random sampling, but if there are other suggested methods or feedback let us know.

- `weightReturnedTests`: A boolean that specifies if the random sampling for `maxNumReturnedTests` is weighted or not. If it is weighted, then the random sample of returned tests will be weighted on the number of likes each test case has (but it will still include those with no likes).

- `pomPath`: When using Maven and a Java server, this is the path to the `pom.xml` file. (In future versions, this is subject to removal in favor of the `pom.xml` file always being at the root). If you are using a different server, then this variable can be set to anything.

- `jUnitTestLocation`: When using Maven and JUnit 4 tests, this is the path to the directory that contains all of the tests. (In future versions, this is subject to removal in favor of a field in each JUnit 4 test case written in the test file). If you are using a different server, then this variable can be set to anything.

- `groupedDefaultTestsScore`: See the explanation in #8 above

- `submitTestsScore`: See the explanation in #8 above

- `timeToDeadline`: See the explanation in #8 above. It is in hours

- `waitTimeAfterPreTest`: This is the amount of seconds waited after the `pre-test.sh` script is run before running the tests. For example, if the last line after `pre-test.sh` is to start a server in the background, this variable lets a delay pass before running the tests so the server can boot up. Note that Gradescope is usually slower, so take this into account. Usually 5 seconds seems about appropriate for a server, but it seems that occasionally this may be too short so it's set to 8 by default.
