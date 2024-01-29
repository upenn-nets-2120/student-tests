import './App.css';
import AssignmentSelector from './components/AssignmentSelector';
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

function App() {
  return (
    <div className="App">
      <div className="App-banner">
        <h1>Student Test Cases</h1>
        <StyledButton onClick={() => {/* handle login logic here */}}>
          Log In
        </StyledButton>
      </div>
      <AssignmentSelector />
    </div>
  );
}

export default App;
