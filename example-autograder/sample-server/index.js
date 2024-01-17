const express = require('express');
const app = express();
const port = 3000;

// This will probably be using React.js or some other framework in the future, this version is just to test
// this is the sample server solution provided by the homework to run test cases against

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
});

app.get('/', (req, res) => {
  res.send('SERVER TEST');
});

app.get('/error', (req, res) => {
  res.status(404).send('Not found');
});
