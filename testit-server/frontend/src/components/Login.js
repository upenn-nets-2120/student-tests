import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Typography, TextField, Button } from '@mui/material';

const Login = ({ account, setAccount }) => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (account) {
      navigate('/');
    }
  }, [navigate, account]);

  const handleLogin = async () => {
    if (username && password) {
      try {
        const response = await fetch(`http://${process.env.REACT_APP_SERVER_IP}/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ username, password }),
        });

        if (!response.ok) {
          const reason = await response.text();
          alert(`Login failed: ${reason}`);
        } else {
          const data = await response.json();
          if (data?.token) {
            sessionStorage.setItem('user', JSON.stringify(data));
            setAccount(data);
            navigate('/');
          } else {
            alert('Login failed!');
          }
        }
      } catch (error) {
        console.error('Login error:', error);
      }
    }
  };
  
  return (
    <Container>
      <Typography variant="h4" style={{margin: '10px'}}>Log In</Typography>
      <TextField
        label="Username"
        variant="outlined"
        fullWidth
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        style={{ marginBottom: '16px' }}
      />
      <TextField
        label="Password"
        variant="outlined"
        type="password"
        fullWidth
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        style={{ marginBottom: '16px' }}
      />
      <Button variant="contained" color="primary" onClick={handleLogin}>
        Log In
      </Button>
    </Container>
  );
};

export default Login;
