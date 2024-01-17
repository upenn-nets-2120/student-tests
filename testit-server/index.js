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
    html += '<tr><th>ID</th><th>Name</th><th>Description</th><th>Command</th><th>Response Status</th><th>Response Body</th><th>Author</th><th>Public</th><th>Passed Default</th><th>Times Ran</th><th>Times Ran Successfully</th></tr>';

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
    testCase.timesRan ??= 0;
    testCase.timesRanSuccessfully ??= 0;
    testCase.numStudentsRan ??= 0;
    testCase.numStudentsRanSuccessfully ??= 0;

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

    const returnedTests = await testsCollection.find({ $or: [{ public: true }, { author: author }] }).toArray();
    result.tests = returnedTests;

    res.status(201).send(result);
  } catch (err) {
    result.success = false;
    console.log("Failed to upload tests:", err)
    res.status(500).send(result);
  }
});

// TODO: Add another route for uploading results of running tests
