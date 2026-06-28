import { Box } from '@mui/material';

const Footer = () => {
  return (
    <Box
      component="footer"
      sx={{
        py: 3,
        px: 2,
        mt: 'auto',
        backgroundColor: (theme) =>
          theme.palette.mode === 'light'
            ? theme.palette.grey[100]
            : theme.palette.grey[900],
        textAlign: 'center',
      }}
    >
      <Box sx={{ fontSize: '0.875rem', color: 'text.secondary' }}>
        © 2024 HSW Incident Management Dashboard Portal. All rights reserved.
      </Box>
    </Box>
  );
};

export default Footer;
