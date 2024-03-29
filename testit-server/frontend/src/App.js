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
  const [account, setAccount] = useState(JSON.parse(sessionStorage.getItem('user')));

  const handleLogout = () => {
    sessionStorage.removeItem('user');
    setAccount(null);
  }

  useEffect(() => {
    const allowedPaths = ['/', '/login'];
    if (!allowedPaths.includes(location.pathname)) {
      navigate('/');
    }
  }, [location, navigate]);

  return (
    <div className="App">
      <div className="App-banner">
        <h1>Student Test Framework</h1>
        <StyledButton onClick={() => account ? handleLogout() : (location.pathname === '/login' ? navigate('/') : navigate('/login'))}>
          {account ? 'Log Out' : (location.pathname === '/login' ? 'Home' : 'Log In')}
        </StyledButton>
      </div>
      <Routes>
        <Route path="/" element={<AssignmentSelector account={account} setAccount={setAccount} />} />
        <Route path="/login" element={<Login account={account} setAccount={setAccount} />} />
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
