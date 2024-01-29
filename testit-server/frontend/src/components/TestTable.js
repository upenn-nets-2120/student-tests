import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, TextField, Button, Select, MenuItem, InputLabel, FormControl } from '@mui/material';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';

const TestTable = ({ assignment }) => {
  const [allTests, setAllTests] = useState([]);
  const [displayedTests, setDisplayedTests] = useState([]);
  const [sortField, setSortField] = useState('timesRanSuccessfully');
  const [sortDirectionAsc, setSortDirectionAsc] = useState(true);
  const [filterField, setFilterField] = useState('');
  const [filterValue, setFilterValue] = useState('');

  useEffect(() => {
    axios.get(`http://localhost:3001/get-tests/${assignment}`, { headers: { 'Authorization': `auth_temp_token` } })
      .then(response => {
        setAllTests(response.data);
        sortTests(response.data);
      })
      .catch(error => console.error('Error fetching tests:', error));
  }, [assignment]);

  const clickSort = (field) => {
    if (field === sortField) {
      setSortDirectionAsc(prev => !prev);
    } else {
      setSortField(field);
      setSortDirectionAsc(true);
    }
    sortTests(displayedTests);
  }

  const sortTests = (valuesToSort) => {
    const sortedTests = [...valuesToSort].sort((a, b) => {
      let comparison = 0;
      if (a[sortField] < b[sortField]) comparison = -1;
      if (a[sortField] > b[sortField]) comparison = 1;
      if (sortDirectionAsc === 'desc') comparison *= -1;
      return comparison;
    });

    setDisplayedTests(sortedTests);
  };

  const getSortIcon = (field) => {
    if (field !== sortField) {
      return null;
    }
    return sortDirectionAsc ? <ArrowUpwardIcon fontSize="tiny" /> : <ArrowDownwardIcon fontSize="tiny" />;
  };

  const filterTests = () => {
    const filteredTests = allTests.filter(test => 
      test[filterField]?.toString().toLowerCase().includes(filterValue.toLowerCase())
    );

    sortTests(filteredTests);
  };

  return (
    <div>
      <FormControl>
        <InputLabel id="filter-select-label">Filter Field</InputLabel>
        <Select
          labelId="filter-select-label"
          value={filterField}
          onChange={e => setFilterField(e.target.value)}
        >
          <MenuItem value="name">Name</MenuItem>
          <MenuItem value="description">Description</MenuItem>
          <MenuItem value="type">Type</MenuItem>
          <MenuItem value="author">Author</MenuItem>
          <MenuItem value="timesRan">Times Ran</MenuItem>
          <MenuItem value="timesRanSuccessfully">Times Ran Successfully</MenuItem>
          <MenuItem value="numStudentsRan"># Students Ran</MenuItem>
          <MenuItem value="numStudentsRanSuccessfully"># Students Ran Successfully</MenuItem>
          <MenuItem value="createdAt">Created At</MenuItem>
          {/* TODO: Add other options */}
        </Select>
      </FormControl>
      <TextField
        label="Filter Value"
        variant="outlined"
        size="small"
        value={filterValue}
        onChange={e => setFilterValue(e.target.value)}
        style={{ margin: 8 }}
      />
      <Button variant="contained" color="primary" onClick={filterTests} style={{ marginTop: 8 }}>
        Filter
      </Button>
      <TableContainer component={Paper}>
        <Table aria-label="simple table">
          <TableHead>
            <TableRow>
              <TableCell onClick={() => clickSort('name')}>Name {getSortIcon('name')}</TableCell>
              <TableCell onClick={() => clickSort('description')}>Description {getSortIcon('description')}</TableCell>
              <TableCell onClick={() => clickSort('type')}>Type {getSortIcon('type')}</TableCell>
              <TableCell onClick={() => clickSort('author')}>Author {getSortIcon('author')}</TableCell>
              <TableCell onClick={() => clickSort('timesRan')}>Times Ran {getSortIcon('timesRan')}</TableCell>
              <TableCell onClick={() => clickSort('timesRanSuccessfully')}>Times Ran Successfully {getSortIcon('timesRanSuccessfully')}</TableCell>
              <TableCell onClick={() => clickSort('numStudentsRan')}># Students Ran {getSortIcon('numStudentsRan')}</TableCell>
              <TableCell onClick={() => clickSort('numStudentsRanSucc')}># Students Ran Successfully {getSortIcon('numStudentsRanSucc')}</TableCell>
              <TableCell onClick={() => clickSort('createdAt')}>Created At {getSortIcon('createdAt')}</TableCell>
              {/* TODO: Add others */}
            </TableRow>
          </TableHead>
          <TableBody>
            {displayedTests.map((test) => (
              <TableRow key={test._id}>
                <TableCell component="th" scope="row">{test.name}</TableCell>
                <TableCell>{test.description}</TableCell>
                <TableCell>{test.type}</TableCell>
                <TableCell>{test.author}</TableCell>
                <TableCell>{test.timesRan}</TableCell>
                <TableCell>{test.timesRanSuccessfully}</TableCell>
                <TableCell>{test.numStudentsRan}</TableCell>
                <TableCell>{test.numStudentsRanSuccessfully}</TableCell>
                <TableCell>{test.createdAt}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </div>
  );
};

export default TestTable;
