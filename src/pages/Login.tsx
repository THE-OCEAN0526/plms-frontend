// src/pages/Login.tsx
import { useState, ChangeEvent, FormEvent } from 'react';
import axios from 'axios';
import { 
  Box, Card, CardContent, TextField, Button, Typography, Container, 
  InputAdornment, CssBaseline, Snackbar, Alert, AlertColor,
  IconButton, Tab, Tabs, Fade, useTheme
} from '@mui/material';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import KeyIcon from '@mui/icons-material/Key';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import BadgeIcon from '@mui/icons-material/Badge';
import { PMSLogo } from '../components/Logo';

export default function Login() {
  const theme = useTheme();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({ staff_code: '', password: '', name: '' });
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'info' as AlertColor });

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!formData.staff_code || !formData.password || (!isLogin && !formData.name)) {
      setNotification({ open: true, message: '請完整填寫欄位', severity: 'warning' });
      return;
    }

    setIsLoading(true);
    const apiBase = 'http://192.168.10.1/api';

    try {
      if (isLogin) {
        // 登入
        const res = await axios.post(`${apiBase}/tokens`, {
          staff_code: formData.staff_code,
          password: formData.password
        });
        const { token, name, theme: userTheme } = res.data.data;
        localStorage.setItem('pms_token', token);
        localStorage.setItem('pms_user_name', name);
        if (userTheme) localStorage.setItem('pms_theme', userTheme);
        window.location.href = '/dashboard';
      } else {
        // 註冊
        await axios.post(`${apiBase}/users`, formData);
        setNotification({ open: true, message: '註冊成功！請登入', severity: 'success' });
        setIsLogin(true);
      }
    } catch (error: any) {
      setNotification({ open: true, message: error.response?.data?.message || '操作失敗', severity: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box sx={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
    }}>
      <CssBaseline />
      <Container maxWidth="xs">
        <Fade in timeout={800}>
          <Card elevation={24} sx={{ borderRadius: 5, bgcolor: 'rgba(255, 255, 255, 0.96)', backdropFilter: 'blur(10px)' }}>
            <CardContent sx={{ p: 4 }}>
              <Box sx={{ textAlign: 'center', mb: 3 }}>
                <Box sx={{ display: 'inline-flex', p: 1.5, borderRadius: 3, bgcolor: 'white', boxShadow: 3, mb: 2 }}>
                  <PMSLogo size={50} />
                </Box>
                <Typography variant="h4" fontWeight="900" color="primary">PMS</Typography>
                <Typography variant="body2" color="text.secondary">資傳系 · 財產管理系統</Typography>
              </Box>

              <Tabs value={isLogin ? 0 : 1} onChange={(_, v) => setIsLogin(v === 0)} centered sx={{ mb: 2 }}>
                <Tab label="帳號登入" />
                <Tab label="快速註冊" />
              </Tabs>

              <form onSubmit={handleSubmit}>
                {!isLogin && (
                  <TextField fullWidth margin="normal" label="姓名" name="name" onChange={handleChange}
                    slotProps={{ input: { startAdornment: <InputAdornment position="start"><BadgeIcon color="action" /></InputAdornment> } }} />
                )}
                <TextField fullWidth margin="normal" label="帳號" name="staff_code" onChange={handleChange}
                  slotProps={{ input: { startAdornment: <InputAdornment position="start"><PersonOutlineIcon color="action" /></InputAdornment> } }} />
                <TextField fullWidth margin="normal" label="密碼" type={showPassword ? 'text' : 'password'} name="password" onChange={handleChange}
                  slotProps={{ input: { 
                    startAdornment: <InputAdornment position="start"><KeyIcon color="action" /></InputAdornment>,
                    endAdornment: <InputAdornment position="end">
                      <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">{showPassword ? <VisibilityOff /> : <Visibility />}</IconButton>
                    </InputAdornment>
                  } }} />
                <Button type="submit" fullWidth variant="contained" size="large" disabled={isLoading} sx={{ mt: 4, py: 1.8, borderRadius: 3, fontWeight: 'bold' }}>
                  {isLoading ? '處理中...' : (isLogin ? '進入系統' : '立即註冊')}
                </Button>
              </form>
            </CardContent>
          </Card>
        </Fade>
      </Container>
      <Snackbar open={notification.open} autoHideDuration={4000} onClose={() => setNotification({ ...notification, open: false })} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
        <Alert severity={notification.severity} variant="filled">{notification.message}</Alert>
      </Snackbar>
    </Box>
  );
}