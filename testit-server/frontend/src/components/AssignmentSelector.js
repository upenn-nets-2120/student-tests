import React, { useState, useEffect } from 'react';
import axios from 'axios';
import TestTable from './TestTable';
import { Select, MenuItem, FormControl, InputLabel } from '@mui/material';

const AssignmentSelector = ({ account, setAccount }) => {
  const [assignments, setAssignments] = useState([]);
  const [selectedAssignment, setSelectedAssignment] = useState('');

  useEffect(() => {
    axios.get(`http://${process.env.REACT_APP_SERVER_IP}/get-collections`)
      .then(response => {
        setAssignments(response.data.filter(name => name.startsWith('tests-')).map(name => name.replace('tests-', '')));
      })
      .catch(error => console.error('Error fetching assignments:', error));
  }, []);

  const handleSelect = (event) => {
    setSelectedAssignment(event.target.value);
  };

  return (
    <div>
      <FormControl>
        <InputLabel id="assignment-select-label">Assignment</InputLabel>
        <Select
          labelId="assignment-select-label"
          id="assignment-select"
          value={selectedAssignment}
          onChange={handleSelect}
          displayEmpty
        >
          {assignments.map(assignment => (
            <MenuItem key={assignment} value={assignment}>
              {assignment}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {selectedAssignment && <TestTable account={account} setAccount={setAccount} assignment={selectedAssignment} />}
    </div>
  );
};

export default AssignmentSelector;
