import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { useNavigate, useSearchParams } from 'react-router-dom';

// MUI 組件
import {
  Box,
  Grid,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  TextField,
  MenuItem,
  InputAdornment,
  TablePagination,
  IconButton,
  Drawer,
  Divider,
  Stack,
  Button,
  CircularProgress,
  Alert
} from '@mui/material';

// Icons
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CloseIcon from '@mui/icons-material/Close';
import HistoryIcon from '@mui/icons-material/History';


// 狀態選項
const STATUS_OPTIONS = ['全部', '閒置', '使用中', '借用中', '維修中', '遺失', '報廢'];
const CATEGORY_OPTIONS = ['全部', '非消耗品', '消耗品'];

// 資料介面 (對應後端 AssetController@index)
interface AssetItem {
  id: number;
  sub_no: string;
  status: string;
  item_condition: string;
  updated_at: string;
  asset_name: string;
  brand: string;
  model: string;
  spec: string;
  location_name: string;
  owner_name: string;
  current_user: string | null;
}

interface ApiResponse {
  data: AssetItem[];
  meta: {
    total_records: number;
    current_page: number;
    total_pages: number;
    limit: number;
  };
}

// 履歷資料介面 (對應 AssetController@history)
interface AssetHistory {
  asset_info: any;
  timeline: Array<{
    source_type: string;
    event_date: string;
    action_type: string;
    operator: string;
    description: string;
    location: string;
  }>;
}

