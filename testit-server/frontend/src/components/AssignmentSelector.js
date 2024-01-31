import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import TestTable from './TestTable';
import { Select, MenuItem, FormControl, InputLabel } from '@mui/material';

const AssignmentSelector = ({ account, setAccount }) => {
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState([]);
  const [selectedAssignment, setSelectedAssignment] = useState('');
  const selectedAssignmentRef = useRef(selectedAssignment);

  useEffect(() => {
    selectedAssignmentRef.current = selectedAssignment;
  }, [selectedAssignment]);

  useEffect(() => {
    axios.get(`http://${process.env.REACT_APP_SERVER_IP}/get-collections`,
      { headers: { 'Authorization': account?.token ?? 0 } })
      .then(response => {
        let newAssignments = response.data.filter(name => name.startsWith('tests-')).map(name => name.replace('tests-', ''));
        if (!newAssignments.includes(selectedAssignmentRef.current)) {
          setSelectedAssignment('');
        }
        setAssignments(newAssignments);
      })
      .catch(error => {
        console.error('Error fetching assignments:', error)
        setAssignments([]);
        setSelectedAssignment('');
        if (error.response?.status === 403 && error.response.data === 'Token expired') {
          alert('Token expired. Please log in again.');
          sessionStorage.removeItem('user');
          setAccount(null);
          navigate('/login');
        }
      });
  }, [navigate, setAccount, account]);

  const handleSelect = (event) => {
    setSelectedAssignment(event.target.value);
  };

  return (
    <div className="assignment-selector-form">
      <div className="assignment-selector-header">
        <FormControl fullWidth>
          <InputLabel id="assignment-select-label">Assignment</InputLabel>
          <Select
            labelId="assignment-select-label"
            id="assignment-select"
            value={selectedAssignment}
            onChange={handleSelect}
            label="Assignment"
          >
            {assignments.map(assignment => (
              <MenuItem key={assignment} value={assignment}>
                {assignment}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </div>
      
      {selectedAssignment && <TestTable account={account} setAccount={setAccount} assignment={selectedAssignment} />}
    </div>
  );
};

export default AssignmentSelector;
