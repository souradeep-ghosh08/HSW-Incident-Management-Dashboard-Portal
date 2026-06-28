import { useState } from 'react';
import { Box, Container, IconButton } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import Header from './Header';
import Sidebar from './Sidebar';
import Footer from './Footer';

const DRAWER_WIDTH = 280;

const MainLayout = ({ children, darkMode, onToggleDarkMode }) => {
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleMenuClick = () => {
    setMobileOpen(!mobileOpen);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header darkMode={darkMode} onToggleDarkMode={onToggleDarkMode} />

      <Box sx={{ display: 'flex', flex: 1 }}>
        {/* Desktop Sidebar */}
        <Box
          sx={{
            width: DRAWER_WIDTH,
            display: { xs: 'none', sm: 'block' },
            backgroundColor: (theme) => theme.palette.background.paper,
            borderRight: (theme) => `1px solid ${theme.palette.divider}`,
            overflowY: 'auto',
          }}
        >
          <Sidebar />
        </Box>

        {/* Mobile Sidebar */}
        <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />

        {/* Main Content */}
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Mobile Menu Button */}
          <Box sx={{ display: { xs: 'block', sm: 'none' }, p: 1 }}>
            <IconButton onClick={handleMenuClick}>
              <MenuIcon />
            </IconButton>
          </Box>

          {children}
        </Box>
      </Box>

      <Footer />
    </Box>
  );
};

export default MainLayout;
