import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Typography,
  Divider,
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import DashboardIcon from '@mui/icons-material/Dashboard';
import WarningIcon from '@mui/icons-material/Warning';
import BuildIcon from '@mui/icons-material/Build';
import GroupIcon from '@mui/icons-material/Group';
import BusinessIcon from '@mui/icons-material/Business';
import AssignmentIcon from '@mui/icons-material/Assignment';
import SettingsIcon from '@mui/icons-material/Settings';

const DRAWER_WIDTH = 280;

const Sidebar = ({ mobileOpen, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { label: 'Dashboard', icon: DashboardIcon, path: '/dashboard' },
    { label: 'Incidents', icon: WarningIcon, path: '/incidents' },
    { label: 'CAPA', icon: BuildIcon, path: '/capa' },
    { label: 'Vendors', icon: BusinessIcon, path: '/vendors' },
    { label: 'Circles', icon: GroupIcon, path: '/circles' },
    { label: 'Reports', icon: AssignmentIcon, path: '/reports' },
    { label: 'Settings', icon: SettingsIcon, path: '/settings' },
  ];

  const drawerContent = (
    <Box>
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
          HSW Dashboard
        </Typography>
      </Box>
      <Divider />
      <List>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <ListItem
              button
              key={item.path}
              onClick={() => {
                navigate(item.path);
                onClose?.();
              }}
              sx={{
                backgroundColor: isActive ? 'rgba(25, 118, 210, 0.12)' : 'transparent',
                borderLeft: isActive ? '4px solid #1976d2' : 'none',
                '&:hover': {
                  backgroundColor: 'rgba(25, 118, 210, 0.08)',
                },
              }}
            >
              <ListItemIcon>
                <Icon color={isActive ? 'primary' : 'inherit'} />
              </ListItemIcon>
              <ListItemText
                primary={item.label}
                sx={{
                  '& .MuiListItemText-primary': {
                    color: isActive ? '#1976d2' : 'inherit',
                    fontWeight: isActive ? 600 : 400,
                  },
                }}
              />
            </ListItem>
          );
        })}
      </List>
    </Box>
  );

  return (
    <Drawer
      variant="temporary"
      open={mobileOpen}
      onClose={onClose}
      sx={{
        display: { xs: 'block', sm: 'none' },
        '& .MuiDrawer-paper': {
          width: DRAWER_WIDTH,
        },
      }}
    >
      {drawerContent}
    </Drawer>
  );
};

export default Sidebar;
