import React, { useState, useEffect } from 'react';
import axios from 'axios';
import TestTable from './TestTable';

const AssignmentSelector = () => {
  const [assignments, setAssignments] = useState([]);
  const [selectedAssignment, setSelectedAssignment] = useState('');

  useEffect(() => {
    axios.get('http://localhost:3001/get-collections')
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
      <select onChange={handleSelect} value={selectedAssignment}>
        <option value="">--Select an Assignment--</option>
        {assignments.map(assignment => (
          <option key={assignment} value={assignment}>
            {assignment}
          </option>
        ))}
      </select>

      {selectedAssignment && <TestTable assignment={selectedAssignment} />}
    </div>
  );
};

export default AssignmentSelector;
