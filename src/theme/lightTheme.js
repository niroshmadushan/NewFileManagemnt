import { createTheme } from '@mui/material/styles';

const lightTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
      light: '#63a4ff',
      dark: '#004ba0',
    },
    secondary: {
      main: '#f48fb1',
    },
    background: {
      default: '#f5f5f5', // Light background
      paper: '#ffffff',   // White paper
    },
    text: {
      primary: '#000000', // Black text
      secondary: '#4f4f4f', // Grayish text
    },
  },
  typography: {
    fontSize: 12,
    button: {
      textTransform: 'none',
    },
  },
});

export default lightTheme;
