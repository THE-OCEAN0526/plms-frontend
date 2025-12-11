import { useState, ChangeEvent, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

// MUI 組件
import {
  Box,
  Container,
  Grid,
  Paper,
  Typography,
  TextField,
  Button,
  Stepper,
  Step,
  StepLabel,
  MenuItem,
  Divider,
  Alert,
  CircularProgress
} from '@mui/material';


// 圖標
import SaveIcon from '@mui/icons-material/Save';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';

const UNITS = ['台', '部', '個', '支', '條', '張', '本', '卷', '包', '箱', '桶', '組', '套', '架', '件', '輛', '批', '式', '座', '塊', '盞', '扇', '門'];
const CATEGORIES = ['非消耗品', '消耗品'];

export default function AssetCreate() {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    batch_no: '',
    asset_name: '',
    brand: '',
    model: '',
    spec: '',
    fund_source: '',
    category: '非消耗品',
    
    qty_purchased: 1,
    unit: '台',
    unit_price: 0,
    
    // ★ 新增缺少的欄位初始值
    purchase_date: new Date().toISOString().split('T')[0], // 預設今天
    life_years: 5,       // 預設 5 年
    accounting_items: 1, // 預設 1 (假設是某種代碼)

    pre_property_no: '', 
    suf_start: '', 
    suf_end: ''    
  });

  const steps = ['識別與規格', '採購資訊', '預覽並確認'];

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  useEffect(() => {
    const start = parseInt(formData.suf_start);
    const end = parseInt(formData.suf_end);
    if (!isNaN(start) && !isNaN(end) && end >= start) {
      setFormData(prev => ({ ...prev, qty_purchased: end - start + 1 }));
    }
  }, [formData.suf_start, formData.suf_end]);

  const handleNext = () => {
    setError(null);
    
    // Step 1 驗證
    if (activeStep === 0) {
      if (!formData.pre_property_no || !formData.suf_start || !formData.suf_end) {
        setError('請填寫完整的「財產編號」資訊 (前綴、起始號、結束號)');
        return;
      }
      if (Number(formData.suf_start) > Number(formData.suf_end)) {
        setError('結束號不能小於起始號');
        return;
      }
      if (!formData.asset_name) {
        setError('請填寫「財產名稱」');
        return;
      }
    }

    // Step 2 驗證 (加入新欄位檢查)
    if (activeStep === 1) {
      if (!formData.batch_no) {
        setError('請填寫「增加單號」');
        return;
      }
      if (!formData.purchase_date) {
        setError('請選擇「驗收日期」');
        return;
      }
      if (!formData.life_years || Number(formData.life_years) <= 0) {
        setError('請填寫正確的「使用年限」');
        return;
      }
      if (!formData.accounting_items) {
        setError('請填寫「會計項目」');
        return;
      }
      
      const qty = Number(formData.qty_purchased);
      const start = Number(formData.suf_start);
      const end = Number(formData.suf_end);
      const rangeCount = end - start + 1;

      if (qty <= 0) {
        setError('數量必須大於 0');
        return;
      }
      if (rangeCount !== qty) {
        setError(`數量不符：編號範圍 (${start}-${end}) 共 ${rangeCount} 筆，但採購數量為 ${qty}。請檢查 Step 1 設定。`);
        return;
      }
    }

    setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
    setError(null);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('plms_token');
      
      const payload = {
        ...formData,
        suf_property_no: `${formData.suf_start}-${formData.suf_end}`,
        qty_purchased: Number(formData.qty_purchased),
        unit_price: Number(formData.unit_price),
        // 確保數值型別正確傳送
        life_years: Number(formData.life_years),
        accounting_items: Number(formData.accounting_items)
      };

      await axios.post('http://192.168.10.1/api/asset/batch_create.php', payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert('🎉 資產入庫成功！');
      navigate('/inventory');

    } catch (err: any) {
      console.error(err);
      const msg = err.response?.data?.message || '系統發生錯誤，請稍後再試';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // --- 畫面渲染 ---

  const renderStep1 = () => (
    <Grid container spacing={3}>
      <Grid size={{ xs: 12 }}>
        <Alert severity="info" icon={<AutoFixHighIcon />} sx={{ mb: 1 }}>
          設定編號範圍後，系統會自動在下一步計算數量。
        </Alert>
      </Grid>

      {/* 財產編號 */}
      <Grid size={{ xs: 12 }}>
        <Typography variant="h6" gutterBottom color="primary">財產編號設定</Typography>
      </Grid>
      
      <Grid size={{ xs: 12, sm: 4 }}>
        <TextField 
          fullWidth required 
          label="財產編號前綴" 
          name="pre_property_no" 
          value={formData.pre_property_no} 
          onChange={handleChange} 
          placeholder="例: 3013208-63"
        />
      </Grid>
      
      <Grid size={{ xs: 12, sm: 8 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <TextField 
            label="起始號 (Sub No)" name="suf_start" type="number"
            value={formData.suf_start} onChange={handleChange} 
            sx={{ flex: 1 }} required
          />
          <Typography variant="h5" color="textSecondary">-</Typography>
          <TextField 
            label="結束號" name="suf_end" type="number"
            value={formData.suf_end} onChange={handleChange} 
            sx={{ flex: 1 }} required
          />
        </Box>
      </Grid>

      <Grid size={{ xs: 12 }}><Divider /></Grid>

      {/* 規格細節 */}
      <Grid size={{ xs: 12 }}>
        <Typography variant="h6" gutterBottom color="primary">資產規格</Typography>
      </Grid>

      <Grid size={{ xs: 12, sm: 8 }}>
        <TextField fullWidth required label="財產名稱" name="asset_name" value={formData.asset_name} onChange={handleChange} placeholder="例: ASUS 電腦" />
      </Grid>
      <Grid size={{ xs: 12, sm: 4 }}>
        <TextField fullWidth select label="資產類別" name="category" value={formData.category} onChange={handleChange}>
          {CATEGORIES.map((option) => (
            <MenuItem key={option} value={option}>{option}</MenuItem>
          ))}
        </TextField>
      </Grid>

      <Grid size={{ xs: 12, sm: 4 }}>
        <TextField fullWidth label="廠牌" name="brand" value={formData.brand} onChange={handleChange} />
      </Grid>
      <Grid size={{ xs: 12, sm: 4 }}>
        <TextField fullWidth label="型號" name="model" value={formData.model} onChange={handleChange} />
      </Grid>
      <Grid size={{ xs: 12, sm: 4 }}>
        <TextField fullWidth label="規格描述" name="spec" value={formData.spec} onChange={handleChange} />
      </Grid>
    </Grid>
  );

  const renderStep2 = () => (
    <Grid container spacing={3}>
      {/* 採購資訊 */}
      <Grid size={{ xs: 12 }}>
        <Typography variant="h6" gutterBottom color="primary">採購與單號</Typography>
      </Grid>

      <Grid size={{ xs: 12, sm: 6 }}>
        <TextField 
          fullWidth required 
          label="增加單號" 
          name="batch_no" 
          value={formData.batch_no} 
          onChange={handleChange} 
          placeholder="例: PO-20250101" 
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 6 }}>
        <TextField fullWidth label="經費來源" name="fund_source" value={formData.fund_source} onChange={handleChange} />
      </Grid>

      {/* ★ 新增欄位：日期、年限、會計 */}
      <Grid size={{ xs: 12, sm: 4 }}>
        <TextField 
          fullWidth required 
          type="date" 
          label="驗收日期" 
          name="purchase_date" 
          value={formData.purchase_date} 
          onChange={handleChange}
          slotProps={{ inputLabel: { shrink: true } }} // 讓 Label 浮起來
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 4 }}>
        <TextField 
          fullWidth required 
          type="number" 
          label="使用年限 (年)" 
          name="life_years" 
          value={formData.life_years} 
          onChange={handleChange} 
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 4 }}>
        <TextField 
          fullWidth required 
          type="number" 
          label="會計項目" 
          name="accounting_items" 
          value={formData.accounting_items} 
          onChange={handleChange} 
        />
      </Grid>

      <Grid size={{ xs: 12 }}><Divider /></Grid>

      <Grid size={{ xs: 12 }}>
        <Typography variant="h6" gutterBottom color="primary">數量與金額</Typography>
      </Grid>

      {/* 數量與金額 */}
      <Grid size={{ xs: 12, sm: 4 }}>
        <TextField 
          fullWidth required type="number" label="採購數量" 
          name="qty_purchased" value={formData.qty_purchased} onChange={handleChange} 
          helperText="已根據編號範圍自動計算"
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 4 }}>
        <TextField fullWidth select label="單位" name="unit" value={formData.unit} onChange={handleChange}>
          {UNITS.map((u) => <MenuItem key={u} value={u}>{u}</MenuItem>)}
        </TextField>
      </Grid>
      <Grid size={{ xs: 12, sm: 4 }}>
        <TextField 
          fullWidth type="number" label="單價" 
          name="unit_price" value={formData.unit_price} onChange={handleChange} 
          slotProps={{ input: { startAdornment: <Typography sx={{ mr: 1 }}>$</Typography> } }}
        />
      </Grid>

      <Grid size={{ xs: 12 }}>
        <Box sx={{ bgcolor: '#fff3e0', p: 2, borderRadius: 2, textAlign: 'right', border: '1px solid #ffe0b2' }}>
          <Typography variant="h6" color="warning.dark">
            預估總價: <strong>${(Number(formData.qty_purchased) * Number(formData.unit_price)).toLocaleString()}</strong>
          </Typography>
        </Box>
      </Grid>
    </Grid>
  );

  const renderStep3 = () => (
    <Box>
      <Alert severity="success" icon={<CheckCircleIcon fontSize="inherit" />} sx={{ mb: 3 }}>
        資料填寫完成！請再次確認以下資訊，按下「確認入庫」後將寫入資料庫。
      </Alert>
      
      <Paper variant="outlined" sx={{ p: 3 }}>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12 }}><Typography variant="h6" color="primary">識別資訊</Typography></Grid>
          <Grid size={{ xs: 4 }}><Typography color="textSecondary">財產編號範圍</Typography></Grid>
          <Grid size={{ xs: 8 }}>
            <Typography fontFamily="monospace" fontWeight="bold">
              {formData.pre_property_no} <span style={{ color: '#aaa' }}>/</span> {formData.suf_start} - {formData.suf_end}
            </Typography>
          </Grid>
          
          <Grid size={{ xs: 4 }}><Typography color="textSecondary">財產名稱</Typography></Grid>
          <Grid size={{ xs: 8 }}>
            <Typography fontWeight="bold">{formData.asset_name}</Typography>
            <Typography variant="caption" color="textSecondary">{formData.category}</Typography>
          </Grid>

          <Grid size={{ xs: 12 }}><Divider sx={{ my: 1 }} /></Grid>

          <Grid size={{ xs: 12 }}><Typography variant="h6" color="primary">規格與採購</Typography></Grid>
          <Grid size={{ xs: 4 }}><Typography color="textSecondary">增加單號</Typography></Grid>
          <Grid size={{ xs: 8 }}><Typography>{formData.batch_no}</Typography></Grid>

          <Grid size={{ xs: 4 }}><Typography color="textSecondary">其他資訊</Typography></Grid>
          <Grid size={{ xs: 8 }}>
            <Typography variant="body2">驗收日: {formData.purchase_date}</Typography>
            <Typography variant="body2">年限: {formData.life_years} 年 / 會計項目: {formData.accounting_items}</Typography>
            <Typography variant="body2">來源: {formData.fund_source || '無'}</Typography>
          </Grid>

          <Grid size={{ xs: 4 }}><Typography color="textSecondary">數量 / 單位</Typography></Grid>
          <Grid size={{ xs: 8 }}><Typography fontWeight="bold">{formData.qty_purchased} {formData.unit}</Typography></Grid>

          <Grid size={{ xs: 4 }}><Typography color="textSecondary">總金額</Typography></Grid>
          <Grid size={{ xs: 8 }}><Typography fontWeight="bold" color="error">${(Number(formData.qty_purchased) * Number(formData.unit_price)).toLocaleString()}</Typography></Grid>
        </Grid>
      </Paper>
    </Box>
  );

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
        <Typography variant="h4" gutterBottom fontWeight="bold" align="center">
          📦 資產批次入庫
        </Typography>

        <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ minHeight: '300px' }}>
          {activeStep === 0 && renderStep1()}
          {activeStep === 1 && renderStep2()}
          {activeStep === 2 && renderStep3()}
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 4, gap: 2 }}>
          {activeStep > 0 && (
            <Button onClick={handleBack} startIcon={<NavigateBeforeIcon />}>
              上一步
            </Button>
          )}
          
          {activeStep < steps.length - 1 ? (
            <Button variant="contained" onClick={handleNext} endIcon={<NavigateNextIcon />}>
              下一步
            </Button>
          ) : (
            <Button 
              variant="contained" 
              color="success" 
              onClick={handleSubmit} 
              startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
              disabled={loading}
            >
              {loading ? '處理中...' : '確認入庫'}
            </Button>
          )}
        </Box>
      </Paper>
    </Container>
  );
}