import { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

// MUI 組件
import {
  Box,
  Typography,
  Button,
  Container,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  Alert,
  AppBar,
  Toolbar,
} from '@mui/material';

// MUI 圖標
import LogoutIcon from '@mui/icons-material/Logout';
import RefreshIcon from '@mui/icons-material/Refresh';
import InventoryIcon from '@mui/icons-material/Inventory';

// 1. 定義資料型別 (對應後端 API 回傳的欄位)
interface AssetBatch {
  id: number;
  batch_no: string;
  asset_name: string;
  category: string;
  brand: string;
  model: string;
  qty: number;
  unit: string;
  total_price: string;
  purchase_date: string;
  property_range: string;
}

interface ApiResponse {
  data: AssetBatch[];
  meta: {
    total_records: number;
    current_page: number;
    total_pages: number;
    limit: number;
  };
}

export default function Inventory() {
  const navigate = useNavigate();
  const userName = localStorage.getItem('plms_user_name') || '使用者';

  // 2. 定義狀態
  const [batches, setBatches] = useState<AssetBatch[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // 3. 抓取資料的函式
  const fetchBatches = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('plms_token');
      if (!token) {
        throw new Error('未登入，請重新登入');
      }

      // 發送 GET 請求 (記得帶 Token)
      const response = await axios.get<ApiResponse>(
        'http://192.168.10.1/api/asset/batch_list.php?page=1&limit=10',
        {
          headers: {
            Authorization: `Bearer ${token}` // 把通行證掛在 Header
          }
        }
      );

      // 設定資料
      setBatches(response.data.data);

    } catch (err: any) {
      console.error('讀取失敗', err);
      // 如果是 401 (未授權)，踢回登入頁
      if (err.response && err.response.status === 401) {
        handleLogout();
      } else {
        setError('無法讀取資料，請檢查網路或伺服器。');
      }
    } finally {
      setLoading(false);
    }
  };

  // 4. 頁面載入時執行
  useEffect(() => {
    fetchBatches();
  }, []);

  // 登出邏輯
  const handleLogout = () => {
    localStorage.removeItem('plms_token');
    localStorage.removeItem('plms_user_name');
    navigate('/');
  };

  return (
    <Box sx={{ flexGrow: 1, height: '100vh', backgroundColor: '#f5f5f5' }}>
      
      {/* 頂部導覽列 */}
      <AppBar position="static" sx={{ background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)' }}>
        <Toolbar>
          <InventoryIcon sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            PLMS 資產管理系統
          </Typography>
          <Typography variant="body2" sx={{ mr: 2 }}>
            Hi, {userName}
          </Typography>
          <Button color="inherit" onClick={handleLogout} startIcon={<LogoutIcon />}>
            登出
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        
        {/* 標題與重新整理按鈕 */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1" fontWeight="bold" color="text.primary">
            📦 資產批次清單
          </Typography>
          <Button 
            variant="outlined" 
            startIcon={<RefreshIcon />} 
            onClick={fetchBatches}
            disabled={loading}
          >
            重新整理
          </Button>
        </Box>

        {/* 錯誤訊息 */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* 資料表格 */}
        <TableContainer component={Paper} elevation={3} sx={{ borderRadius: 2 }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Table sx={{ minWidth: 650 }} aria-label="simple table">
              <TableHead sx={{ backgroundColor: '#f0f2f5' }}>
                <TableRow>
                  <TableCell><strong>增加單號</strong></TableCell>
                  <TableCell><strong>品名</strong></TableCell>
                  <TableCell><strong>廠牌/型號</strong></TableCell>
                  <TableCell align="center"><strong>數量</strong></TableCell>
                  <TableCell><strong>財產編號</strong></TableCell>
                  <TableCell align="right"><strong>總價</strong></TableCell>
                  <TableCell align="center"><strong>類別</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {batches.length > 0 ? (
                  batches.map((row) => (
                    <TableRow
                      key={row.id}
                      sx={{ '&:last-child td, &:last-child th': { border: 0 }, '&:hover': { backgroundColor: '#fafafa' } }}
                    >
                      <TableCell component="th" scope="row">
                        {row.batch_no}
                      </TableCell>
                      <TableCell>{row.asset_name}</TableCell>
                      <TableCell>{row.brand} {row.model}</TableCell>
                      <TableCell align="center">
                        <Chip label={row.qty + " " + row.unit} size="small" color="primary" variant="outlined" />
                      </TableCell>
                      <TableCell>{row.property_range}</TableCell>
                      <TableCell align="right" sx={{ fontFamily: 'monospace', fontWeight: 'bold' }}>
                        ${Number(row.total_price).toLocaleString()}
                      </TableCell>
                      <TableCell align="center">
                        <Chip 
                          label={row.category} 
                          color={row.category === '非消耗品' ? 'success' : 'warning'} 
                          size="small" 
                        />
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                      <Typography variant="body1" color="text.secondary">
                        目前沒有任何資產資料
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </TableContainer>
      </Container>
    </Box>
  );
}