// Login.js
import React, { useState } from 'react';
import { Container, Typography, TextField, Button } from '@mui/material';

const Login = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loggedIn, setLoggedIn] = useState(false);

  const handleLogin = () => {
    if (username && password) {
      setLoggedIn(true);
      onLogin(username);
    }
  };

  const handleLogout = () => {
    setLoggedIn(false);
    onLogin('');
  };

  if (loggedIn) {
    return (
      <Container>
        <Typography variant="h4">Welcome, {username}!</Typography>
        <Button variant="contained" color="primary" onClick={handleLogout}>
          Log Out
        </Button>
      </Container>
    );
  }

  return (
    <Container>
      <Typography variant="h4">Login</Typography>
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
