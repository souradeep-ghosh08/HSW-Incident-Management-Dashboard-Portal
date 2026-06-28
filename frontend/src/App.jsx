import { createTheme, ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { useState, useMemo } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Routes from './routes';

const App = () => {
  const [darkMode, setDarkMode] = useState(false);

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode: darkMode ? 'dark' : 'light',
          primary: {
            main: '#1976d2',
          },
          secondary: {
            main: '#dc004e',
          },
          background: {
            default: darkMode ? '#121212' : '#f5f5f5',
            paper: darkMode ? '#1e1e1e' : '#ffffff',
          },
        },
        typography: {
          fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
          h1: {
            fontWeight: 600,
            fontSize: '2.5rem',
          },
          h2: {
            fontWeight: 600,
            fontSize: '2rem',
          },
          h3: {
            fontWeight: 600,
            fontSize: '1.5rem',
          },
        },
        shape: {
          borderRadius: 8,
        },
      }),
    [darkMode]
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <Routes toggleDarkMode={() => setDarkMode(!darkMode)} darkMode={darkMode} />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
