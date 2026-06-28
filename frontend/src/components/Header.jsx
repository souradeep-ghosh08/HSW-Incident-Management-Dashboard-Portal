import { Box, AppBar, Toolbar, Typography, IconButton, Menu, MenuItem, Avatar } from '@mui/material';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';

const Header = ({ darkMode, onToggleDarkMode }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);

  const handleMenuOpen = (event) => setAnchorEl(event.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);

  const handleLogout = async () => {
    handleMenuClose();
    await logout();
    navigate('/login');
  };

  return (
    <AppBar position="static" sx={{ background: darkMode ? '#1e1e1e' : '#1976d2' }}>
      <Toolbar>
        <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
          HSW Dashboard
        </Typography>

        <IconButton color="inherit" onClick={onToggleDarkMode}>
          {darkMode ? <Brightness7Icon /> : <Brightness4Icon />}
        </IconButton>

        <IconButton
          color="inherit"
          onClick={handleMenuOpen}
          sx={{ ml: 2 }}
        >
          <Avatar sx={{ width: 32, height: 32, cursor: 'pointer' }}>
            {user?.sub?.charAt(0).toUpperCase()}
          </Avatar>
        </IconButton>

        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
        >
          <MenuItem disabled>
            <Typography variant="body2" color="textSecondary">
              {user?.email}
            </Typography>
          </MenuItem>
          <MenuItem onClick={() => { handleMenuClose(); navigate('/profile'); }}>
            Profile
          </MenuItem>
          <MenuItem onClick={handleLogout}>
            Logout
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
