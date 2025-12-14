import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import {
  Box,
  Grid,
  Paper,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Stack,
  Alert,
  Tooltip,
  CircularProgress,
  MenuItem,
  Autocomplete,
  InputAdornment,
  debounce,
} from "@mui/material";

// Icons
import BuildIcon from "@mui/icons-material/Build";
import AddIcon from "@mui/icons-material/Add";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import SearchIcon from "@mui/icons-material/Search";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import HandymanIcon from "@mui/icons-material/Handyman";
import CleaningServicesIcon from "@mui/icons-material/CleaningServices";

// --- 型別定義 ---

// 資產搜尋結果 (對應 API 回傳)
interface AssetSearchResult {
  id: number;
  pre_property_no: string;
  sub_no: string;
  asset_name: string;
  brand: string;
  model: string;
  status: string;
}

// 維修工單 (前端顯示用)
interface MaintenanceItem {
  id: number;
  asset_id: number;
  pre_property_no: string;
  sub_no: string;
  asset_name: string;
  issue: string;
  vendor: string;
  start_date: string;
  action_type: "維修" | "保養";
  reporter: string;
}

// 模擬資料：進行中的維修單 (列表用)
const MOCK_DATA: MaintenanceItem[] = [
  {
    id: 1,
    asset_id: 7,
    pre_property_no: "3100710",
    sub_no: "3100710-39",
    asset_name: "ASUS 筆記型電腦",
    issue: "螢幕無法顯示，電源燈有亮",
    vendor: "ASUS 原廠",
    start_date: "2025-11-19",
    action_type: "維修",
    reporter: "王小明",
  },
  {
    id: 2,
    asset_id: 8,
    pre_property_no: "3100710",
    sub_no: "3100710-42",
    asset_name: "EPSON 投影機",
    issue: "定期更換燈泡與除塵",
    vendor: "捷修網",
    start_date: "2025-11-18",
    action_type: "保養",
    reporter: "林大華",
  },
];

