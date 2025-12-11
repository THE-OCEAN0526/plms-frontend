import { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

// MUI 組件
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  IconButton,
  Badge,
  Popover,
  Chip,
  Skeleton, 
  Divider
} from '@mui/material';

// MUI 圖標
import NotificationsIcon from '@mui/icons-material/Notifications';
import HistoryIcon from '@mui/icons-material/History';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import BuildIcon from '@mui/icons-material/Build';
import ComputerIcon from '@mui/icons-material/Computer';

// 資料介面
interface DashboardData {
  user_info: { name: string; role: string; };
  cards: {
    total_value: number;
    count_total: number;
    count_in_use: number;
    count_maintenance: number;
    count_scrapped: number;
  };
  recent: Array<{
    action_type: string;
    action_date: string;
    expected_return_date: string | null;
    note: string;
    asset_name: string;
    sub_no: number;
    new_status: string;
  }>;
  todos: Array<{ 
      type: 'warning' | 'info' | 'error';
      message: string; 
    }>;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const token = localStorage.getItem('plms_token');
        const response = await axios.get<DashboardData>(
          'http://192.168.10.1/api/dashboard/summary.php',
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setData(response.data);
        console.log('Dashboard data:', response.data);
      } catch (error) {
        console.error('Error:', error);
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

  // 載入中骨架屏 (使用 v7 Grid 語法)
  if (loading || !data) {
    return (
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 4 }}>
           <Skeleton variant="text" width={200} height={60} />
           <Skeleton variant="circular" width={40} height={40} />
        </Box>

        <Grid container spacing={3} sx={{ mb: 4 }}>
          {[1, 2, 3, 4].map((i) => (
            // ★ v7 Grid: 使用 size 屬性，不需要 item
            <Grid size={{ xs: 12, sm: 6, md: 3 }} key={i}>
              <Skeleton variant="rectangular" height={140} sx={{ borderRadius: 2 }} />
            </Grid>
          ))}
        </Grid>

        <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 2 }} />
      </Box>
    );
  }

  // 定義卡片樣式元件
  const StatCard = ({ title, value, sub, color }: any) => (
    <Card sx={{ height: '100%', borderRadius: 2, boxShadow: '0 2px 10px rgba(0,0,0,0.05)', position: 'relative', overflow: 'visible' }}>
      <Box sx={{ 
        position: 'absolute', left: 0, top: 0, bottom: 0, width: 6, 
        bgcolor: color, borderTopLeftRadius: 8, borderBottomLeftRadius: 8 
      }} />
      <CardContent sx={{ pl: 3 }}>
        <Typography variant="subtitle1" color="text.secondary" fontWeight="bold">
          {title}
        </Typography>
        <Typography variant="h3" fontWeight="bold" sx={{ color: color, my: 1 }}>
          {value}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {sub}
        </Typography>
      </CardContent>
    </Card>
  );

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" fontWeight="bold" color="#333">
          主控制台
        </Typography>
        
        <IconButton onClick={handleNotiClick} size="large">
          <Badge badgeContent={data.todos.length} color="error">
            <NotificationsIcon fontSize="large" color="action" />
          </Badge>
        </IconButton>

        {/* 通知的彈出視窗 (Popover) */}
        <Popover
          open={notiOpen}
          anchorEl={anchorEl}
          onClose={handleNotiClose}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          <Box sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ mb: 1, borderBottom: '1px solid #eee', pb: 1, fontWeight: 'bold' }}>
              待辦事項與警示
            </Typography>
            
            {data.todos.length > 0 ? (
              <List dense disablePadding>
                {data.todos.map((todo, idx) => {
                  // 根據類型決定顏色與圖示
                  let bgColor = '#e3f2fd'; // info (blue)
                  let icon = <InfoOutlinedIcon color="info" />;
                  
                  if (todo.type === 'warning') {
                    bgColor = '#fff3e0'; // warning (orange)
                    icon = <WarningAmberIcon color="warning" />;
                  } else if (todo.type === 'error') {
                    bgColor = '#ffebee'; // error (red)
                    icon = <ErrorOutlineIcon color="error" />;
                  }

                  return (
                    <ListItem 
                      key={idx} 
                      sx={{ 
                        bgcolor: bgColor, 
                        borderRadius: 1, 
                        mb: 1, 
                        alignItems: 'flex-start' 
                      }}
                    >
                      <Box sx={{ mt: 0.5, mr: 1.5, display: 'flex' }}>
                        {icon}
                      </Box>
                      <ListItemText 
                        primary={todo.message} 
                        primaryTypographyProps={{ variant: 'body2', style: { wordBreak: 'break-word' } }}
                      />
                    </ListItem>
                  );
                })}
              </List>
            ) : (
              <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
                <CheckCircleOutlineIcon color="success" sx={{ fontSize: 48, mb: 1, opacity: 0.5 }} />
                <Typography>太棒了！目前沒有待辦事項</Typography>
              </Box>
            )}
          </Box>
        </Popover>
      </Box>

      {/* 數據卡片區 - 使用 MUI v7 Grid */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/*  v7 Grid: 使用 size={{ ... }} 設定寬度 */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard 
            title={data.user_info.role === 'admin' ? '系上資產總數' : "我的保管總數"} 
            value={data.cards.count_total} 
            sub={`總資產價值: $${Number(data.cards.total_value).toLocaleString()}`} 
            color="#42a5f5" 
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard 
            title="使用中" 
            value={data.cards.count_in_use} 
            sub="正常使用" 
            color="#66bb6a" 
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard 
            title="維修中" 
            value={data.cards.count_maintenance} 
            sub="請留意維修進度" 
            color="#ffa726" 
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard 
            title="已報廢" 
            value={data.cards.count_scrapped} 
            sub="已註銷之資產" 
            color="#ef5350" 
          />
        </Grid>
      </Grid>

      {/* 近期動態區 */}
      <Paper sx={{ p: 3, borderRadius: 2, boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <HistoryIcon sx={{ mr: 1, color: '#555' }} />
          <Typography variant="h6" fontWeight="bold">近期資產動態</Typography>
        </Box>
        <Divider sx={{ mb: 2 }} />
        
        {data.recent.length > 0 ? (
          <List>
            {data.recent.map((item, index) => (
              <div key={index}>
                <ListItem sx={{ px: 0 }}>
                  <ListItemAvatar>
                    <Avatar sx={{ 
                      bgcolor: item.new_status === '維護' ? '#fff4e5' : '#e3f2fd',
                      color: item.new_status === '維護' ? '#ed6c02' : '#1976d2'
                    }}>
                      {item.new_status === '維護' ? <BuildIcon /> : <ComputerIcon />}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box component="span" sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                        <Typography component="span" variant="subtitle1" fontWeight="bold">
                          {item.asset_name}
                        </Typography>
                        <Chip 
                          label={item.new_status} 
                          size="small" 
                          color={item.new_status === '維護' ? 'warning' : 'success'} 
                          variant={item.new_status === '維護' ? 'filled' : 'outlined'}
                        />
                      </Box>
                    }
                    secondary={
                      <Box component="span" sx={{ display: 'block', mt: 0.5 }}>
                        <Typography component="span" variant="body2" color="text.primary">
                          {item.action_type}
                        </Typography>
                        {" — " + item.note}
                        <br />
                        
                        {/* 顯示預計歸還日 */}
                        {item.expected_return_date && (
                          <Typography component="span" variant="caption" color="error" sx={{ mr: 2, fontWeight: 'bold' }}>
                            預計歸還: {item.expected_return_date}
                          </Typography>
                        )}

                        <Typography component="span" variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'inline-block' }}>
                          {item.action_date}
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>
                {index < data.recent.length - 1 && <Divider component="li" />}
              </div>
            ))}
          </List>
        ) : (
          <Typography color="text.secondary" align="center" sx={{ py: 3 }}>
            目前沒有動態紀錄
          </Typography>
        )}
      </Paper>
    </Box>
  );
}