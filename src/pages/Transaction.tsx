import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import {
  Box,
  Paper,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Checkbox, // ★ 關鍵元件
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Stack,
  InputAdornment,
  MenuItem,
  debounce,
  LinearProgress, // 用來顯示批次處理進度
} from "@mui/material";

import SearchIcon from "@mui/icons-material/Search";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

// --- 型別定義 ---
interface Asset {
  id: number;
  pre_property_no: string;
  sub_no: string;
  asset_name: string;
  status: string; // "閒置", "使用中", "維修中", "報廢"
  custodian: string; // 目前保管人
  location: string;
}

export default function Transaction() {
  // 資料狀態
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState("");

  // ★ 批次選擇狀態
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  // Dialog 狀態
  const [openDialog, setOpenDialog] = useState(false);
  const [processing, setProcessing] = useState(false); // 處理中轉圈圈
  const [progress, setProgress] = useState(0); // 處理進度 0~100

  // 表單狀態
  const [form, setForm] = useState({
    action_type: "領用", // 領用, 借出, 歸還, 移轉...
    new_location: "",
    new_custodian: "",
    remarks: "",
  });

  // 1. 載入資產列表 (這裡應該呼叫 GET /api/assets)
  const fetchAssets = async (search = "") => {
    setLoading(true);
    try {
      const token = localStorage.getItem("pms_token");
      // 這裡假設後端有一個 API 可以列出所有資產
      const res = await axios.get("http://192.168.10.1/api/assets", {
        headers: { Authorization: `Bearer ${token}` },
        params: { keyword: search, limit: 50 } // 先抓50筆示範
      });
      // 簡單處理回傳格式
      const data = Array.isArray(res.data) ? res.data : res.data.data || [];
      setAssets(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssets();
  }, []);

  // 搜尋 Debounce
  const handleSearch = useMemo(() => debounce((v) => fetchAssets(v), 500), []);

  // --- 勾選邏輯 ---
  
  // 全選 / 取消全選
  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      const allIds = assets.map((a) => a.id);
      setSelectedIds(allIds);
    } else {
      setSelectedIds([]);
    }
  };

  // 單選
  const handleSelectOne = (id: number) => {
    const selectedIndex = selectedIds.indexOf(id);
    let newSelected: number[] = [];

    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selectedIds, id);
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(selectedIds.slice(1));
    } else if (selectedIndex === selectedIds.length - 1) {
      newSelected = newSelected.concat(selectedIds.slice(0, -1));
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(
        selectedIds.slice(0, selectedIndex),
        selectedIds.slice(selectedIndex + 1)
      );
    }
    setSelectedIds(newSelected);
  };

  // --- 送出異動 (模擬批次處理) ---
  const handleSubmit = async () => {
    setProcessing(true);
    setProgress(0);

    const token = localStorage.getItem("pms_token");
    const total = selectedIds.length;
    let successCount = 0;
    let failCount = 0;

    // ★ 這裡就是「前端迴圈」的笨方法
    // 我們一個一個送出請求
    for (let i = 0; i < total; i++) {
      const assetId = selectedIds[i];
      try {
        await axios.post(
          "http://192.168.10.1/api/transactions",
          {
            asset_id: assetId,
            action_type: form.action_type,
            custodian: form.new_custodian,
            location: form.new_location,
            remarks: form.remarks,
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        successCount++;
      } catch (error) {
        console.error(`Asset ${assetId} failed`, error);
        failCount++;
      }
      
      // 更新進度條
      setProgress(Math.round(((i + 1) / total) * 100));
    }

    setProcessing(false);
    setOpenDialog(false);
    setSelectedIds([]); // 清空勾選
    setForm({ ...form, remarks: "" }); // 重置備註
    
    alert(`處理完成！成功: ${successCount} 筆，失敗: ${failCount} 筆`);
    fetchAssets(keyword); // 重整列表
  };

  return (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column", gap: 2 }}>
      {/* 標題與工具列 */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Typography variant="h5" fontWeight="800" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <SwapHorizIcon color="primary" /> 資產異動登記
        </Typography>

        <Box sx={{ display: "flex", gap: 2 }}>
            <TextField
                size="small"
                placeholder="搜尋資產..."
                onChange={(e) => {
                    setKeyword(e.target.value);
                    handleSearch(e.target.value);
                }}
                InputProps={{
                    startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment>,
                }}
            />
            {/* ★ 只有當有勾選時，才顯示「批次處理按鈕」 */}
            <Button
                variant="contained"
                color="primary"
                disabled={selectedIds.length === 0}
                onClick={() => setOpenDialog(true)}
            >
                批次異動 ({selectedIds.length})
            </Button>
        </Box>
      </Box>

      {/* 資產列表 */}
      <Paper sx={{ flexGrow: 1, overflow: "hidden" }}>
        <TableContainer sx={{ height: "100%" }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox">
                  <Checkbox
                    indeterminate={selectedIds.length > 0 && selectedIds.length < assets.length}
                    checked={assets.length > 0 && selectedIds.length === assets.length}
                    onChange={handleSelectAll}
                  />
                </TableCell>
                <TableCell>編號</TableCell>
                <TableCell>品名</TableCell>
                <TableCell>目前狀態</TableCell>
                <TableCell>保管人</TableCell>
                <TableCell>位置</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {assets.map((row) => {
                const isSelected = selectedIds.indexOf(row.id) !== -1;
                return (
                  <TableRow
                    key={row.id}
                    hover
                    selected={isSelected}
                    onClick={() => handleSelectOne(row.id)} // 點擊整行都能選
                    sx={{ cursor: "pointer" }}
                  >
                    <TableCell padding="checkbox">
                      <Checkbox checked={isSelected} />
                    </TableCell>
                    <TableCell>{row.pre_property_no}-{row.sub_no}</TableCell>
                    <TableCell>{row.asset_name}</TableCell>
                    <TableCell>
                        <Chip 
                            label={row.status} 
                            size="small" 
                            color={row.status === '閒置' ? 'success' : 'default'}
                        />
                    </TableCell>
                    <TableCell>{row.custodian}</TableCell>
                    <TableCell>{row.location}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* 異動 Dialog */}
      <Dialog open={openDialog} onClose={() => !processing && setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>批次異動處理</DialogTitle>
        <DialogContent dividers>
            
            {processing ? (
                <Box sx={{ width: '100%', mt: 2 }}>
                    <Typography variant="body2" gutterBottom>正在處理中... {progress}%</Typography>
                    <LinearProgress variant="determinate" value={progress} />
                </Box>
            ) : (
                <Stack spacing={3} sx={{ mt: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                        您已選擇 <b>{selectedIds.length}</b> 筆資產，請選擇要執行的動作：
                    </Typography>

                    <TextField
                        select
                        label="異動類型"
                        value={form.action_type}
                        onChange={(e) => setForm({...form, action_type: e.target.value})}
                    >
                        <MenuItem value="領用">🙋‍♂️ 領用 (閒置 - 使用中)</MenuItem>
                        <MenuItem value="歸還">↩️ 歸還 (使用中 - 閒置)</MenuItem>
                        <MenuItem value="借出">🤝 借出 (閒置 - 外借中)</MenuItem>
                        <MenuItem value="報廢">⚠️ 報廢 (- 報廢)</MenuItem>
                    </TextField>

                    {(form.action_type === '領用' || form.action_type === '借出') && (
                        <>
                            <TextField 
                                label="新保管人 / 借用人" 
                                value={form.new_custodian}
                                onChange={(e) => setForm({...form, new_custodian: e.target.value})}
                            />
                            <TextField 
                                label="新存放位置" 
                                value={form.new_location}
                                onChange={(e) => setForm({...form, new_location: e.target.value})}
                            />
                        </>
                    )}

                    <TextField 
                        label="備註 / 原因" 
                        multiline rows={2}
                        value={form.remarks}
                        onChange={(e) => setForm({...form, remarks: e.target.value})}
                    />
                </Stack>
            )}
            
        </DialogContent>
        <DialogActions>
          {!processing && (
            <>
                <Button onClick={() => setOpenDialog(false)}>取消</Button>
                <Button onClick={handleSubmit} variant="contained" color="primary">確認執行</Button>
            </>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
}