import { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

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
  IconButton,
  Badge,
  Popover,
  Chip,
  Skeleton, 
  List,
  ListItem,
  ListItemText,
  useTheme,
  alpha
} from '@mui/material';

// MUI 圖標
import NotificationsIcon from '@mui/icons-material/Notifications';
import HistoryIcon from '@mui/icons-material/History';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import BuildIcon from '@mui/icons-material/Build';
import ComputerIcon from '@mui/icons-material/Computer';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd';
import QuestionMarkIcon from '@mui/icons-material/QuestionMark';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PieChartIcon from '@mui/icons-material/PieChart';

interface DashboardData {
  stats: {
    total: number;
    idle: number;
    in_use: number;
    borrowed: number;
    repair: number;
    scrapped: number;
    lost: number;
  };
  recent_activities: Array<{
    id: number;
    asset_name: string;
    sub_no: string;
    status: string;
    action_type?: string; 
    updated_at: string;
    item_condition: string;
    brand: string;
    model: string;
  }>;
  todos: Array<{ 
      type: 'warning' | 'info' | 'error';
      title: string;
      message: string; 
  }>;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const theme = useTheme();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  
  const userName = localStorage.getItem('plms_user_name') || 'User';
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const token = localStorage.getItem('plms_token');
        if (!token) { navigate('/'); return; }

        const response = await axios.get<DashboardData>(
          'http://192.168.10.1/api/dashboard/summary', 
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setData(response.data);
      } catch (error) {
        console.error('Error fetching dashboard:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, [navigate]);

  const handleNotiClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleNotiClose = () => {
    setAnchorEl(null);
  };
  const notiOpen = Boolean(anchorEl);

  const MiniStat = ({ label, value, icon, color, onClick }: any) => (
    <Paper
      elevation={0}
      onClick={onClick}
      sx={{
        p: 1.5,
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        bgcolor: (theme) => alpha(color, theme.palette.mode === 'dark' ? 0.2 : 0.05),
        border: '1px solid',
        borderColor: (theme) => alpha(color, theme.palette.mode === 'dark' ? 0.4 : 0.2),
        borderRadius: 2,
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.2s',
        '&:hover': { 
            bgcolor: alpha(color, 0.1), 
            transform: 'translateY(-2px)',
            boxShadow: `0 4px 12px ${alpha(color, 0.15)}`
        }
      }}
    >
        <Box>
            <Typography variant="h5" fontWeight="800" sx={{ color: color }}>
                {value}
            </Typography>
            <Typography variant="caption" fontWeight="600" sx={{ color: 'text.secondary' }}>
                {label}
            </Typography>
        </Box>
        <Box sx={{ color: color, display: 'flex', p: 0.8, borderRadius: '50%', bgcolor: 'background.paper' }}>
            {icon}
        </Box>
    </Paper>
  );

  if (loading || !data) {
    return (
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 2, p: 1 }}>
        <Skeleton variant="rectangular" height={160} sx={{ borderRadius: 3 }} />
        <Skeleton variant="rectangular" height="100%" sx={{ borderRadius: 3 }} />
      </Box>
    );
  }

  return (
    <Box sx={{ 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column', 
      // ★ 關鍵修正 1：手機版允許捲動 (auto)，電腦版禁止捲動 (hidden)
      overflowY: { xs: 'auto', md: 'hidden' }, 
      overflowX: 'hidden',
      gap: 2.5,
      // 手機版增加一點底部留白，避免內容貼底
      pb: { xs: 4, md: 0 } 
    }}>
      
      {/* === 區塊 A: 頂部總覽 === */}
      <Box sx={{ flexShrink: 0 }}>
        {/* 標題與鈴鐺 */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, px: 1 }}>
            <Box>
                <Typography variant="h5" fontWeight="800" color="text.primary">
                  Dashboard
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  歡迎回來，{userName}
                </Typography>
            </Box>
            <IconButton onClick={handleNotiClick} size="small" sx={{ bgcolor: 'background.paper', boxShadow: 1 }}>
              <Badge badgeContent={data.todos.length} color="error">
                <NotificationsIcon color="action" fontSize="small" />
              </Badge>
            </IconButton>
        </Box>

