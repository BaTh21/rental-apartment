// src/components/Layout.jsx
import {
  Apartment as ApartmentIcon,
  Build as BuildIcon,
  Dashboard as DashboardIcon,
  Home as HomeIcon,
  Logout as LogoutIcon,
  Menu as MenuIcon,
  Payment as PaymentIcon,
  People as PeopleIcon,
} from '@mui/icons-material';
import {
  AppBar,
  Avatar,
  Box,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Toolbar,
  Typography,
  useTheme,
} from '@mui/material';
import { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';

const drawerWidth = 240;

const navItems = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/', allowedRoles: ['Admin', 'Landlord', 'Tenant'] },
  { text: 'Users', icon: <PeopleIcon />, path: '/users', allowedRoles: ['Admin'] },
  { text: 'Roles', icon: <PeopleIcon />, path: '/roles', allowedRoles: ['Admin'] },
  { text: 'Apartments', icon: <ApartmentIcon />, path: '/apartments', allowedRoles: ['Admin', 'Landlord', 'Tenant'] },
  { text: 'Tenants', icon: <PeopleIcon />, path: '/tenants', allowedRoles: ['Admin', 'Landlord'] },
  { text: 'Rentals', icon: <HomeIcon />, path: '/rentals', allowedRoles: ['Admin', 'Landlord', 'Tenant'] },
  { text: 'Payments', icon: <PaymentIcon />, path: '/payments', allowedRoles: ['Admin', 'Landlord', 'Tenant'] },
  { text: 'Maintenance', icon: <BuildIcon />, path: '/maintenance', allowedRoles: ['Admin', 'Landlord', 'Tenant'] },
];

export default function Layout({ children = null }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();

  const handleDrawerToggle = () => setMobileOpen(!mobileOpen);

  const handleNavigation = (path) => {
    navigate(path);
    setMobileOpen(false);
  };

  const handleProfileClick = (event) => setAnchorEl(event.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);
  const handleLogout = () => {
    handleMenuClose();
    logout();
  };

  // Colors tuned for the gray glass theme
  const appBarBg = 'linear-gradient(45deg, #1f2328 0%, #2a2d32 100%)';
  const drawerBg = 'rgba(36,39,46,0.60)';
  const drawerBorder = '1px solid rgba(255,255,255,0.04)';
  const textMuted = 'rgba(255,255,255,0.75)';
  const selectedBg = `linear-gradient(90deg, ${theme.palette.primary.main}22, ${theme.palette.primary.dark}22)`; // subtle tint
  const iconColor = 'rgba(255,255,255,0.85)';

  const drawerContent = (
    <Box sx={{ width: drawerWidth, display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Toolbar sx={{ justifyContent: 'center', minHeight: 72 }}>
        <Typography variant="h6" noWrap sx={{ color: textMuted }}>
          {user?.username || 'Guest'}
        </Typography>
      </Toolbar>

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.03)' }} />

      <List sx={{ px: 1 }}>
        {navItems
          .filter((item) => {
            if (!user) return false;
            const roleName = user.role?.name ?? null;
            return roleName && item.allowedRoles.includes(roleName);
          })
          .map((item) => {
            const selected = location.pathname === item.path;
            return (
              <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
                <ListItemButton
                  selected={selected}
                  onClick={() => handleNavigation(item.path)}
                  sx={{
                    minHeight: 48,
                    px: 2,
                    borderRadius: 1.5,
                    color: selected ? '#fff' : textMuted,
                    background: selected ? selectedBg : 'transparent',
                    '&:hover': {
                      background: selected ? selectedBg : 'rgba(255,255,255,0.03)',
                      color: '#fff',
                    },
                    '& .MuiListItemIcon-root': {
                      minWidth: 36,
                      color: selected ? '#fff' : iconColor,
                    },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 36 }}>{item.icon}</ListItemIcon>
                  <ListItemText
                    primary={item.text}
                    primaryTypographyProps={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: selected ? '#fff' : textMuted,
                    }}
                  />
                </ListItemButton>
              </ListItem>
            );
          })}
      </List>

      <Divider sx={{ mt: 'auto', borderColor: 'rgba(255,255,255,0.03)' }} />

      {user && (
        <List sx={{ p: 1 }}>
          <ListItem disablePadding>
            <ListItemButton
              onClick={handleLogout}
              sx={{
                minHeight: 44,
                borderRadius: 1,
                px: 1.5,
                color: textMuted,
                '&:hover': {
                  background: 'rgba(255,255,255,0.03)',
                  color: '#fff',
                },
                '& .MuiListItemIcon-root': { color: iconColor },
              }}
            >
              <ListItemIcon>
                <LogoutIcon />
              </ListItemIcon>
              <ListItemText primary="Logout" primaryTypographyProps={{ fontSize: 14 }} />
            </ListItemButton>
          </ListItem>
        </List>
      )}
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'transparent' }}>
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
          background: appBarBg,
          borderBottom: '1px solid rgba(255,255,255,0.02)',
          backdropFilter: 'blur(8px)',
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>

          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1, color: textMuted }}>
            {navItems.find((item) => location.pathname === item.path)?.text || 'Dashboard'}
          </Typography>

          {user && (
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <IconButton
                size="large"
                edge="end"
                onClick={handleProfileClick}
                color="inherit"
                sx={{
                  borderRadius: 1,
                  px: 0.5,
                  '&:hover': { background: 'rgba(255,255,255,0.03)' },
                }}
              >
                <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.92)', color: 'rgba(0,0,0,0.87)' }}>
                  {user.username?.[0]?.toUpperCase() ?? 'U'}
                </Avatar>
              </IconButton>

              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                PaperProps={{
                  sx: {
                    bgcolor: 'rgba(24,26,28,0.95)',
                    color: 'rgba(255,255,255,0.95)',
                    border: '1px solid rgba(255,255,255,0.04)',
                    backdropFilter: 'blur(6px)',
                  },
                }}
              >
                <MenuItem disabled sx={{ fontWeight: 'bold', color: 'rgba(255,255,255,0.95)' }}>
                  {user.username}
                </MenuItem>
                <MenuItem disabled sx={{ color: 'rgba(255,255,255,0.85)' }}>
                  Role: {user.role?.name ?? 'N/A'}
                </MenuItem>
                <Divider sx={{ borderColor: 'rgba(255,255,255,0.03)' }} />
                <MenuItem onClick={handleLogout} sx={{ color: 'rgba(255,255,255,0.88)' }}>
                  <ListItemIcon>
                    <LogoutIcon fontSize="small" sx={{ color: 'rgba(255,255,255,0.9)' }} />
                  </ListItemIcon>
                  Logout
                </MenuItem>
              </Menu>
            </Box>
          )}
        </Toolbar>
      </AppBar>

      <Box component="nav" sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              borderRight: 'none',
              bgcolor: drawerBg,
              border: drawerBorder,
              color: textMuted,
              boxShadow: '0 8px 30px rgba(0,0,0,0.45)',
            },
          }}
          open
        >
          {drawerContent}
        </Drawer>

        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              bgcolor: drawerBg,
              border: drawerBorder,
              color: textMuted,
            },
          }}
        >
          {drawerContent}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { md: `calc(100% - ${drawerWidth}px)` },
          mt: `calc(${theme.mixins.toolbar.minHeight}px + 24px)`,
        }}
      >
        {children ?? <Outlet />}
      </Box>
    </Box>
  );
}
