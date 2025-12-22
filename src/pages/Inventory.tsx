import { useEffect, useState, useCallback, useMemo } from "react";
import axios from "axios";
import { useSearchParams } from "react-router-dom";

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
  Button,
  CircularProgress,
  Checkbox,
  Tooltip,
} from "@mui/material";

// Icons
import SearchIcon from "@mui/icons-material/Search";
import VisibilityIcon from "@mui/icons-material/Visibility";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";

// 引入子組件
import TransactionDialog from "../components/TransactionDialog";
import AssetHistoryDrawer, {
  getStatusColor,
} from "../components/AssetHistoryDrawer";

// 選項定義
const STATUS_OPTIONS = [
  "全部",
  "閒置",
  "使用中",
  "借用中",
  "維修中",
  "遺失",
  "報廢",
];
const CATEGORY_OPTIONS = ["全部", "非消耗品", "消耗品"];

// 資料介面
interface AssetItem {
  id: number;
  pre_property_no: string; // 前綴編號
  sub_no: string;
  status: string;
  item_condition: string; // 物品狀況
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

export default function Inventory() {
  const [searchParams] = useSearchParams();

  // 資料狀態
  const [assets, setAssets] = useState<AssetItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  // 篩選與分頁狀態
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState("全部");
  const [categoryFilter, setCategoryFilter] = useState("全部");

  // 異動與履歷狀態
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [openTransDialog, setOpenTransDialog] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedAssetId, setSelectedAssetId] = useState<number | null>(null);

  // 計算目前被勾選的資產物件
  const selectedAssets = useMemo(() => {
    return assets.filter((a) => selectedIds.includes(a.id));
  }, [assets, selectedIds]);

