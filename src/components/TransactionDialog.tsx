import { useState, useEffect } from "react";
import axios from "axios";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Stack,
  Typography,
  Box,
  CircularProgress,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel
} from "@mui/material";

// 定義地點介面
interface Location {
  id: number;
  code: string;
  name: string;
}

// 定義使用者介面
interface User {
  id: number;
  name: string;
  staff_code: string;
}

const ACTION_TYPES = [
  { label: '領用', value: 'use' },     
  { label: '借用', value: 'loan' },    
  { label: '歸還', value: 'return' },  
  { label: '移轉', value: 'transfer' },
  { label: '報廢', value: 'scrap' },   
  { label: '遺失', value: 'loss' },    
  { label: '校正', value: 'correct' }, 
];

interface Props {
  open: boolean;
  onClose: () => void;
  selectedAssets: any[]; 
  onSuccess: () => void;
}

export default function TransactionDialog({ open, onClose, selectedAssets, onSuccess }: Props) {
  const [loading, setLoading] = useState(false);
  const [locations, setLocations] = useState<Location[]>([]); 
  const [users, setUsers] = useState<User[]>([]); 
  const [borrowType, setBorrowType] = useState<'member' | 'manual'>('manual');
  
  const [form, setForm] = useState({
    action_type: "use",
    location_id: "",
    borrower: "",
    borrower_id: "",
    expected_return_date: "",
    item_condition: "好",
    new_owner_id: "",
    note: ""
  });

  // 1. 載入資料 (地點與使用者)
  useEffect(() => {
    if (open) {
      const fetchData = async () => {
        try {
          const token = localStorage.getItem("plms_token");
          const headers = { Authorization: `Bearer ${token}` };
          
          const [locRes, userRes] = await Promise.all([
            axios.get('http://192.168.10.1/api/locations', { headers }),
            axios.get('http://192.168.10.1/api/users', { headers })
          ]);
          
          setLocations(Array.isArray(locRes.data) ? locRes.data : locRes.data.data || []);
          setUsers(Array.isArray(userRes.data) ? userRes.data : userRes.data.data || []);
        } catch (err) {
          console.error('無法讀取資料列表', err);
        }
      };
      fetchData();
      
      // 重置表單
      setForm(prev => ({ 
        ...prev, 
        action_type: "use",
        note: "", 
        location_id: "", 
        borrower: "",
        borrower_id: "",
        new_owner_id: "",
        item_condition: "好",
        expected_return_date: "" 
      }));
      setBorrowType('manual');
    }
  }, [open]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  // 2. 送出前的檢查與 Payload 建構
  const handleSubmit = async () => {
    const token = localStorage.getItem("plms_token");
    
    // Check 1: item_ids 必須為陣列 (map 回傳即為陣列，確認無誤)
    const itemIds = selectedAssets.map(a => a.id);

    // Check 2: 必填欄位的前端防呆
    // 移轉 & 校正 & 領用 & 歸還 -> 必須有位置
    if (['use', 'return', 'transfer', 'correct'].includes(form.action_type) && !form.location_id) {
        alert("請選擇地點 (Location)");
        return;
    }
    // 報廢 & 遺失 & 校正 -> 必須有備註
    if (['scrap', 'loss', 'correct'].includes(form.action_type) && !form.note.trim()) {
        alert("此動作必須填寫備註說明 (Note)");
        return;
    }

    // 處理借用人資料
    const finalBorrower = borrowType === 'manual' && form.borrower ? form.borrower : null;
    const finalBorrowerId = borrowType === 'member' && form.borrower_id ? form.borrower_id : null;

    const payload = {
      item_ids: itemIds, 
      action_type: form.action_type,
      // action_date 由後端自動帶入 NOW()
      location_id: form.location_id || null,
      item_condition: form.item_condition,
      note: form.note || null,
      borrower: finalBorrower,
      borrower_id: finalBorrowerId,
      expected_return_date: form.expected_return_date || null,
      new_owner_id: form.new_owner_id || null
    };

    setLoading(true);
    try {
      const response = await axios.post("http://192.168.10.1/api/transactions", payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert(response.data.message || "批次異動成功！");
      onSuccess(); 
      onClose();
    } catch (error: any) {
      alert((error.response?.data?.message || "系統錯誤"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={() => !loading && onClose()} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 'bold' }}>
        資產批次異動
        <Typography variant="caption" display="block" color="text.secondary">
          已選擇 {selectedAssets.length} 筆資產
        </Typography>
      </DialogTitle>
      
      <DialogContent dividers>
        <Stack spacing={3} sx={{ mt: 1 }}>
          <TextField select label="動作類型" name="action_type" value={form.action_type} onChange={handleChange} fullWidth>
            {ACTION_TYPES.map((type) => (
              <MenuItem key={type.value} value={type.value}>{type.label}</MenuItem>
            ))}
          </TextField>

          {/* 修改 1: 顯示位置選單的條件增加 'transfer' (移轉) 和 'correct' (校正) 
              後端邏輯：移轉需指定新位置；校正需確認當前位置
          */}
          {['use', 'return', 'transfer', 'correct'].includes(form.action_type) && (
            <TextField 
                select 
                label="位置 (Location)" 
                name="location_id" 
                value={form.location_id} 
                onChange={handleChange} 
                fullWidth 
                required
            >
              {locations.map((loc) => (
                <MenuItem key={loc.id} value={loc.id}>{loc.code} - {loc.name}</MenuItem>
              ))}
            </TextField>
          )}

          {form.action_type === 'loan' && (
            <Box sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
              <FormControl component="fieldset" sx={{ mb: 2 }}>
                <FormLabel component="legend" sx={{ fontSize: '0.875rem' }}>借用人類型</FormLabel>
                <RadioGroup row value={borrowType} onChange={(e) => setBorrowType(e.target.value as any)}>
                  <FormControlLabel value="manual" control={<Radio size="small" />} label="手動輸入" />
                  <FormControlLabel value="member" control={<Radio size="small" />} label="系統使用者" />
                </RadioGroup>
              </FormControl>

              {borrowType === 'manual' ? (
                <TextField label="借用人姓名" name="borrower" value={form.borrower} onChange={handleChange} fullWidth />
              ) : (
                <TextField select label="選擇借用人" name="borrower_id" value={form.borrower_id} onChange={handleChange} fullWidth>
                  {users.map(u => <MenuItem key={u.id} value={u.id}>{u.name} ({u.staff_code})</MenuItem>)}
                </TextField>
              )}

              <TextField type="date" label="預計歸還日" name="expected_return_date" value={form.expected_return_date} onChange={handleChange} slotProps={{ inputLabel: { shrink: true } }} fullWidth sx={{ mt: 2 }} />
            </Box>
          )}

          {form.action_type === 'return' && (
            <FormControl component="fieldset" sx={{ px: 1 }}>
              <FormLabel component="legend" sx={{ fontSize: '0.875rem', mb: 1 }}>歸還時物品狀況</FormLabel>
              <RadioGroup
                row
                name="item_condition"
                value={form.item_condition}
                onChange={handleChange}
              >
                <FormControlLabel value="好" control={<Radio size="small" />} label="好" />
                <FormControlLabel value="壞" control={<Radio size="small" />} label="壞" />
              </RadioGroup>
            </FormControl>
          )}

          {form.action_type === 'transfer' && (
            <TextField select label="新擁有者" name="new_owner_id" value={form.new_owner_id} onChange={handleChange} fullWidth required>
              {users.map(u => <MenuItem key={u.id} value={u.id}>{u.name} ({u.staff_code})</MenuItem>)}
            </TextField>
          )}

          {/* 修改 2: 報廢、遺失、校正 -> 備註為必填 
              根據後端: if (empty($data->note)) badRequest
          */}
          <TextField 
            label={['scrap', 'loss', 'correct'].includes(form.action_type) ? "備註說明 (必填)" : "備註說明"}
            name="note" 
            multiline 
            rows={2} 
            value={form.note} 
            onChange={handleChange} 
            fullWidth 
            required={['scrap', 'loss', 'correct'].includes(form.action_type)}
          />
        </Stack>
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} disabled={loading} color="inherit">取消</Button>
        <Button onClick={handleSubmit} variant="contained" disabled={loading} startIcon={loading && <CircularProgress size={20} color="inherit" />}>
          {loading ? "處理中..." : "執行批次異動"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}