export default function Maintenance() {
  // 頁面狀態
  const [items, setItems] = useState<MaintenanceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState("");

  // Dialog 狀態
  const [openFormDialog, setOpenFormDialog] = useState(false);
  const [openCompleteDialog, setOpenCompleteDialog] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  // --- Autocomplete 搜尋狀態 ---
  const [assetOptions, setAssetOptions] = useState<AssetSearchResult[]>([]); // 下拉選單的選項
  const [assetInputValue, setAssetInputValue] = useState(""); // 使用者輸入的關鍵字
  const [isAssetLoading, setIsAssetLoading] = useState(false); // 搜尋中的轉圈圈

  // 表單：新增/修改
  const [form, setForm] = useState({
    asset_id: null as number | null,
    pre_property_no: "",
    sub_no: "",
    asset_name: "",
    action_type: "維修",
    issue: "",
    vendor: "",
    start_date: new Date().toISOString().split("T")[0],
  });

  // 表單：完修結案
  const [completeForm, setCompleteForm] = useState({
    cost: "",
    finish_date: new Date().toISOString().split("T")[0],
    result: "維修成功",
    remarks: "",
  });
  const [selectedCompleteItem, setSelectedCompleteItem] =
    useState<MaintenanceItem | null>(null);

  // 1. 初始化載入列表
  useEffect(() => {
    setTimeout(() => {
      setItems(MOCK_DATA);
      setLoading(false);
    }, 500);
  }, []);

  // 2. 資產搜尋邏輯 (核心功能)
  // 使用 useMemo + debounce 來防止每打一個字就發 Request
  const fetchAssets = useMemo(
    () =>
      debounce(
        async (
          input: string,
          callback: (results: AssetSearchResult[]) => void
        ) => {
          if (!input || input.length < 2) {
            // 至少輸入 2 個字才搜尋，避免資料量過大
            callback([]);
            return;
          }

          try {
            const token = localStorage.getItem("plms_token");
            // ★ 關鍵：帶入 scope=maintainable 只搜尋「可維修」的資產 (排除已報修、報廢)
            // 這裡假設後端 API 格式為 GET /api/assets?keyword=xxx&scope=maintainable
            const response = await axios.get("http://192.168.10.1/api/assets", {
              params: { keyword: input, scope: "maintainable", limit: 20 },
              headers: { Authorization: `Bearer ${token}` },
            });

            // 處理回傳結構 (假設後端回傳 { data: [...] } 或直接 [...])
            const results = Array.isArray(response.data)
              ? response.data
              : response.data.data || [];
            callback(results);
          } catch (error) {
            console.error("Asset search failed:", error);
            callback([]);
          }
        },
        500
      ), // 延遲 500ms
    []
  );

  // 監聽使用者輸入，觸發搜尋
  useEffect(() => {
    let active = true;

    if (assetInputValue === "") {
      setAssetOptions([]);
      return undefined;
    }

    setIsAssetLoading(true);

    fetchAssets(assetInputValue, (results) => {
      if (active) {
        setAssetOptions(results);
        setIsAssetLoading(false);
      }
    });

    return () => {
      active = false;
    };
  }, [assetInputValue, fetchAssets]);

  // --- 操作邏輯 ---

  const handleOpenCreate = () => {
    setIsEditing(false);
    setEditingId(null);
    setAssetInputValue(""); // 清空搜尋
    setAssetOptions([]);
    setForm({
      asset_id: null,
      pre_property_no: "",
      sub_no: "",
      asset_name: "",
      action_type: "維修",
      issue: "",
      vendor: "",
      start_date: new Date().toISOString().split("T")[0],
    });
    setOpenFormDialog(true);
  };

  const handleOpenEdit = (item: MaintenanceItem) => {
    setIsEditing(true);
    setEditingId(item.id);
    // 編輯時，資產欄位鎖定，顯示目前的資產
    setForm({
      asset_id: item.asset_id,
      pre_property_no: item.pre_property_no,
      sub_no: item.sub_no,
      asset_name: item.asset_name,
      action_type: item.action_type,
      issue: item.issue,
      vendor: item.vendor,
      start_date: item.start_date,
    });
    setOpenFormDialog(true);
  };

  const handleFormSubmit = () => {
    if (!form.asset_id) {
      alert("請先選擇資產");
      return;
    }

    if (isEditing && editingId) {
      // 修改邏輯
      const updatedItems = items.map((item) =>
        item.id === editingId
          ? {
              ...item,
              asset_id: form.asset_id as number,
              sub_no: form.sub_no,
              asset_name: form.asset_name,
              action_type: form.action_type as "維修" | "保養",
              issue: form.issue,
              vendor: form.vendor,
              start_date: form.start_date,
            }
          : item
      );
      setItems(updatedItems);
      alert("維修單已更新！");
    } else {
      // 新增邏輯
      const newItem: MaintenanceItem = {
        id: Math.floor(Math.random() * 1000),
        asset_id: form.asset_id as number,
        pre_property_no: form.pre_property_no,
        sub_no: form.sub_no,
        asset_name: form.asset_name || "(未知資產)",
        issue: form.issue,
        vendor: form.vendor,
        start_date: form.start_date,
        action_type: form.action_type as "維修" | "保養",
        reporter: "Current User",
      };
      setItems([newItem, ...items]);
      alert("報修單已建立！");
    }
    setOpenFormDialog(false);
  };

  const handleDelete = (id: number) => {
    if (window.confirm("確定要撤銷此報修單嗎？(資產將恢復為送修前的狀態)")) {
      setItems(items.filter((t) => t.id !== id));
      if (openFormDialog) setOpenFormDialog(false);
    }
  };

  const handleOpenCompleteDialog = (item: MaintenanceItem) => {
    setSelectedCompleteItem(item);
    setOpenCompleteDialog(true);
  };

  const handleCompleteSubmit = () => {
    if (!selectedCompleteItem) return;
    const updatedItems = items.filter((t) => t.id !== selectedCompleteItem.id);
    setItems(updatedItems);
    setOpenCompleteDialog(false);
    alert(`工單 #${selectedCompleteItem.id} 已結案！資產恢復為「閒置」狀態。`);
    setCompleteForm({
      cost: "",
      finish_date: new Date().toISOString().split("T")[0],
      result: "維修成功",
      remarks: "",
    });
  };

  // 列表搜尋過濾
  const filteredItems = items.filter(
    (t) => t.sub_no.includes(keyword) || t.asset_name.includes(keyword)
  );

  return (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        gap: 2,
        overflow: "hidden",
      }}
    >
      {/* 1. 頂部工具列 */}
      <Box
        sx={{
          flexShrink: 0,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 2,
        }}
      >
        <Box>
          <Typography
            variant="h5"
            fontWeight="800"
            color="text.primary"
            sx={{ display: "flex", alignItems: "center", gap: 1 }}
          >
            <HandymanIcon color="warning" /> 維修登記
          </Typography>
          <Typography variant="body2" color="text.secondary">
            目前共有 <b>{items.length}</b> 項資產正在進行維修或保養
          </Typography>
        </Box>

        <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
          <TextField
            size="small"
            placeholder="搜尋編號或品名..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
            }}
            sx={{ bgcolor: "background.paper", borderRadius: 1 }}
          />
          <Button
            variant="contained"
            color="warning"
            startIcon={<AddIcon />}
            onClick={handleOpenCreate}
            sx={{ borderRadius: 2, fontWeight: "bold", boxShadow: 2, px: 3 }}
          >
            新增報修
          </Button>
        </Box>
      </Box>

      {/* 2. 列表 */}
      <Paper
        sx={{
          flexGrow: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          bgcolor: "background.paper",
          borderRadius: 2,
          border: "1px solid",
          borderColor: "divider",
        }}
      >
        <TableContainer sx={{ flexGrow: 1 }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell
                  sx={{ bgcolor: "background.paper", fontWeight: "bold" }}
                >
                  單號
                </TableCell>
                <TableCell
                  sx={{ bgcolor: "background.paper", fontWeight: "bold" }}
                >
                  資產資訊
                </TableCell>
                <TableCell
                  sx={{ bgcolor: "background.paper", fontWeight: "bold" }}
                >
                  類型
                </TableCell>
                <TableCell
                  sx={{ bgcolor: "background.paper", fontWeight: "bold" }}
                >
                  原因/描述
                </TableCell>
                <TableCell
                  sx={{ bgcolor: "background.paper", fontWeight: "bold" }}
                >
                  廠商
                </TableCell>
                <TableCell
                  sx={{ bgcolor: "background.paper", fontWeight: "bold" }}
                >
                  送修日期
                </TableCell>
                <TableCell
                  sx={{ bgcolor: "background.paper", fontWeight: "bold" }}
                  align="center"
                >
                  操作
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : filteredItems.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    align="center"
                    sx={{ py: 8, color: "text.secondary" }}
                  >
                    目前沒有進行中的案件
                  </TableCell>
                </TableRow>
              ) : (
                filteredItems.map((row) => (
                  <TableRow key={row.id} hover>
                    <TableCell
                      sx={{ fontFamily: "monospace", color: "text.secondary" }}
                    >
                      #{row.id}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">
                        {row.asset_name}
                      </Typography>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        fontFamily="monospace"
                      >
                        {row.sub_no}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={row.action_type}
                        icon={
                          row.action_type === "保養" ? (
                            <CleaningServicesIcon
                              sx={{ "&&": { fontSize: 14 } }}
                            />
                          ) : (
                            <BuildIcon sx={{ "&&": { fontSize: 14 } }} />
                          )
                        }
                        color={row.action_type === "保養" ? "info" : "warning"}
                        size="small"
                        variant="outlined"
                        sx={{
                          minWidth: 60,
                          fontWeight: "bold",
                          border: 0,
                          bgcolor:
                            row.action_type === "保養"
                              ? "info.50"
                              : "warning.50",
                        }}
                      />
                    </TableCell>
                    <TableCell sx={{ maxWidth: 300 }}>{row.issue}</TableCell>
                    <TableCell>{row.vendor || "-"}</TableCell>
                    <TableCell>{row.start_date}</TableCell>
                    <TableCell align="center">
                      <Stack
                        direction="row"
                        spacing={1}
                        justifyContent="center"
                      >
                        <Tooltip title="完修結案">
                          <IconButton
                            color="success"
                            size="small"
                            onClick={() => handleOpenCompleteDialog(row)}
                            sx={{
                              border: "1px solid",
                              borderColor: "success.main",
                            }}
                          >
                            <CheckCircleIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="修改內容">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handleOpenEdit(row)}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* --- Dialog: 新增/修改表單 --- */}
      <Dialog
        open={openFormDialog}
        onClose={() => setOpenFormDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle
          sx={{
            fontWeight: "bold",
            display: "flex",
            alignItems: "center",
            gap: 1,
          }}
        >
          {isEditing ? (
            <EditIcon color="primary" />
          ) : (
            <AddIcon color="warning" />
          )}
          {isEditing ? "修改維修單" : "新增送修 / 保養"}
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={3} sx={{ mt: 1 }}>
            {/* 1. 選擇資產 (Async Autocomplete) */}
            <Autocomplete
              // 如果是編輯模式，則禁用 (唯讀)
              disabled={isEditing}
              // 資料來源
              options={assetOptions}
              loading={isAssetLoading}
              // ★ 關鍵修正 1：關閉前端過濾，信任後端回傳的結果
              filterOptions={(x) => x}
              // 如何顯示選項文字 (給人看的)
              getOptionLabel={(option) =>
                `[${option.pre_property_no}-${option.sub_no}] ${option.asset_name}`
              }
              // 判斷是否為同一物件 (避免 React 警告)
              isOptionEqualToValue={(option, value) => option.id === value.id}
              // 當選中時，更新 form
              onChange={(_, newValue) => {
                if (newValue) {
                  setForm({
                    ...form,
                    asset_id: newValue.id,
                    pre_property_no: newValue.pre_property_no,
                    sub_no: String(newValue.sub_no), // 轉字串，避免 API 回傳數字導致錯誤
                    asset_name: newValue.asset_name,
                  });
                } else {
                  setForm({
                    ...form,
                    asset_id: null,
                    sub_no: "",
                    asset_name: "",
                  });
                }
              }}
              // 綁定輸入框的值，觸發搜尋
              onInputChange={(_, newInputValue) => {
                setAssetInputValue(newInputValue);
              }}
              // 設定目前選中的值
              value={
                form.asset_id
                  ? {
                      id: form.asset_id,
                      pre_property_no: form.pre_property_no,
                      sub_no: form.sub_no,
                      asset_name: form.asset_name,
                      brand: "",
                      model: "",
                      status: "",
                    }
                  : null
              }
              // 自訂下拉選單的每一列 (Render Option)
              renderOption={(props, option) => {
                const { key, ...otherProps } = props;
                return (
                  <li key={key} {...otherProps}>
                    <Box>
                      <Typography variant="body2" fontWeight="bold">
                        {/* 顯示編號與品名 */}[{option.pre_property_no} -{" "}
                        {option.sub_no}] {option.asset_name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {/* 顯示廠牌、型號與狀態 (這裡就會顯示 Dell 了) */}
                        {option.brand} {option.model} ({option.status})
                      </Typography>
                    </Box>
                  </li>
                );
              }}
              // 自訂輸入框外觀
              renderInput={(params) => (
                <TextField
                  {...params}
                  label={isEditing ? "資產 (不可修改)" : "搜尋資產"}
                  placeholder="輸入編號、品名、型號..."
                  required
                  fullWidth
                  helperText={
                    isEditing
                      ? "若選錯資產，請直接刪除此單據重新建立"
                      : "支援輸入：1001、筆電、Dell、PO單號"
                  }
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {isAssetLoading ? (
                          <CircularProgress color="inherit" size={20} />
                        ) : null}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  }}
                />
              )}
            />

            <Grid container spacing={2}>
              <Grid size={{ xs: 6 }}>
                <TextField
                  select
                  label="動作類型"
                  fullWidth
                  required
                  value={form.action_type}
                  onChange={(e) =>
                    setForm({ ...form, action_type: e.target.value })
                  }
                >
                  <MenuItem value="維修">🔧 維修</MenuItem>
                  <MenuItem value="保養">🧹 保養</MenuItem>
                </TextField>
              </Grid>
              <Grid size={{ xs: 6 }}>
                <TextField
                  label="送修日期"
                  type="date"
                  fullWidth
                  required
                  value={form.start_date}
                  onChange={(e) =>
                    setForm({ ...form, start_date: e.target.value })
                  }
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </Grid>

            <TextField
              label="維修廠商 / 負責人"
              fullWidth
              required
              value={form.vendor}
              onChange={(e) => setForm({ ...form, vendor: e.target.value })}
              placeholder="例如：華碩原廠、林同學"
            />

            <TextField
              label="故障原因 / 備註"
              fullWidth
              multiline
              rows={3}
              value={form.issue}
              onChange={(e) => setForm({ ...form, issue: e.target.value })}
              placeholder="請詳細描述故障情形..."
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2, justifyContent: "space-between" }}>
          {isEditing ? (
            <Button
              onClick={() => handleDelete(editingId!)}
              color="error"
              startIcon={<DeleteIcon />}
            >
              刪除此單
            </Button>
          ) : (
            <Box />
          )}

          <Box>
            <Button
              onClick={() => setOpenFormDialog(false)}
              color="inherit"
              sx={{ mr: 1 }}
            >
              取消
            </Button>
            <Button
              onClick={handleFormSubmit}
              variant="contained"
              color="primary"
              disabled={!form.sub_no}
            >
              {isEditing ? "儲存修改" : "確認登記"}
            </Button>
          </Box>
        </DialogActions>
      </Dialog>

      {/* --- Dialog: 完修結案 (保持原樣) --- */}
      <Dialog
        open={openCompleteDialog}
        onClose={() => setOpenCompleteDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle
          sx={{
            fontWeight: "bold",
            display: "flex",
            alignItems: "center",
            gap: 1,
            color: "success.main",
          }}
        >
          <CheckCircleIcon /> 完修結案
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <Box
              sx={{
                bgcolor: "action.hover",
                p: 2,
                borderRadius: 2,
                border: "1px solid",
                borderColor: "divider",
              }}
            >
              <Typography variant="caption" color="text.secondary">
                正在結案：
              </Typography>
              <Typography variant="h6" fontWeight="bold">
                {selectedCompleteItem?.asset_name}
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                fontFamily="monospace"
              >
                {selectedCompleteItem?.sub_no}
              </Typography>
            </Box>

            <Alert severity="success">
              結案後，資產狀態將恢復為<b>「使用中 / 閒置」</b>。
            </Alert>

            <Grid container spacing={2}>
              <Grid size={{ xs: 6 }}>
                <TextField
                  label="維修費用"
                  fullWidth
                  required
                  type="number"
                  value={completeForm.cost}
                  onChange={(e) =>
                    setCompleteForm({ ...completeForm, cost: e.target.value })
                  }
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">$</InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid size={{ xs: 6 }}>
                <TextField
                  label="完修日期"
                  type="date"
                  fullWidth
                  required
                  value={completeForm.finish_date}
                  onChange={(e) =>
                    setCompleteForm({
                      ...completeForm,
                      finish_date: e.target.value,
                    })
                  }
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  select
                  label="維修結果"
                  fullWidth
                  value={completeForm.result}
                  onChange={(e) =>
                    setCompleteForm({ ...completeForm, result: e.target.value })
                  }
                >
                  <MenuItem value="維修成功">維修成功 (恢復閒置)</MenuItem>
                  <MenuItem value="無法修復">無法修復 (設為報廢)</MenuItem>
                </TextField>
              </Grid>
            </Grid>
            <TextField
              label="處理說明 / 備註"
              fullWidth
              multiline
              rows={2}
              value={completeForm.remarks}
              onChange={(e) =>
                setCompleteForm({ ...completeForm, remarks: e.target.value })
              }
              placeholder="例如：更換主機板，保固一年..."
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenCompleteDialog(false)} color="inherit">
            取消
          </Button>
          <Button
            onClick={handleCompleteSubmit}
            variant="contained"
            color="success"
          >
            確認結案
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
