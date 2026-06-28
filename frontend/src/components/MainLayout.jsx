import React, { useState } from 'react';
import {
  Box,
  AppBar,
  Toolbar,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  IconButton,
  Typography,
  Avatar,
  Menu,
  MenuItem,
  Divider,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Description as DescriptionIcon,
  Business as BusinessIcon,
  LocationCity as LocationCityIcon,
  Upload as UploadIcon,
  Assessment as AssessmentIcon,
  Mail as MailIcon,
  History as HistoryIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  Brightness4 as Brightness4Icon,
  Brightness7 as Brightness7Icon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const MainLayout = ({ children, darkMode, onToggleDarkMode }) => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();

  const menuItems = [
    { label: 'Dashboard', icon: DashboardIcon, path: '/' },
    { label: 'Incidents', icon: DescriptionIcon, path: '/incidents' },
    { label: 'Vendors', icon: BusinessIcon, path: '/vendors' },
    { label: 'Circles', icon: LocationCityIcon, path: '/circles' },
    { label: 'Excel Upload', icon: UploadIcon, path: '/upload' },
    { label: 'Reports', icon: AssessmentIcon, path: '/reports' },
    { label: 'Email Center', icon: MailIcon, path: '/email' },
    { label: 'Audit Logs', icon: HistoryIcon, path: '/audit-logs' },
    { label: 'Settings', icon: SettingsIcon, path: '/settings' },
  ];

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    navigate('/login');
  };

  const drawerContent = (
    <Box sx={{ width: 250 }}>
      <Box sx={{ p: 2, backgroundColor: '#E60000', color: 'white' }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          HSW Dashboard
        </Typography>
        <Typography variant="caption">Incident Management</Typography>
      </Box>
      <List>
        {menuItems.map((item) => (
          <ListItem key={item.path} disablePadding>
            <ListItemButton
              onClick={() => {
                navigate(item.path);
                setDrawerOpen(false);
              }}
              sx={{
                '&:hover': { backgroundColor: 'rgba(230, 0, 0, 0.1)' },
              }}
            >
              <ListItemIcon><item.icon /></ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar position="fixed" sx={{ backgroundColor: '#E60000', zIndex: 1301 }}>
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={() => setDrawerOpen(!drawerOpen)}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 600 }}>
            HSW Incident Management
          </Typography>
          <IconButton color="inherit" onClick={onToggleDarkMode}>
            {darkMode ? <Brightness7Icon /> : <Brightness4Icon />}
          </IconButton>
          <Avatar
            onClick={(e) => setAnchorEl(e.currentTarget)}
            sx={{ cursor: 'pointer', ml: 2, backgroundColor: '#fff' }}
          >
            U
          </Avatar>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={() => setAnchorEl(null)}
          >
            <MenuItem onClick={() => navigate('/profile')}>
              Profile
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleLogout}>
              <LogoutIcon sx={{ mr: 1 }} />
              Logout
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      {/* Mobile Drawer */}
      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      >
        {drawerContent}
      </Drawer>

      {/* Desktop Drawer */}
      {!isMobile && (
        <Drawer
          variant="permanent"
          sx={{
            width: 250,
            '& .MuiDrawer-paper': {
              width: 250,
              boxSizing: 'border-box',
              mt: 8,
            },
          }}
        >
          {drawerContent}
        </Drawer>
      )}

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          mt: 8,
          ml: isMobile ? 0 : '250px',
          transition: 'margin-left 0.3s',
        }}
      >
        {children}
      </Box>
    </Box>
  );
};

export default MainLayout;
