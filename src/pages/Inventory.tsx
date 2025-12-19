import { useEffect, useState, useCallback, useMemo } from 'react';
import axios from 'axios';
import { useSearchParams } from 'react-router-dom';

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
  Stack,
  Button,
  CircularProgress,
  Alert,
  Checkbox,
  Tooltip
} from '@mui/material';

// Icons
import SearchIcon from '@mui/icons-material/Search';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CloseIcon from '@mui/icons-material/Close';
import HistoryIcon from '@mui/icons-material/History';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';

// 引入子組件
import TransactionDialog from "../components/TransactionDialog";

// 選項定義
const STATUS_OPTIONS = ['全部', '閒置', '使用中', '借用中', '維修中', '遺失', '報廢'];
const CATEGORY_OPTIONS = ['全部', '非消耗品', '消耗品'];

// 資料介面
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
  const [searchParams, setSearchParams] = useSearchParams();

  // 資料狀態
  const [assets, setAssets] = useState<AssetItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  // 篩選與分頁狀態
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState('全部');
  const [categoryFilter, setCategoryFilter] = useState('全部');

  // 勾選與異動 Dialog 狀態
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [openTransDialog, setOpenTransDialog] = useState(false);

  // 抽屜 (Drawer) 狀態
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [historyData, setHistoryData] = useState<AssetHistory | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);

  // 計算目前被勾選的資產物件 (傳給 Dialog 使用)
  const selectedAssets = useMemo(() => {
    return assets.filter(a => selectedIds.includes(a.id));
  }, [assets, selectedIds]);

  // 1. 取得資產列表
  const fetchAssets = useCallback(async () => {
    setLoading(true);
    // 換頁或重新搜尋時清空勾選，防止誤操作
    setSelectedIds([]); 

    try {
      const token = localStorage.getItem('plms_token');
      if (!token) return;

      const params = new URLSearchParams();
      params.append('page', (page + 1).toString());
      params.append('limit', rowsPerPage.toString());
      if (keyword) params.append('keyword', keyword);
      if (statusFilter !== '全部') params.append('status', statusFilter);
      if (categoryFilter !== '全部') params.append('category', categoryFilter);

      // 處理來自 Dashboard 的跳轉
      const urlStatus = searchParams.get('status');
      if(urlStatus && statusFilter === '全部') { 
          setStatusFilter(urlStatus);
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

  // 2. Checkbox 處理邏輯
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(assets.map(a => a.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: number) => {
    const index = selectedIds.indexOf(id);
    if (index === -1) setSelectedIds([...selectedIds, id]);
    else setSelectedIds(selectedIds.filter(x => x !== id));
  };

  // 3. 取得單一資產履歷 (開啟抽屜)
  const handleRowClick = async (id: number) => {
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
      
      {/* 頂部標題 */}
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
            <Typography variant="h5" fontWeight="bold" color="text.primary">資產總表</Typography>
            <Typography variant="body2" color="text.secondary">共 {totalCount} 筆資產</Typography>
        </Box>
      </Box>

      {/* 篩選與異動工具列 (MUI v6 Grid 語法) */}
      <Paper sx={{ p: 2, mb: 2, borderRadius: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField
              fullWidth size="small"
              placeholder="搜尋名稱、編號、廠牌..."
              value={keyword}
              onChange={(e) => { setKeyword(e.target.value); setPage(0); }}
              slotProps={{
                input: {
                  startAdornment: <InputAdornment position="start"><SearchIcon color="action" /></InputAdornment>,
                }
              }}
            />
          </Grid>
          <Grid size={{ xs: 6, sm: 3 }}>
            <TextField
              select fullWidth size="small" label="狀態"
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
            >
              {STATUS_OPTIONS.map((opt) => <MenuItem key={opt} value={opt}>{opt}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid size={{ xs: 6, sm: 3 }}>
            <TextField
              select fullWidth size="small" label="類別"
              value={categoryFilter}
              onChange={(e) => { setCategoryFilter(e.target.value); setPage(0); }}
            >
              {CATEGORY_OPTIONS.map((opt) => <MenuItem key={opt} value={opt}>{opt}</MenuItem>)}
            </TextField>
          </Grid>
          
          {/* 異動按鈕：取代原本的篩選按鈕 */}
          <Grid size={{ xs: 12, sm: 2 }}>
             <Button 
                variant="contained" 
                color="warning" 
                fullWidth 
                startIcon={<SwapHorizIcon />}
                disabled={selectedIds.length === 0}
                onClick={() => setOpenTransDialog(true)}
                sx={{ fontWeight: 'bold' }}
             >
               {selectedIds.length > 0 ? `異動 (${selectedIds.length})` : '異動'}
             </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* 資料表格 */}
      <Paper 
        sx={{ 
            flexGrow: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', borderRadius: 2,
            border: (theme) => `1px solid ${theme.palette.divider}`,
            bgcolor: 'background.paper'
        }}
      >
        <TableContainer sx={{ flexGrow: 1 }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell 
                    padding="checkbox" 
                    sx={{ bgcolor: (theme) => theme.palette.mode === 'dark' ? 'grey.800' : 'grey.100' }}
                >
                  <Checkbox
                    color="primary"
                    indeterminate={selectedIds.length > 0 && selectedIds.length < assets.length}
                    checked={assets.length > 0 && selectedIds.length === assets.length}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                  />
                </TableCell>
                {['財產編號', '品名', '廠牌/型號', '狀態', '位置', '保管人/借用人', '詳情'].map((head) => (
                    <TableCell 
                        key={head}
                        align={head === '狀態' || head === '詳情' ? 'center' : 'left'}
                        sx={{ 
                            fontWeight: 'bold', 
                            bgcolor: (theme) => theme.palette.mode === 'dark' ? 'grey.800' : 'grey.100',
                            color: 'text.primary'
                        }}
                    >
                        {head}
                    </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={8} align="center" sx={{ py: 10 }}><CircularProgress /></TableCell></TableRow>
              ) : assets.length === 0 ? (
                <TableRow><TableCell colSpan={8} align="center" sx={{ py: 10, color: 'text.secondary' }}>查無資料</TableCell></TableRow>
              ) : (
                assets.map((row) => {
                  const isSelected = selectedIds.includes(row.id);
                  return (
                    <TableRow 
                        key={row.id} hover selected={isSelected}
                        onClick={(e) => {
                            // 排除 Checkbox 與按鈕，點擊行開啟抽屜
                            const target = e.target as HTMLElement;
                            if (target.tagName !== 'INPUT' && target.tagName !== 'BUTTON' && !target.closest('button')) {
                                handleRowClick(row.id);
                            }
                        }}
                        sx={{ cursor: 'pointer' }}
                    >
                      <TableCell padding="checkbox">
                        <Checkbox
                          color="primary"
                          checked={isSelected}
                          onClick={(e) => { e.stopPropagation(); handleSelectOne(row.id); }}
                        />
                      </TableCell>
                      <TableCell sx={{ fontFamily: 'monospace' }}>{row.sub_no}</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>{row.asset_name}</TableCell>
                      <TableCell>{row.brand} {row.model}</TableCell>
                      <TableCell align="center">
                        <Chip label={row.status} size="small" color={getStatusColor(row.status)} variant="filled" />
                      </TableCell>
                      <TableCell>{row.location_name || '-'}</TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2">{row.owner_name}</Typography>
                          {row.current_user && (
                            <Typography variant="caption" color="secondary">(借: {row.current_user})</Typography>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title="查看詳情">
                            <IconButton size="small" color="primary" onClick={(e) => { e.stopPropagation(); handleRowClick(row.id); }}>
                                <VisibilityIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
        
        <TablePagination
          rowsPerPageOptions={[10, 25, 50]}
          component="div"
          count={totalCount}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
          labelRowsPerPage="每頁筆數:"
        />
      </Paper>

      {/* 資產履歷抽屜 */}
      <Drawer
        anchor="right" open={drawerOpen} onClose={() => setDrawerOpen(false)}
        slotProps={{ paper: { sx: { width: { xs: '100%', sm: 450 }, bgcolor: 'background.paper' } } }}
      >
        {historyLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}><CircularProgress /></Box>
        ) : historyData ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <Box sx={{ p: 3, bgcolor: 'action.hover', borderBottom: 1, borderColor: 'divider' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Chip label={historyData.asset_info.status} color={getStatusColor(historyData.asset_info.status)} size="small" />
                <IconButton onClick={() => setDrawerOpen(false)} size="small"><CloseIcon /></IconButton>
              </Box>
              <Typography variant="h5" fontWeight="bold">{historyData.asset_info.name}</Typography>
              <Typography variant="body2" color="text.secondary" fontFamily="monospace">編號: {historyData.asset_info.sub_no}</Typography>
            </Box>

            <Box sx={{ p: 3, flexGrow: 1, overflowY: 'auto' }}>
              <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <HistoryIcon color="primary" /> 資產履歷
              </Typography>
              <Stack spacing={0}>
                {historyData.timeline.map((log, index) => (
                  <Box key={index} sx={{ display: 'flex', gap: 2, pb: 3, position: 'relative' }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 20 }}>
                      <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: 'primary.main', zIndex: 1 }} />
                      {index !== historyData.timeline.length - 1 && <Box sx={{ width: 2, flexGrow: 1, bgcolor: 'divider', mt: 0.5 }} />}
                    </Box>
                    <Box sx={{ mt: -0.5, width: '100%' }}>
                      <Typography variant="caption" color="text.secondary">{log.event_date}</Typography>
                      <Typography variant="subtitle2" fontWeight="bold">{log.action_type} <Typography component="span" variant="caption">({log.operator})</Typography></Typography>
                      <Paper variant="outlined" sx={{ p: 1.5, mt: 1, bgcolor: 'background.default', borderRadius: 2 }}>
                        <Typography variant="body2">{log.description || '無備註'}</Typography>
                        {log.location && <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>📍 {log.location}</Typography>}
                      </Paper>
                    </Box>
                  </Box>
                ))}
              </Stack>
            </Box>
          </Box>
        ) : <Alert severity="error">無法讀取資料</Alert>}
      </Drawer>

      {/* 異動 Dialog 組件 */}
      <TransactionDialog
        open={openTransDialog}
        onClose={() => setOpenTransDialog(false)}
        selectedAssets={selectedAssets}
        onSuccess={() => { fetchAssets(); }}
      />
    </Box>
  );
}