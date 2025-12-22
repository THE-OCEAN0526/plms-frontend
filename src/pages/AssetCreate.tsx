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
  Divider,
  FormControl,
  InputLabel,
  Select,
  SelectChangeEvent,
} from '@mui/material';

// Icons
import SaveIcon from '@mui/icons-material/Save';
import DeleteIcon from '@mui/icons-material/Delete';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import CategoryIcon from '@mui/icons-material/Category';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import InfoIcon from '@mui/icons-material/Info';

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
  
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [calculated, setCalculated] = useState({ qty: 0, total: 0 });

  // 1. 載入地點資料
  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const token = localStorage.getItem('pms_token');
        const response = await axios.get('http://192.168.10.1/api/locations', { headers: { Authorization: `Bearer ${token}` } });
        // 確保取到陣列
        const locationList = Array.isArray(response.data) ? response.data : response.data.data;
        setLocations(locationList || []);
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
      const token = localStorage.getItem('pms_token');
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

      alert(`成功入庫 ${calculated.qty} 筆資產！`);
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

  // 輔助函式：取得地點名稱
  const getLocationName = (id: string | number) => {
    const loc = locations.find(l => l.id === Number(id));
    return loc ? `${loc.code} - ${loc.name}` : '(未選擇)';
  };

  // 標題組件
  const SectionTitle = ({ icon, text }: { icon: any, text: string }) => (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, color: 'primary.main', opacity: 0.9 }}>
      {icon}
      <Typography variant="subtitle1" fontWeight="bold">{text}</Typography>
      <Divider sx={{ flexGrow: 1, ml: 1, opacity: 0.6 }} />
    </Box>
  );

  // 預覽列組件
  const PreviewRow = ({ label, value }: { label: string, value: React.ReactNode }) => (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
      <Typography variant="body2" color="text.secondary" sx={{ minWidth: 70 }}>{label}</Typography>
      <Typography variant="body2" fontWeight={500} align="right" sx={{ color: 'text.primary', wordBreak: 'break-word' }}>
        {value || '-'}
      </Typography>
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
          bgcolor: 'background.paper', 
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
                    <TextField fullWidth size="small" label="增加單號" name="batch_no" value={formData.batch_no} onChange={handleChange} placeholder="09411016" slotProps={{ inputLabel: { shrink: true } }} />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                    <TextField fullWidth required size="small" type="date" label="驗收日期" name="purchase_date" value={formData.purchase_date} onChange={handleChange} slotProps={{ inputLabel: { shrink: true } }} helperText="發票/驗收日" />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                    <TextField fullWidth required size="small" type="number" label="單價" name="unit_price" value={formData.unit_price} onChange={handleChange} slotProps={{ inputLabel: { shrink: true }, input: { startAdornment: <InputAdornment position="start">$</InputAdornment> } }} />
                </Grid>

                <Grid size={{ xs: 12, md: 8 }}>
                    <TextField fullWidth size="small" label="經費來源" name="fund_source" value={formData.fund_source} onChange={handleChange} slotProps={{ inputLabel: { shrink: true } }} placeholder="例：高教深耕計畫 (資本門)" />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                    <TextField fullWidth size="small"  label="會計項目" name="accounting_items" placeholder="134101" value={formData.accounting_items} onChange={handleChange} slotProps={{ inputLabel: { shrink: true } }} />
                </Grid>
                
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

        {/* === 右側：完整預覽區 === */}
        <Paper sx={{ 
          width: { xs: '100%', md: 360 }, 
          p: 0, // 移除 padding 讓內容貼邊
          borderRadius: 3, 
          display: 'flex', 
          flexDirection: 'column',
          bgcolor: 'background.default', 
          border: '1px solid', borderColor: 'divider',
          boxShadow: 'none',
          overflow: 'hidden' // 防止內部內容溢出圓角
        }}>
            {/* 標題區 */}
            <Box sx={{ p: 2, bgcolor: 'background.paper', borderBottom: 1, borderColor: 'divider' }}>
                <Typography variant="h6" fontWeight="bold" color="text.primary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <InfoIcon fontSize="small" color="primary"/> 入庫預覽
                </Typography>
            </Box>
            
            {/* 可捲動的詳情內容 */}
            <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 3 }}>
                {error && (
                    <Alert severity="error" sx={{ mb: 2, fontSize: '0.875rem' }}>{error}</Alert>
                )}

                {/* 1. 核心摘要 (總量與金額) */}
                <Paper variant="outlined" sx={{ p: 2, mb: 3, bgcolor: 'action.hover', borderColor: 'primary.main', borderWidth: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2" color="text.secondary">總數量</Typography>
                        <Typography fontWeight="bold" color="primary.main">{calculated.qty} {formData.unit}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="subtitle1" fontWeight="bold" color="text.primary">總金額</Typography>
                        <Typography variant="h5" fontWeight="800" color="primary.main">
                            ${calculated.total.toLocaleString()}
                        </Typography>
                    </Box>
                </Paper>

                {/* 2. 詳細欄位清單 */}
                <Stack spacing={2.5}>
                    <Box>
                        <Typography variant="caption" fontWeight="bold" color="text.secondary" sx={{ display: 'block', mb: 1, letterSpacing: 1 }}>識別資訊</Typography>
                        <PreviewRow label="品名" value={formData.asset_name} />
                        <PreviewRow label="編號範圍" value={`${formData.pre_property_no} ${formData.suf_start}~${formData.suf_end}`} />
                        <PreviewRow label="類別" value={formData.category} />
                    </Box>
                    
                    <Divider />

                    <Box>
                        <Typography variant="caption" fontWeight="bold" color="text.secondary" sx={{ display: 'block', mb: 1, letterSpacing: 1 }}>規格詳情</Typography>
                        <PreviewRow label="廠牌/型號" value={`${formData.brand} / ${formData.model}`} />
                        <PreviewRow label="規格" value={formData.spec} />
                    </Box>

                    <Divider />

                    <Box>
                        <Typography variant="caption" fontWeight="bold" color="text.secondary" sx={{ display: 'block', mb: 1, letterSpacing: 1 }}>採購與管理</Typography>
                        <PreviewRow label="增加單號" value={formData.batch_no} />
                        <PreviewRow label="經費來源" value={formData.fund_source} />
                        <PreviewRow label="會計科目" value={formData.accounting_items} />
                        <PreviewRow label="驗收/建檔" value={`${formData.purchase_date} / ${formData.add_date}`} />
                        <PreviewRow label="使用年限" value={`${formData.life_years} 年`} />
                        <PreviewRow label="保管位置" value={getLocationName(formData.location)} />
                    </Box>
                </Stack>
            </Box>

            {/* 底部操作按鈕 (固定) */}
            <Box sx={{ p: 2, bgcolor: 'background.paper', borderTop: 1, borderColor: 'divider' }}>
                <Stack spacing={2}>
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
            </Box>
        </Paper>

      </Box>
    </Box>
  );
}