import React, { useState, useEffect } from 'react';
import './App.css';
import AssignmentSelector from './components/AssignmentSelector';
import Login from './components/Login';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import Button from '@mui/material/Button';
import styled from '@emotion/styled';

const StyledButton = styled(Button)({
  backgroundColor: 'transparent',
  color: 'blue',
  border: '1px solid blue',
  borderRadius: '5px',
  textTransform: 'none',
  '&:hover': {
    backgroundColor: 'blue',
    color: 'white',
    borderColor: 'blue',
  },
});

const Root = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    if (localStorage.getItem('token')) {
      setIsLoggedIn(true);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsLoggedIn(false);
  }

  return (
    <div className="App">
      <div className="App-banner">
        <h1>Student Test Cases</h1>
        <StyledButton onClick={() => isLoggedIn ? handleLogout() : (location.pathname === '/login' ? navigate('/') : navigate('/login'))}>
          {isLoggedIn ? 'Log Out' : (location.pathname === '/login' ? 'Home' : 'Log In')}
        </StyledButton>
      </div>
      <Routes>
        <Route path="/" element={<AssignmentSelector />} />
        <Route path="/login" element={<Login />} />
      </Routes>
    </div>
  );
}

function App() {  
  return (
    <Router>
      <Root />
    </Router>
  );
}

export default App;
