import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Box, CssBaseline, Drawer, List, ListItem, ListItemButton, 
  ListItemIcon, ListItemText, Toolbar, Typography, Divider, 
  IconButton, Avatar, Menu, MenuItem
} from '@mui/material';

// MUI 圖標
import MenuIcon from '@mui/icons-material/Menu';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import DashboardIcon from '@mui/icons-material/Dashboard';
import AddBoxIcon from '@mui/icons-material/AddBox';
import TableViewIcon from '@mui/icons-material/TableView';
import AssessmentIcon from '@mui/icons-material/Assessment';
import BuildIcon from '@mui/icons-material/Build';
import SettingsIcon from '@mui/icons-material/Settings';
import LogoutIcon from '@mui/icons-material/Logout';

const drawerWidth = 240;

const MENU_ITEMS = [
  { text: '主控制台', icon: <DashboardIcon />, path: '/dashboard' },
  { text: '資產入庫', icon: <AddBoxIcon />, path: '/asset/create' },
  { text: '資產總表', icon: <TableViewIcon />, path: '/inventory' },
  { text: '報表盤點', icon: <AssessmentIcon />, path: '/report' },
  { text: '維護登記', icon: <BuildIcon />, path: '/maintenance' },
  { text: '系統管理', icon: <SettingsIcon />, path: '/admin' },
];

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(true);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const userName = localStorage.getItem('plms_user_name') || 'User';

  // 這裡移除了 token 檢查，讓 ProtectedRoute 專職負責權限
  // Layout 只負責呈現

  const toggleDrawer = () => {
    setOpen(!open);
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/';
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      
      {/* 左側導覽列 */}
      <Drawer
        variant="permanent"
        open={open}
        sx={{
          width: open ? drawerWidth : 65,
          flexShrink: 0,
          whiteSpace: 'nowrap',
          boxSizing: 'border-box',
          '& .MuiDrawer-paper': {
            width: open ? drawerWidth : 65,
            transition: 'width 0.2s',
            overflowX: 'hidden',
            backgroundColor: '#fff',
            borderRight: '1px solid #e0e0e0',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          },
        }}
      >
        {/* 上方：Logo 與 切換按鈕 */}
        <Box>
          <Toolbar sx={{ display: 'flex', alignItems: 'center', justifyContent: open ? 'space-between' : 'center', px: [1] }}>
            {open && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ bgcolor: '#1976d2', color: 'white', p: 0.5, borderRadius: 1, fontWeight: 'bold' }}>Logo</Box>
                <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 'bold', color: '#333' }}>
                  PLMS
                </Typography>
              </Box>
            )}
            <IconButton onClick={toggleDrawer}>
              {open ? <ChevronLeftIcon /> : <MenuIcon />}
            </IconButton>
          </Toolbar>
          <Divider />

          {/* 選單列表 */}
          <List component="nav">
            {MENU_ITEMS.map((item) => (
              <ListItem key={item.text} disablePadding sx={{ display: 'block' }}>
                <ListItemButton
                  sx={{
                    minHeight: 48,
                    justifyContent: open ? 'initial' : 'center',
                    px: 2.5,
                    bgcolor: location.pathname === item.path ? '#e3f2fd' : 'transparent',
                    borderRight: location.pathname === item.path ? '4px solid #1976d2' : 'none',
                    '&:hover': { bgcolor: '#f5f5f5' }
                  }}
                  onClick={() => navigate(item.path)}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 0,
                      mr: open ? 3 : 'auto',
                      justifyContent: 'center',
                      color: location.pathname === item.path ? '#1976d2' : '#757575'
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText primary={item.text} sx={{ opacity: open ? 1 : 0, color: '#333' }} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Box>

        {/* 下方：使用者資訊 */}
        <Box sx={{ p: 1, borderTop: '1px solid #e0e0e0' }}>
          <ListItemButton
            onClick={handleMenuOpen}
            sx={{
              minHeight: 48,
              justifyContent: open ? 'initial' : 'center',
              px: 1,
              borderRadius: 2
            }}
          >
            <ListItemIcon sx={{ minWidth: 0, mr: open ? 2 : 'auto', justifyContent: 'center' }}>
              <Avatar sx={{ width: 32, height: 32, bgcolor: '#1976d2' }}>{userName.charAt(0)}</Avatar>
            </ListItemIcon>
            {open && (
              <ListItemText 
                primary={userName} 
                secondary="一般使用者" 
                primaryTypographyProps={{ fontWeight: 'bold', noWrap: true }}
                secondaryTypographyProps={{ noWrap: true, fontSize: '0.75rem' }}
              />
            )}
          </ListItemButton>
          
          {/* 使用者選單 */}
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
            transformOrigin={{ vertical: 'bottom', horizontal: 'left' }}
          >
            <MenuItem onClick={handleMenuClose}>
              <ListItemIcon><SettingsIcon fontSize="small" /></ListItemIcon>
              個人設定
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
              <ListItemIcon><LogoutIcon fontSize="small" color="error" /></ListItemIcon>
              登出系統
            </MenuItem>
          </Menu>
        </Box>
      </Drawer>

      {/* 右側內容區塊 */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          height: '100vh',
          overflow: 'auto',
          backgroundColor: '#f5f7fa',
          p: 3
        }}
      >
        {/* 為了避開 Toolbar 可能佔用的空間，這裡其實可以不需要，因為我們沒有頂部 AppBar，但保留亦可 */}
        {/* <Toolbar /> */} 
        {children}
      </Box>
    </Box>
  );
}