export default function Inventory() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // 資料狀態
  const [assets, setAssets] = useState<AssetItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  // 篩選狀態
  const [page, setPage] = useState(0); // MUI Table 是 0-based
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState('全部');
  const [categoryFilter, setCategoryFilter] = useState('全部');

  // 抽屜 (Drawer) 狀態
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedAssetId, setSelectedAssetId] = useState<number | null>(null);
  const [historyData, setHistoryData] = useState<AssetHistory | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);

  // 1. 取得資產列表
  const fetchAssets = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('plms_token');
      if (!token) return;

      const params = new URLSearchParams();
      params.append('page', (page + 1).toString()); // 後端是 1-based
      params.append('limit', rowsPerPage.toString());
      if (keyword) params.append('keyword', keyword);
      if (statusFilter !== '全部') params.append('status', statusFilter);
      if (categoryFilter !== '全部') params.append('category', categoryFilter);

      // 如果從 Dashboard 點擊 "借用中" 跳轉過來，會帶有 URL query
      const urlStatus = searchParams.get('status');
      if(urlStatus && statusFilter === '全部') { 
          setStatusFilter(urlStatus); // 同步給 Filter
          params.set('status', urlStatus); 
      }

      const response = await axios.get<ApiResponse>(
        `http://192.168.10.1/api/assets?${params.toString()}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setAssets(response.data.data);
      setTotalCount(response.data.meta.total_records);

    } catch (error) {
      console.error('Fetch assets error:', error);
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, keyword, statusFilter, categoryFilter, searchParams]);

  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

  // 2. 取得單一資產詳情與履歷
  const handleRowClick = async (id: number) => {
    setSelectedAssetId(id);
    setDrawerOpen(true);
    setHistoryLoading(true);
    setHistoryData(null);

    try {
      const token = localStorage.getItem('plms_token');
      const response = await axios.get<AssetHistory>(
        `http://192.168.10.1/api/assets/${id}/history`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setHistoryData(response.data);
    } catch (error) {
      console.error('Fetch history error:', error);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleCloseDrawer = () => {
    setDrawerOpen(false);
    setSelectedAssetId(null);
  };

  // 狀態顏色對應
  const getStatusColor = (status: string): "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning" => {
    switch (status) {
      case '閒置': return 'info';
      case '使用中': return 'success';
      case '借用中': return 'secondary';
      case '維修中': return 'warning';
      case '遺失': return 'error';
      case '報廢': return 'default';
      default: return 'default';
    }
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      
      {/* 頂部工具列 */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h5" fontWeight="bold" color="text.primary">
          資產總表
        </Typography>
      </Box>

      {/* 篩選區塊 */}
      <Paper sx={{ p: 2, mb: 2, borderRadius: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="搜尋名稱、編號、廠牌..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              slotProps={{
                input: {
                  startAdornment: <InputAdornment position="start"><SearchIcon color="action" /></InputAdornment>,
                }
              }}
            />
          </Grid>
          <Grid size={{ xs: 6, sm: 3 }}>
            <TextField
              select
              fullWidth
              size="small"
              label="狀態"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              {STATUS_OPTIONS.map((opt) => <MenuItem key={opt} value={opt}>{opt}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid size={{ xs: 6, sm: 3 }}>
            <TextField
              select
              fullWidth
              size="small"
              label="類別"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              {CATEGORY_OPTIONS.map((opt) => <MenuItem key={opt} value={opt}>{opt}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, sm: 2 }}>
             <Button 
                variant="outlined" 
                startIcon={<FilterListIcon />} 
                fullWidth 
                onClick={() => { setPage(0); fetchAssets(); }}
             >
               篩選
             </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* 資料表格 */}
      <Paper sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', borderRadius: 2 }}>
        <TableContainer sx={{ flexGrow: 1 }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold', bgcolor: 'background.paper' }}>財產編號</TableCell>
                <TableCell sx={{ fontWeight: 'bold', bgcolor: 'background.paper' }}>品名</TableCell>
                <TableCell sx={{ fontWeight: 'bold', bgcolor: 'background.paper' }}>廠牌/型號</TableCell>
                <TableCell sx={{ fontWeight: 'bold', bgcolor: 'background.paper' }} align="center">狀態</TableCell>
                <TableCell sx={{ fontWeight: 'bold', bgcolor: 'background.paper' }}>位置</TableCell>
                <TableCell sx={{ fontWeight: 'bold', bgcolor: 'background.paper' }}>保管人/借用人</TableCell>
                <TableCell sx={{ fontWeight: 'bold', bgcolor: 'background.paper' }} align="center">詳情</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 10 }}>
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : assets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 10, color: 'text.secondary' }}>
                    查無資料
                  </TableCell>
                </TableRow>
              ) : (
                assets.map((row) => (
                  <TableRow key={row.id} hover onClick={() => handleRowClick(row.id)} sx={{ cursor: 'pointer' }}>
                    <TableCell sx={{ fontFamily: 'monospace' }}>{row.sub_no}</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>{row.asset_name}</TableCell>
                    <TableCell>{row.brand} {row.model}</TableCell>
                    <TableCell align="center">
                      <Chip 
                        label={row.status} 
                        size="small" 
                        color={getStatusColor(row.status)} 
                        variant="filled"
                        sx={{ minWidth: 60 }}
                      />
                    </TableCell>
                    <TableCell>{row.location_name || '-'}</TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2">{row.owner_name}</Typography>
                        {row.current_user && (
                          <Typography variant="caption" color="secondary">
                            (借: {row.current_user})
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      <IconButton size="small" color="primary">
                        <VisibilityIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        
        {/* 分頁器 */}
        <TablePagination
          rowsPerPageOptions={[10, 25, 50]}
          component="div"
          count={totalCount}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          labelRowsPerPage="每頁筆數:"
        />
      </Paper>

      {/* --- 右側詳情抽屜 (Side Drawer) --- */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={handleCloseDrawer}
        slotProps={{ 
            paper: {
                sx: { 
                    width: { xs: '100%', sm: 450 }, 
                    p: 0,
                    // 抽屜背景色改為預設背景 (深色時為深灰)
                    bgcolor: 'background.paper',
                    backgroundImage: 'none' // 移除 MUI 預設的 elevation 疊加層
                } 
            }
        }}
      >
        {historyLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <CircularProgress />
          </Box>
        ) : historyData ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            
            {/* 抽屜標題 */}
            <Box sx={{ p: 3, bgcolor: 'background.default', borderBottom: 1, borderColor: 'divider' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                <Chip label={historyData.asset_info.status} color={getStatusColor(historyData.asset_info.status)} size="small" />
                <IconButton onClick={handleCloseDrawer} size="small"><CloseIcon /></IconButton>
              </Box>
              <Typography variant="h5" fontWeight="bold">
                {historyData.asset_info.name}
              </Typography>
              <Typography variant="body2" color="text.secondary" fontFamily="monospace">
                編號: {historyData.asset_info.sub_no}
              </Typography>
            </Box>

            {/* 履歷 Timeline */}
            <Box sx={{ p: 3, flexGrow: 1, overflowY: 'auto' }}>
              <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <HistoryIcon color="primary" /> 資產履歷
              </Typography>
              
              <Stack spacing={0}>
                {historyData.timeline.map((log, index) => (
                  <Box key={index} sx={{ display: 'flex', gap: 2, position: 'relative', pb: 3 }}>
                    {/* 左側時間軸線 */}
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 20 }}>
                      <Box sx={{ 
                        width: 10, height: 10, borderRadius: '50%', 
                        bgcolor: index === historyData.timeline.length - 1 ? 'primary.main' : 'text.disabled',
                        zIndex: 1
                      }} />
                      {index !== historyData.timeline.length - 1 && (
                        <Box sx={{ width: 2, flexGrow: 1, bgcolor: '#e0e0e0', mt: 0.5 }} />
                      )}
                    </Box>
                    
                    {/* 右側內容 */}
                    <Box sx={{ mt: -0.5, width: '100%' }}>
                      <Typography variant="caption" color="text.secondary" display="block">
                        {log.event_date}
                      </Typography>
                      <Typography variant="subtitle2" fontWeight="bold">
                        {log.action_type} 
                        {log.operator && <Typography component="span" variant="caption" color="text.secondary"> ({log.operator})</Typography>}
                      </Typography>
                      <Paper variant="outlined" sx={{ p: 1.5, mt: 1, bgcolor: 'action.hover', borderRadius: 2 }}>
                        <Typography variant="body2" color="text.primary">
                          {log.description || '無備註'}
                        </Typography>
                        {log.location && (
                          <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                            📍 {log.location}
                          </Typography>
                        )}
                      </Paper>
                    </Box>
                  </Box>
                ))}
                {historyData.timeline.length === 0 && (
                  <Typography variant="body2" color="text.secondary" align="center">無履歷資料</Typography>
                )}
              </Stack>
            </Box>

            {/* 底部操作按鈕 (預留) */}
            <Box sx={{ p: 2, borderTop: '1px solid #eee', display: 'flex', gap: 2 }}>
              <Button variant="outlined" fullWidth color="warning">維修</Button>
              <Button variant="contained" fullWidth color="primary">借出</Button>
            </Box>
          </Box>
        ) : (
          <Alert severity="error" sx={{ m: 2 }}>無法讀取資料</Alert>
        )}
      </Drawer>
    </Box>
  );
}