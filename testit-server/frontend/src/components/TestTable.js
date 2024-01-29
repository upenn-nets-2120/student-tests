import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, TextField, Select, MenuItem, InputLabel, FormControl } from '@mui/material';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ThumbDownIcon from '@mui/icons-material/ThumbDown';

const TestTable = ({ assignment }) => {
  const [allTests, setAllTests] = useState([]);
  const [displayedTests, setDisplayedTests] = useState([]);
  const [sortField, setSortField] = useState('numLiked');
  const [sortDirectionAsc, setSortDirectionAsc] = useState(false);
  const [filterField, setFilterField] = useState('');
  const [filterValue, setFilterValue] = useState('');

  useEffect(() => {
    axios.get(`http://${process.env.REACT_APP_SERVER_IP}/get-tests/${assignment}`,
      { headers: { 'Authorization': localStorage.getItem('token') } })
      .then(response => {
        setAllTests(response.data);
      })
      .catch(error => {
        console.error('Error fetching tests:', error);
        setAllTests([]);
      });
  }, [localStorage.getItem('token'), assignment]);

  useEffect(() => {
    const filteredTests = !filterField || filterValue === '' ? allTests : allTests.filter(test => 
      test[filterField]?.toString().toLowerCase().includes(filterValue.toLowerCase()) ?? false
    );

    const sortedTests = [...filteredTests].sort((a, b) => {
      let comparison = 0;
      if (a[sortField] < b[sortField]) comparison = -1;
      if (a[sortField] > b[sortField]) comparison = 1;
      if (!sortDirectionAsc) comparison *= -1;
      return comparison;
    });

    setDisplayedTests(sortedTests);
  }, [allTests, filterField, filterValue, sortField, sortDirectionAsc]);

  const clickSort = (field) => {
    if (field === sortField) {
      setSortDirectionAsc(prev => !prev);
    } else {
      setSortField(field);
      setSortDirectionAsc(true);
    }
  }

  const like = async (testId) => {
    try {
      const response = await axios.post(`http://${process.env.REACT_APP_SERVER_IP}/like-test/${assignment}/${testId}`,
        {}, { headers: { 'Authorization': localStorage.getItem('token') } });
      if (response.status === 200) {
        setAllTests(allTests => [...allTests].map(test => {
          if (test._id === testId) {
            const updatedTest = {
              ...test,
              numLiked: test.userLiked ? test.numLiked : test.numLiked + 1,
              numDisliked: test.userDisliked ? test.numDisliked - 1 : test.numDisliked,
              userLiked: true,
              userDisliked: false
            };
            // if ('studentsLiked' in test && 'studentsDisliked' in test) {
            //   updatedTest.studentsLiked = isAlreadyLiked ? test.studentsLiked : [...test.studentsLiked, 'currentUser'];
            //   updatedTest.studentsDisliked = test.studentsDisliked.filter(username => username !== 'currentUser');
            // }
            return updatedTest;
          }
          return test;
        }));
        setDisplayedTests(displayedTests => [...displayedTests]);
      }
    } catch (error) {
      console.error('Error liking the test:', error);
    }
  };

  const dislike = async (testId) => {
    try {
      const response = await axios.post(`http://${process.env.REACT_APP_SERVER_IP}/dislike-test/${assignment}/${testId}`,
        {}, { headers: { 'Authorization': localStorage.getItem('token') } });
      if (response.status === 200) {
        setAllTests(allTests => [...allTests].map(test => {
          if (test._id === testId) {
            const updatedTest = {
              ...test,
              numLiked: test.userLiked ? test.numLiked - 1 : test.numLiked,
              numDisliked: test.userDisliked ? test.numDisliked : test.numDisliked + 1,
              userLiked: false,
              userDisliked: true
            };
            // if ('studentsLiked' in test && 'studentsDisliked' in test) {
            //   updatedTest.studentsLiked = test.studentsLiked.filter(username => username !== 'currentUser');
            //   updatedTest.studentsDisliked = isAlreadyDisliked ? test.studentsDisliked : [...test.studentsDisliked, 'currentUser'];
            // }
            return updatedTest;
          }
          return test;
        }));
        setDisplayedTests(displayedTests => [...displayedTests]);
      }
    } catch (error) {
      console.error('Error disliking the test:', error);
    }
  };

  const getThumbsIcon = (test) => {
    return (
      <>
        <ThumbUpIcon
          color={test.userLiked ? "primary" : "disabled"}
          onClick={() => like(test._id)}
          style={{ cursor: 'pointer' }}
        />
        <ThumbDownIcon
          color={test.userDisliked ? "secondary" : "disabled"}
          onClick={() => dislike(test._id)}
          style={{ cursor: 'pointer' }}
        />
      </>
    );
  };

  const getSortIcon = (field) => {
    if (field !== sortField) {
      return null;
    }
    return sortDirectionAsc ? <ArrowDownwardIcon fontSize="tiny" /> : <ArrowUpwardIcon fontSize="tiny" />;
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
          <MenuItem value="numLiked">Likes</MenuItem>
          <MenuItem value="numDisliked">Dislikes</MenuItem>
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
              <TableCell onClick={() => clickSort('numLiked')}>Likes {getSortIcon('numLiked')}</TableCell>
              <TableCell onClick={() => clickSort('numDisliked')}>Dislikes {getSortIcon('numDisliked')}</TableCell>
              <TableCell>Reaction</TableCell>
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
                <TableCell>{test.numLiked}</TableCell>
                <TableCell>{test.numDisliked}</TableCell>
                <TableCell>{getThumbsIcon(test)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </div>
  );
};

export default TestTable;
