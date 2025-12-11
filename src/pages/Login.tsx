import { useState, ChangeEvent, FormEvent } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

// MUI 組件
import { 
  Box, Card, CardContent, TextField, Button, Typography, Container, 
  InputAdornment, Avatar, CssBaseline, Snackbar, Alert, AlertColor
} from '@mui/material';

// MUI 圖標
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import KeyIcon from '@mui/icons-material/Key';

// 定義通知狀態的介面
interface NotificationState {
  open: boolean;
  message: string;
  severity: AlertColor;
}

export default function Login() {
  const navigate = useNavigate();

  // 定義表單資料
  const [formData, setFormData] = useState({
    staff_code: '',
    password: ''
  });
  
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const [notification, setNotification] = useState<NotificationState>({
    open: false,
    message: '',
    severity: 'info'
  });

  // TS: 指定事件型別為 HTMLInputElement 的變更事件
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const showNotification = (msg: string, type: AlertColor = 'info') => {
    setNotification({
      open: true,
      message: msg,
      severity: type
    });
  };

  const handleCloseNotification = (_event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') return;
    setNotification({ ...notification, open: false });
  };

  // TS: 指定表單送出事件
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!formData.staff_code || !formData.password) {
      showNotification('請填寫帳號與密碼欄位！', 'warning');
      return; 
    }

    setIsLoading(true);

    try {
      // 發送請求
      const response = await axios.post('http://192.168.10.1/api/auth/login', formData);
      
      // 這裡假設後端回傳結構是 { data: { token: string, name: string } }
      // 使用 any 暫時繞過強型別檢查，以免後端回傳結構微調時報錯
      const { token, name, theme } = response.data.data;
      
      localStorage.setItem('plms_token', token);
      localStorage.setItem('plms_user_name', name);
      if (theme) {
        localStorage.setItem('plms_theme', theme);
        // 注意：這裡存入 LocalStorage 後，因為 React App 已經渲染，
        // ThemeContext 不會自動變更（除非重新整理）。
        // 為了完美體驗，通常建議登入後做一次 window.location.reload() 或 redirect
        // 不過因為您的邏輯是 navigate('/dashboard')，這會觸發 Dashboard 重新渲染，
        // 但最外層的 Context 可能不會變。
        
        // 簡單解法：這裡強制重整一次頁面跳轉
        window.location.href = '/dashboard'; 
        return; // 中斷後續 navigate
      }

      showNotification(`登入成功！歡迎回來，${name}`, 'success');
      
      // 1 秒後跳轉到資產清單頁
      setTimeout(() => {
        navigate('/dashboard');
      }, 1000);

    } catch (error: any) {
      console.error('登入錯誤:', error);
      
      let errorMsg = '連線失敗，請檢查網路或伺服器狀態';
      if (error.response && error.response.data && error.response.data.message) {
        errorMsg = error.response.data.message;
      }

      showNotification(errorMsg, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
        padding: 2
      }}
    >
      <CssBaseline />
      
      <Container maxWidth="xs">
        <Card 
          elevation={10} 
          sx={{ borderRadius: 4, overflow: 'visible', mt: 4 }}
        >
          <CardContent sx={{ p: 4, textAlign: 'center' }}>
            
            <Box sx={{ marginTop: -8, marginBottom: 2, display: 'flex', justifyContent: 'center' }}>
              <Avatar sx={{ width: 80, height: 80, bgcolor: 'secondary.main', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}>
                <LockOutlinedIcon sx={{ fontSize: 40 }} />
              </Avatar>
            </Box>

            <Typography component="h1" variant="h4" fontWeight="bold" gutterBottom sx={{ color: '#333' }}>
              PLMS
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
              資產管理系統登入
            </Typography>

            <form onSubmit={handleSubmit} noValidate>
              <TextField
                fullWidth
                margin="normal"
                label="教職員編號 (Staff Code)"
                name="staff_code"
                value={formData.staff_code}
                onChange={handleChange}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <PersonOutlineIcon color="action" />
                      </InputAdornment>
                    ),
                  }
                }}
                sx={{ mb: 2 }}
              />

              <TextField
                fullWidth
                margin="normal"
                label="密碼 (Password)"
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <KeyIcon color="action" />
                      </InputAdornment>
                    ),
                  }
                }}
                sx={{ mb: 3 }}
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={isLoading}
                sx={{
                  py: 1.5,
                  fontSize: '1.1rem',
                  borderRadius: 2,
                  textTransform: 'none',
                  boxShadow: '0 4px 12px rgba(33, 150, 243, .3)',
                  backgroundColor: '#1976d2',
                  '&:hover': { backgroundColor: '#115293' }
                }}
              >
                {isLoading ? '登入中...' : '登入系統'}
              </Button>
            </form>
            
            <Typography variant="caption" display="block" sx={{ mt: 4, color: '#aaa' }}>
              © 2025 Property List Management System
            </Typography>

          </CardContent>
        </Card>
      </Container>

      <Snackbar 
        open={notification.open} 
        autoHideDuration={4000} 
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }} 
      >
        <Alert 
          onClose={handleCloseNotification} 
          severity={notification.severity} 
          variant="filled" 
          sx={{ width: '100%', boxShadow: 3 }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}