  // 取得資產列表
  const fetchAssets = useCallback(async () => {
    setLoading(true);
    // setSelectedIds([]);

    try {
      const token = localStorage.getItem("pms_token");
      if (!token) return;

      const params = new URLSearchParams();
      params.append("page", (page + 1).toString());
      params.append("limit", rowsPerPage.toString());
      if (keyword) params.append("keyword", keyword);

      if (statusFilter !== "全部") params.append("status", statusFilter);
      if (categoryFilter !== "全部") params.append("category", categoryFilter);

      const response = await axios.get<ApiResponse>(
        `http://192.168.10.1/api/assets?${params.toString()}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setAssets(response.data.data);
      setTotalCount(response.data.meta.total_records);
    } catch (error) {
      console.error("Fetch assets error:", error);
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, keyword, statusFilter, categoryFilter]);

  useEffect(() => {
    const statusFromUrl = searchParams.get("status");
    if (statusFromUrl) {
      // 如果 URL 有狀態，且目前的 Filter 不等於 URL 的狀態，才更新
      if (statusFromUrl !== statusFilter) {
        setStatusFilter(statusFromUrl);
        setPage(0); // 重設頁碼
      }
    }
  }, [searchParams]); // 監聽網址參數變化

  // 統一的抓取入口 (State Change -> Fetch)
  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]); // 因為 fetchAssets 依賴了 statusFilter，所以狀態改了它就會動

  // Checkbox 處理
  const handleSelectAll = (checked: boolean) => {
    if (checked) setSelectedIds(assets.map((a) => a.id));
    else setSelectedIds([]);
  };

  const handleSelectOne = (id: number) => {
    const index = selectedIds.indexOf(id);
    if (index === -1) setSelectedIds([...selectedIds, id]);
    else setSelectedIds(selectedIds.filter((x) => x !== id));
  };

  // 開啟履歷抽屜
  const handleRowClick = (id: number) => {
    setSelectedAssetId(id);
    setDrawerOpen(true);
  };

  return (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          mb: 2,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Box>
          <Typography variant="h5" fontWeight="bold">
            資產總表
          </Typography>
          <Typography variant="body2" color="text.secondary">
            共 {totalCount} 筆資產
          </Typography>
        </Box>
      </Box>

      {/* 篩選工具列 */}
      <Paper sx={{ p: 2, mb: 2, borderRadius: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="搜尋名稱、編號、廠牌..."
              value={keyword}
              onChange={(e) => {
                setKeyword(e.target.value);
                setPage(0);
              }}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon color="action" />
                    </InputAdornment>
                  ),
                },
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
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(0);
              }}
            >
              {STATUS_OPTIONS.map((opt) => (
                <MenuItem key={opt} value={opt}>
                  {opt}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid size={{ xs: 6, sm: 3 }}>
            <TextField
              select
              fullWidth
              size="small"
              label="類別"
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setPage(0);
              }}
            >
              {CATEGORY_OPTIONS.map((opt) => (
                <MenuItem key={opt} value={opt}>
                  {opt}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, sm: 2 }}>
            <Button
              variant="contained"
              color="warning"
              fullWidth
              startIcon={<SwapHorizIcon />}
              disabled={selectedIds.length === 0}
              onClick={() => setOpenTransDialog(true)}
              sx={{ fontWeight: "bold" }}
            >
              異動 ({selectedIds.length})
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* 資料表格 */}
      <Paper
        sx={{
          flexGrow: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          borderRadius: 2,
        }}
      >
        <TableContainer sx={{ flexGrow: 1 }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox">
                  <Checkbox
                    indeterminate={
                      selectedIds.length > 0 &&
                      selectedIds.length < assets.length
                    }
                    checked={
                      assets.length > 0 && selectedIds.length === assets.length
                    }
                    onChange={(e) => handleSelectAll(e.target.checked)}
                  />
                </TableCell>
                {/* ★ 標頭調整：加入財產編號與物品狀況 */}
                {[
                  "財產編號",
                  "品名",
                  "廠牌/型號",
                  "狀態",
                  "位置",
                  "物品狀況",
                  "詳情",
                ].map((head) => (
                  <TableCell
                    key={head}
                    align={
                      head === "狀態" || head === "詳情" ? "center" : "left"
                    }
                    sx={{ fontWeight: "bold" }}
                  >
                    {head}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 10 }}>
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : assets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 10 }}>
                    查無資料
                  </TableCell>
                </TableRow>
              ) : (
                assets.map((row) => (
                  <TableRow
                    key={row.id}
                    hover
                    selected={selectedIds.includes(row.id)}
                    onClick={() => handleRowClick(row.id)}
                    sx={{ cursor: "pointer" }}
                  >
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={selectedIds.includes(row.id)}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectOne(row.id);
                        }}
                      />
                    </TableCell>
                    {/* ★ 組合編號：pre_property_no + sub_no */}
                    <TableCell sx={{ fontFamily: "monospace" }}>
                      {row.pre_property_no}-{row.sub_no}
                    </TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>
                      {row.asset_name}
                    </TableCell>
                    <TableCell>
                      {row.brand} {row.model}
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={row.status}
                        size="small"
                        color={getStatusColor(row.status)}
                      />
                    </TableCell>
                    <TableCell>{row.location_name || "-"}</TableCell>
                    {/* ★ 物品狀況顯示 */}
                    <TableCell>
                      <Typography
                        variant="body2"
                        sx={{
                          color:
                            row.item_condition === "好"
                              ? "text.primary"
                              : "error.main",
                          fontWeight:
                            row.item_condition !== "好" ? "bold" : "normal",
                        }}
                      >
                        {row.item_condition || "未註記"}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="查看詳情">
                        <IconButton size="small" color="primary">
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
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

      {/* 資產履歷抽屜 */}
      <AssetHistoryDrawer
        open={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
          setSelectedAssetId(null);
        }}
        assetId={selectedAssetId}
      />

      {/* 異動 Dialog */}
      <TransactionDialog
        open={openTransDialog}
        onClose={() => setOpenTransDialog(false)}
        selectedAssets={selectedAssets}
        onSuccess={() => fetchAssets()}
      />
    </Box>
  );
}
