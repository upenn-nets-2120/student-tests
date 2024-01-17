const express = require('express');
const MongoClient = require('mongodb').MongoClient;
const app = express();
const port = 3000;

const url = process.env.DB_URL;
const AUTH_TOKEN = process.env.AUTH_TOKEN;
const dbName = 'tests-database';
let db, testsCollection;

// Auth middleware
const authorize = (req, res, next) => {
  const token = req.headers['authorization'];

  if (!token || token !== AUTH_TOKEN) {
    return res.status(403).send('Unauthorized');
  }

  next();
};

MongoClient.connect(url, { useNewUrlParser: true, useUnifiedTopology: true }, (err, client) => {
  if (err) {
    return console.log(err);
  }
  db = client.db(dbName);
  testsCollection = db.collection('tests');

  // Trying this each time should be fine, MongoDB handles it gracefully
  testsCollection.createIndex({ name: 1 }, { unique: true }, (err, result) => {
    if (err) {
      console.log('Error creating index:', err);
    } else {
      console.log('Index created:', result);
    }
  });

  app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}/`);
  });
});

app.get('/', (req, res) => {
  res.status(200).send('ok');
});

app.get('/view-tests', (req, res) => {
  testsCollection.find({}).toArray((err, items) => {
    if (err) {
      res.status(500).send('Error fetching tests from database');
      return;
    }

    let html = '<table border="1">';
    html += '<tr><th>ID</th><th>Name</th><th>Description</th><th>Command</th><th>Response Status</th><th>Response Body</th><th>Author</th><th>Public</th><th>Passed Default</th><th>Times Ran</th><th>Times Ran Successfully</th><th>Num Students Ran</th><th>Num Students Ran Successfully</th></tr>';

    items.forEach(test => {
      html += `<tr>`;
      html += `<td>${test._id}</td>`;
      html += `<td>${test.name}</td>`;
      html += `<td>${test.description}</td>`;
      html += `<td>${test.test.command}</td>`;
      html += `<td>${test.test.response.status}</td>`;
      html += `<td>${JSON.stringify(test.test.response.body)}</td>`;
      html += `<td>${test.author}</td>`;
      html += `<td>${test.public}</td>`;
      html += `<td>${test.passedDefault}</td>`;
      html += `<td>${test.timesRan}</td>`;
      html += `<td>${test.timesRanSuccessfully}</td>`;
      html += `<td>${test.numStudentsRan}</td>`;
      html += `<td>${test.numStudentsRanSuccessfully}</td>`;
      html += `</tr>`;
    });

    html += '</table>';

    res.send(html);
  });
});

app.post('/submit-tests', authorize, express.json(), async (req, res) => {
  let testCases = req.body;

  const author = req.query.student_id;
  if (!author) {
    return res.status(400).send('Error: Author is required as a query parameter.');
  }
  console.log("Recieving tests from Student ID " + author);

  const result = {failedToAdd: []};
  const processedTestCases = [];
  for (const testCase of testCases) {
    testCase.author = author;

    testCase.public ??= true;
    testCase.passedDefault ??= true;
    testCase.timesRan = 0;
    testCase.timesRanSuccessfully = 0;
    testCase.numStudentsRan = 0;
    testCase.numStudentsRanSuccessfully = 0;
    testCase.studentsRan = [];
    testCase.studentsRanSuccessfully = [];
    testCase.isDefault = false; // default would be true for instructor-created test cases that show up even if a student hasn't submitted any tests

    const existingTestCase = await testsCollection.findOne({ name: testCase.name });
    if (existingTestCase) {
      if (existingTestCase.author === author) {
        // Author is the same, update the existing test case
        await testsCollection.updateOne({ name: testCase.name }, { $set: testCase });
        console.log("Test " + testCase.name + " updated!");
      } else {
        // Different author, cannot overwrite
        console.log("Test " + testCase.name + " already exists by a different author!");
        result.failedToAdd.push({ "name": testCase.name, "reason": "Test case already exists by a different author!" });
      }
    } else {
      processedTestCases.push(testCase);
    }
  }

  try {
    if (processedTestCases.length > 0) {
      await testsCollection.insertMany(processedTestCases);
    }
    result.success = true;

    const authorHasTest = await testsCollection.findOne({ author: author });

    const returnedTests = !authorHasTest ? await testsCollection.find({ isDefault: true }).toArray() : await testsCollection.find({ $or: [{ public: true }, { author: author }, { isDefault: true }] }).toArray();
    result.tests = returnedTests;

    res.status(201).send(result);
  } catch (err) {
    result.success = false;
    console.log("Failed to upload tests:", err)
    res.status(500).send(result);
  }
});

app.post('/submit-results', authorize, express.json(), async (req, res) => {
  let data = req.body;

  const author = req.query.student_id;
  if (!author) {
    return res.status(400).send('Error: Author is required as a query parameter.');
  }
  console.log("Recieving results from Student ID " + author);

  const result = { failedToUpdate: [] };
  for (const testResult of data) {
    try {
      // Increment timesRan and timesRanSuccessfully
      await testsCollection.updateOne(
        { name: testResult.name },
        { $inc: { timesRan: 1, timesRanSuccessfully: testResult.passed ? 1 : 0 } }
      );

      // Update numStudentsRan and numStudentsRanSuccessfully only if this student has not run this test before
      const updateFields = {};
      const addToSetFields = { $addToSet: {} };

      const testCase = await testsCollection.findOne({ name: testResult.name });
      if (testCase && !testCase.studentsRan.includes(author)) {
        updateFields.numStudentsRan = 1;
        addToSetFields.$addToSet.studentsRan = author;
      }
      if (testResult.passed && testCase && !testCase.studentsRanSuccessfully.includes(author)) {
        updateFields.numStudentsRanSuccessfully = 1;
        addToSetFields.$addToSet.studentsRanSuccessfully = author;
      }

      await testsCollection.updateOne(
        { name: testResult.name },
        { $inc: updateFields, ...addToSetFields }
      );
    } catch (err) {
      console.log("Error updating test result for:", testResult.name, err);
      result.failedToUpdate.push({ "name": testResult.name, "reason": "Error in updating the database." });
    }
  }

  result.success = result.failedToUpdate.length === 0;
  res.status(result.success ? 200 : 500).send(result);
});