        <Grid container spacing={2}>
            {/* 左側：總數 Hero Card */}
            <Grid size={{ xs: 12, md: 3 }}>
                <Paper
                    elevation={0}
                    sx={{
                        p: 2.5,
                        // 手機版高度固定，電腦版撐滿
                        height: { xs: 'auto', md: '100%' }, 
                        minHeight: { xs: 160, md: 0 },
                        background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                        borderRadius: 3,
                        color: '#fff',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        position: 'relative',
                        overflow: 'hidden'
                    }}
                >
                    <Box sx={{ position: 'absolute', right: -20, bottom: -20, opacity: 0.15 }}>
                        <ComputerIcon sx={{ fontSize: 120 }} />
                    </Box>
                    <Typography variant="body2" sx={{ opacity: 0.9, mb: 0.5 }}>我的保管總數</Typography>
                    <Typography variant="h2" fontWeight="800" sx={{ letterSpacing: 1 }}>
                        {data.stats.total}
                    </Typography>
                    <Typography variant="caption" sx={{ opacity: 0.8, mt: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <PieChartIcon fontSize="inherit"/> 資產統計概覽
                    </Typography>
                </Paper>
            </Grid>

            {/* 右側：狀態 Grid */}
            <Grid size={{ xs: 12, md: 9 }}>
                <Grid container spacing={1.5}>
                    <Grid size={{ xs: 6, sm: 4 }}><MiniStat label="使用中" value={data.stats.in_use} color="#2e7d32" icon={<CheckCircleIcon />} /></Grid>
                    <Grid size={{ xs: 6, sm: 4 }}><MiniStat label="閒置資產" value={data.stats.idle} color="#00bcd4" icon={<Inventory2Icon />} /></Grid>
                    <Grid size={{ xs: 6, sm: 4 }}><MiniStat label="借用中" value={data.stats.borrowed} color="#9c27b0" icon={<AssignmentIndIcon />} onClick={() => navigate('/inventory?status=借用中')} /></Grid>
                    <Grid size={{ xs: 6, sm: 4 }}><MiniStat label="維修中" value={data.stats.repair} color="#ed6c02" icon={<BuildIcon />} /></Grid>
                    <Grid size={{ xs: 6, sm: 4 }}><MiniStat label="已遺失" value={data.stats.lost} color="#d32f2f" icon={<QuestionMarkIcon />} /></Grid>
                    <Grid size={{ xs: 6, sm: 4 }}><MiniStat label="已報廢" value={data.stats.scrapped} color="#607d8b" icon={<DeleteForeverIcon />} /></Grid>
                </Grid>
            </Grid>
        </Grid>
      </Box>

      {/* === 區塊 B: 近期動態 (表格) === */}
      <Paper sx={{ 
        // ★ 關鍵修正 2：
        // 電腦版 (md): flexGrow: 1 (填滿剩餘), minHeight: 0 (允許被壓縮以觸發內部捲動)
        // 手機版 (xs): flexGrow: 0 (自然堆疊), height: 400px (固定高度確保顯示)
        flexGrow: { xs: 0, md: 1 }, 
        minHeight: { xs: 400, md: 0 }, 
        borderRadius: 3, 
        boxShadow: '0 4px 20px rgba(0,0,0,0.04)', 
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider'
      }}>
        <Box sx={{ p: 2, px: 3, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', bgcolor: 'background.paper' }}>
          <HistoryIcon sx={{ mr: 1.5, color: 'text.secondary' }} />
          <Typography variant="subtitle1" fontWeight="bold" color="text.primary">
            近期資產動態
          </Typography>
          <Chip label="近3個月" size="small" sx={{ ml: 2, height: 20, fontSize: '0.7rem', bgcolor: 'action.hover' }} />
        </Box>
        
        <TableContainer sx={{ flexGrow: 1, overflowY: 'auto' }}>
          <Table stickyHeader size="medium" aria-label="recent activities table">
            <TableHead>
              <TableRow>
                {/* ★ 修正 2: 
                    - 移除所有 borderBottom: '... #f0f0f0' 
                    - 加入 bgcolor: 'background.paper' (解決透明問題)
                    - 改用 borderColor: 'divider' (解決白線問題)
                */}
                <TableCell sx={{ bgcolor: 'background.paper', fontWeight: 'bold', borderBottom: 1, borderColor: 'divider', color: 'text.secondary', pl: 3, whiteSpace: 'nowrap' }}>單品號</TableCell>
                <TableCell sx={{ bgcolor: 'background.paper', fontWeight: 'bold', borderBottom: 1, borderColor: 'divider', color: 'text.secondary', whiteSpace: 'nowrap' }}>品名</TableCell>
                <TableCell sx={{ bgcolor: 'background.paper', fontWeight: 'bold', borderBottom: 1, borderColor: 'divider', color: 'text.secondary', whiteSpace: 'nowrap' }} align="center">動作狀態</TableCell>
                <TableCell sx={{ bgcolor: 'background.paper', fontWeight: 'bold', borderBottom: 1, borderColor: 'divider', color: 'text.secondary', whiteSpace: 'nowrap' }} align="center">狀況</TableCell>
                <TableCell sx={{ bgcolor: 'background.paper', fontWeight: 'bold', borderBottom: 1, borderColor: 'divider', color: 'text.secondary', whiteSpace: 'nowrap' }}>廠牌</TableCell>
                <TableCell sx={{ bgcolor: 'background.paper', fontWeight: 'bold', borderBottom: 1, borderColor: 'divider', color: 'text.secondary', whiteSpace: 'nowrap' }}>型號</TableCell>
                <TableCell sx={{ bgcolor: 'background.paper', fontWeight: 'bold', borderBottom: 1, borderColor: 'divider', color: 'text.secondary', whiteSpace: 'nowrap' }}>更新時間</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.recent_activities && data.recent_activities.length > 0 ? (
                data.recent_activities.map((item) => {
                  
                  let statusColor: any = "default";
                  if (item.status === '維修中') statusColor = "warning";
                  if (item.status === '使用中') statusColor = "success";
                  if (item.status === '借用中') statusColor = "secondary";
                  if (item.status === '遺失') statusColor = "error";
                  if (item.status === '閒置') statusColor = "info";

                  const conditionColor = item.item_condition === '壞' ? 'error.main' : 'text.primary';

                  return (
                    <TableRow key={item.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                      <TableCell sx={{ fontFamily: 'monospace', color: 'text.secondary', fontWeight: 500, pl: 3 }}>
                        {item.sub_no}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="600" noWrap sx={{ maxWidth: 120 }}>
                            {item.asset_name}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Chip label={item.status} size="small" color={statusColor} variant="filled" sx={{ height: 24, fontSize: '0.75rem', fontWeight: 600, minWidth: 60 }} />
                      </TableCell>
                      <TableCell align="center">
                        <Typography variant="body2" sx={{ color: conditionColor, fontWeight: 'bold', fontSize: '0.85rem' }}>
                          {item.item_condition}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ color: 'text.secondary' }}>{item.brand}</TableCell>
                      <TableCell sx={{ color: 'text.secondary' }}>{item.model}</TableCell>
                      <TableCell sx={{ color: 'text.secondary', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
                        {item.updated_at.split(' ')[0]}
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 8 }}>
                    <Typography color="text.secondary" sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                        <HistoryIcon sx={{ fontSize: 40, opacity: 0.2 }} />
                        近期沒有任何動態紀錄
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* 通知視窗 (保持不變) */}
      <Popover
        open={notiOpen}
        anchorEl={anchorEl}
        onClose={handleNotiClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Box sx={{ p: 2, width: 300, maxHeight: 300, overflow: 'auto' }}>
          <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1, pb: 1, borderBottom: '1px solid #eee' }}>
            待辦與警示 ({data.todos.length})
          </Typography>
          {data.todos.length > 0 ? (
            <List dense disablePadding>
              {data.todos.map((todo, idx) => (
                <ListItem key={idx} sx={{ bgcolor: todo.type === 'warning' ? '#fff3e0' : '#ffebee', borderRadius: 1, mb: 1 }}>
                  <Box sx={{ mr: 1, mt: 0.5 }}>
                      {todo.type === 'warning' ? <WarningAmberIcon color="warning" fontSize="small" /> : <ErrorOutlineIcon color="error" fontSize="small" />}
                  </Box>
                  <ListItemText primary={todo.title} secondary={todo.message} />
                </ListItem>
              ))}
            </List>
          ) : (
            <Typography variant="caption" align="center" display="block" sx={{ py: 2, color: 'text.secondary' }}>無待辦事項</Typography>
          )}
        </Box>
      </Popover>
    </Box>
  );
}