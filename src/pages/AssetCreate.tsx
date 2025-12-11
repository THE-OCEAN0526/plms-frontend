import { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

// MUI 組件
import {
  Box,
  Grid,
  Paper,
  Typography,
  TextField,
  Button,
  MenuItem,
  InputAdornment,
  Alert,
  Stack,
  CircularProgress,
  useTheme,
  Divider,
  FormControl,
  InputLabel,
  Select,
  SelectChangeEvent
} from '@mui/material';

// Icons
import SaveIcon from '@mui/icons-material/Save';
import DeleteIcon from '@mui/icons-material/Delete';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import CategoryIcon from '@mui/icons-material/Category';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';

// 選項常數
const UNITS = ['台', '部', '個', '支', '條', '張', '本', '卷', '包', '箱', '桶', '組', '套', '架', '件', '輛', '批', '式', '座', '塊', '盞', '扇', '門'];
const CATEGORIES = ['非消耗品', '消耗品'];

// 地點介面
interface Location {
  id: number;
  code: string;
  name: string;
}

// 初始表單狀態
const INITIAL_FORM = {
  // 1. 時間與編號
  add_date: new Date().toISOString().split('T')[0],
  purchase_date: new Date().toISOString().split('T')[0],
  life_years: 5,
  pre_property_no: '',
  suf_start: '',
  suf_end: '',
  
  // 2. 規格與屬性
  asset_name: '',
  category: '非消耗品',
  brand: '',
  model: '',
  spec: '',
  
  // 3. 採購資訊
  batch_no: '',
  fund_source: '',
  accounting_items: '',
  
  // 4. 成本與位置
  unit: '台',
  unit_price: '',
  location: '',
};

export default function AssetCreate() {
  const navigate = useNavigate();
  const theme = useTheme();
  
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [calculated, setCalculated] = useState({ qty: 0, total: 0 });

  // 1. 載入地點資料 (模擬 API)
  useEffect(() => {
    const fetchLocations = async () => {
      try {
        // ★ 之後換成真實 API:
        // const response = await axios.get('http://192.168.10.1/api/locations');
        // setLocations(response.data);

        // 模擬數據
        const mockLocations = [
          { id: 1, code: 'STORE', name: '總務處倉庫' },
          { id: 2, code: 'I305', name: '多媒體教室 I305' },
          { id: 3, code: 'LAB1', name: '電腦教室一' },
        ];
        setLocations(mockLocations);

      } catch (err) {
        console.error('無法讀取地點列表', err);
      }
    };
    fetchLocations();
  }, []);

  // 2. 自動計算
  useEffect(() => {
    const start = parseInt(formData.suf_start) || 0;
    const end = parseInt(formData.suf_end) || 0;
    const price = parseFloat(formData.unit_price) || 0;
    const qty = (end >= start && formData.suf_start !== '' && formData.suf_end !== '') ? (end - start + 1) : 0;
    const total = qty * price;
    setCalculated({ qty, total });
  }, [formData.suf_start, formData.suf_end, formData.unit_price]);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (e: SelectChangeEvent) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.batch_no || !formData.asset_name || !formData.pre_property_no || !formData.location || calculated.qty <= 0) {
      setError('請檢查必填欄位 (標示為 *)，並確保已選擇保管位置且數量大於 0。');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('plms_token');
      const payload = {
        ...formData,
        suf_start_no: parseInt(formData.suf_start),
        suf_end_no: parseInt(formData.suf_end),
        unit_price: parseFloat(formData.unit_price),
        qty_purchased: calculated.qty,
        accounting_items: parseInt(formData.accounting_items) || 0,
        life_years: parseInt(formData.life_years.toString()),
        location: parseInt(formData.location)
      };

      await axios.post('http://192.168.10.1/api/assets', payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert(`🎉 成功入庫 ${calculated.qty} 筆資產！`);
      navigate('/inventory');

    } catch (err: any) {
      const msg = err.response?.data?.message || '系統發生錯誤';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    if (window.confirm('確定要清空嗎？')) {
      setFormData(INITIAL_FORM);
      setError(null);
    }
  };

  const SectionTitle = ({ icon, text }: { icon: any, text: string }) => (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, color: 'primary.main', opacity: 0.9 }}>
      {icon}
      <Typography variant="subtitle1" fontWeight="bold">{text}</Typography>
      <Divider sx={{ flexGrow: 1, ml: 1, opacity: 0.6 }} />
    </Box>
  );

  return (
    <Box sx={{ 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column', 
      overflow: 'hidden', 
      gap: 2 
    }}>
      {/* 頂部標題 */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
        <Box>
            <Typography variant="h5" fontWeight="800" color="text.primary">
            資產入庫
            </Typography>
            <Typography variant="body2" color="text.secondary">
            建立新的資產批次與流水號
            </Typography>
        </Box>
      </Box>

      {/* 主內容區 */}
      <Box sx={{ 
        flexGrow: 1, 
        minHeight: 0, 
        display: 'flex', 
        gap: 2,
        flexDirection: { xs: 'column', md: 'row' } 
      }}>
        
        {/* === 左側：表單輸入區 === */}
        <Paper sx={{ 
          flex: 1, 
          p: 3, 
          borderRadius: 3, 
          overflowY: 'auto', 
          bgcolor: 'background.paper', // ★ 確保使用主題色
          border: '1px solid', borderColor: 'divider',
          boxShadow: 'none'
        }}>
          <form id="create-form" onSubmit={handleSubmit}>
            
            {/* 1. 編號與時程 */}
            <SectionTitle icon={<CalendarMonthIcon />} text="1. 編號與時程" />
            <Grid container spacing={2} sx={{ mb: 4 }}>
                <Grid size={{ xs: 12, md: 4 }}>
                    <TextField fullWidth required size="small" label="財產編號前綴" name="pre_property_no" value={formData.pre_property_no} onChange={handleChange} placeholder="301001-112" slotProps={{ inputLabel: { shrink: true } }} />
                </Grid>
                <Grid size={{ xs: 6, md: 2 }}>
                    <TextField fullWidth required size="small" type="number" label="起始號" name="suf_start" value={formData.suf_start} onChange={handleChange} slotProps={{ inputLabel: { shrink: true } }} />
                </Grid>
                <Grid size={{ xs: 6, md: 2 }}>
                    <TextField fullWidth required size="small" type="number" label="結束號" name="suf_end" value={formData.suf_end} onChange={handleChange} slotProps={{ inputLabel: { shrink: true } }} />
                </Grid>
                <Grid size={{ xs: 6, md: 2 }}>
                    <TextField fullWidth size="small" type="date" label="新增日期" name="add_date" value={formData.add_date} onChange={handleChange} slotProps={{ inputLabel: { shrink: true } }} helperText="系統建檔日" />
                </Grid>
                <Grid size={{ xs: 6, md: 2 }}>
                    <TextField fullWidth required size="small" type="number" label="使用年限 (年)" name="life_years" value={formData.life_years} onChange={handleChange} slotProps={{ inputLabel: { shrink: true } }} />
                </Grid>
            </Grid>

            {/* 2. 資產規格 */}
            <SectionTitle icon={<CategoryIcon />} text="2. 資產規格" />
            <Grid container spacing={2} sx={{ mb: 4 }}>
                <Grid size={{ xs: 12, md: 6 }}>
                    <TextField fullWidth required size="small" label="財產名稱" name="asset_name" value={formData.asset_name} onChange={handleChange} placeholder="例: ASUS 筆記型電腦" slotProps={{ inputLabel: { shrink: true } }} />
                </Grid>
                <Grid size={{ xs: 6, md: 3 }}>
                    <TextField select fullWidth required size="small" label="資產類別" name="category" value={formData.category} onChange={handleChange}>
                        {CATEGORIES.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                    </TextField>
                </Grid>
                <Grid size={{ xs: 6, md: 3 }}>
                    <TextField select fullWidth required size="small" label="單位" name="unit" value={formData.unit} onChange={handleChange}>
                        {UNITS.map(u => <MenuItem key={u} value={u}>{u}</MenuItem>)}
                    </TextField>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                    <TextField fullWidth size="small" label="廠牌" name="brand" value={formData.brand} onChange={handleChange} slotProps={{ inputLabel: { shrink: true } }} />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                    <TextField fullWidth size="small" label="型號" name="model" value={formData.model} onChange={handleChange} slotProps={{ inputLabel: { shrink: true } }} />
                </Grid>
                <Grid size={{ xs: 12, md: 12 }}>
                    <TextField 
                      fullWidth multiline rows={3} size="small" 
                      label="規格描述" name="spec" value={formData.spec} onChange={handleChange} 
                      placeholder="例如：CPU i7 / 16G RAM / 512G SSD (可換行輸入)"
                      slotProps={{ inputLabel: { shrink: true } }} 
                    />
                </Grid>
            </Grid>

            {/* 3. 採購資訊與位置 */}
            <SectionTitle icon={<ReceiptLongIcon />} text="3. 採購與位置" />
            <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 4 }}>
                    <TextField fullWidth required size="small" label="增加單號" name="batch_no" value={formData.batch_no} onChange={handleChange} placeholder="PO-20250101" slotProps={{ inputLabel: { shrink: true } }} />
                </Grid>
                <Grid size={{ xs: 12, md: 3 }}>
                    <TextField fullWidth required size="small" type="date" label="驗收日期" name="purchase_date" value={formData.purchase_date} onChange={handleChange} slotProps={{ inputLabel: { shrink: true } }} helperText="發票/驗收日" />
                </Grid>
                <Grid size={{ xs: 6, md: 2 }}>
                    <TextField fullWidth size="small" label="經費來源" name="fund_source" value={formData.fund_source} onChange={handleChange} slotProps={{ inputLabel: { shrink: true } }} />
                </Grid>
                <Grid size={{ xs: 6, md: 3 }}>
                    <TextField fullWidth required size="small" type="number" label="單價" name="unit_price" value={formData.unit_price} onChange={handleChange} slotProps={{ inputLabel: { shrink: true }, input: { startAdornment: <InputAdornment position="start">$</InputAdornment> } }} />
                </Grid>
                
                {/* 保管位置 */}
                <Grid size={{ xs: 12, md: 12 }}>
                    <FormControl fullWidth required size="small">
                      <InputLabel id="location-label" shrink>預設保管位置</InputLabel>
                      <Select
                        labelId="location-label"
                        label="預設保管位置"
                        name="location"
                        value={formData.location}
                        onChange={handleSelectChange}
                        displayEmpty
                        notched
                      >
                        <MenuItem value="" disabled>
                          <Typography color="text.secondary">請選擇地點...</Typography>
                        </MenuItem>
                        {locations.length > 0 ? (
                          locations.map((loc) => (
                            <MenuItem key={loc.id} value={loc.id}>
                              {loc.code} - {loc.name}
                            </MenuItem>
                          ))
                        ) : (
                          <MenuItem disabled>載入中...</MenuItem>
                        )}
                      </Select>
                    </FormControl>
                </Grid>
            </Grid>

          </form>
        </Paper>

        {/* === 右側：摘要與操作區 === */}
        <Paper sx={{ 
          width: { xs: '100%', md: 360 }, 
          p: 3, 
          borderRadius: 3, 
          display: 'flex', 
          flexDirection: 'column',
          bgcolor: 'background.default', // ★ 使用主題背景色
          border: '1px solid', borderColor: 'divider',
          boxShadow: 'none'
        }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom color="text.secondary">
                入庫預覽
            </Typography>
            
            <Box sx={{ flexGrow: 1 }}>
                {error && (
                    <Alert severity="error" sx={{ mb: 2, fontSize: '0.875rem' }}>{error}</Alert>
                )}

                {/* ★ 修正這行的寫法：bgcolor: 'background.paper' */}
                <Stack spacing={2} sx={{ mt: 2, p: 2, bgcolor: 'background.paper', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography color="text.secondary">入庫數量</Typography>
                        <Typography fontWeight="bold" fontSize="1.1rem" color="text.primary">{calculated.qty} {formData.unit}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography color="text.secondary">編號範圍</Typography>
                        <Typography fontWeight="bold" fontFamily="monospace" color="text.primary">
                            {formData.suf_start || '---'} ~ {formData.suf_end || '---'}
                        </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography color="text.secondary">使用年限</Typography>
                        <Typography fontWeight="bold" color="text.primary">{formData.life_years} 年</Typography>
                    </Box>
                    <Divider sx={{ borderStyle: 'dashed' }} />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="h6" fontWeight="bold" color="primary">總金額</Typography>
                        <Typography variant="h4" fontWeight="800" color="primary">
                            ${calculated.total.toLocaleString()}
                        </Typography>
                    </Box>
                </Stack>
            </Box>

            <Stack spacing={2} sx={{ mt: 4 }}>
                <Button 
                    type="submit" 
                    form="create-form" 
                    variant="contained" 
                    size="large" 
                    disabled={loading || calculated.qty <= 0}
                    startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                    sx={{ py: 1.5, fontSize: '1.1rem', fontWeight: 'bold', borderRadius: 2, boxShadow: 'none' }}
                >
                    {loading ? '處理中...' : '確認入庫'}
                </Button>
                
                <Button 
                    variant="text" 
                    color="error" 
                    startIcon={<DeleteIcon />} 
                    onClick={handleReset}
                >
                    清空欄位
                </Button>
            </Stack>
        </Paper>

      </Box>
    </Box>
  );
}