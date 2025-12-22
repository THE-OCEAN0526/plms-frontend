import { useEffect, useState } from "react";
import axios from "axios";
import {
  Box,
  Typography,
  Chip,
  IconButton,
  Drawer,
  Stack,
  Paper,
  CircularProgress,
  Alert,
  Divider,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import HistoryIcon from "@mui/icons-material/History";
import PersonIcon from "@mui/icons-material/Person";
import BusinessIcon from "@mui/icons-material/Business";
import LocationOnIcon from "@mui/icons-material/LocationOn";

interface AssetHistory {
  asset_info: {
    id: number;
    sub_no: string;
    name: string;
    category: string;
    status: string;
  };
  timeline: Array<{
    source_type: string;
    event_date: string;
    action_type: string;
    target_name: string | null;
    description: string;
    location: string | null;
  }>;
}

interface AssetHistoryDrawerProps {
  open: boolean;
  onClose: () => void;
  assetId: number | null;
}

export const getStatusColor = (status: string) => {
  switch (status) {
    case "閒置":
      return "info";
    case "使用中":
      return "success";
    case "借用中":
      return "secondary";
    case "維修中":
      return "warning";
    case "遺失":
      return "error";
    case "報廢":
      return "default";
    default:
      return "default";
  }
};

export default function AssetHistoryDrawer({
  open,
  onClose,
  assetId,
}: AssetHistoryDrawerProps) {
  const [historyData, setHistoryData] = useState<AssetHistory | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && assetId) {
      fetchHistory(assetId);
    } else if (!open) {
      setHistoryData(null);
      setError(null);
    }
  }, [open, assetId]);

  const fetchHistory = async (id: number) => {
    setLoading(true);
    try {
      const token = localStorage.getItem("plms_token");
      const response = await axios.get<AssetHistory>(
        `http://192.168.10.1/api/assets/${id}/history`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setHistoryData(response.data);
    } catch (err) {
      setError("無法讀取資產履歷資料");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      // 確保 Drawer 的 Paper 本身也支援深色模式
      slotProps={{
        paper: {
          sx: {
            width: { xs: "100%", sm: 480 },
            backgroundImage: "none", // MUI 深色模式下 Paper 會有疊加層，有時關閉它可以讓顏色更純淨
          },
        },
      }}
    >
      {loading ? (
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "100%",
          }}
        >
          <CircularProgress />
        </Box>
      ) : error ? (
        <Box sx={{ p: 3 }}>
          <Alert severity="error">{error}</Alert>
        </Box>
      ) : historyData ? (
        <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
          {/* Header - 修正處：使用函式判斷 mode */}
          <Box
            sx={(theme) => ({
              p: 3,
              // 深色模式用背景預設色或更深的灰色，淺色模式用 grey.50
              bgcolor:
                theme.palette.mode === "dark"
                  ? "background.default"
                  : "grey.50",
              borderBottom: 1,
              borderColor: "divider",
            })}
          >
            <Box
              sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}
            >
              <Stack direction="row" spacing={1}>
                <Chip
                  label={historyData.asset_info.status}
                  color={getStatusColor(historyData.asset_info.status)}
                  size="small"
                />
                <Chip
                  label={historyData.asset_info.category}
                  variant="outlined" // 用外框樣式區隔，視覺上比較清爽
                  size="small"
                  sx={{ fontWeight: "bold" }}
                />
              </Stack>
              
              <IconButton onClick={onClose} size="small">
                <CloseIcon />
              </IconButton>
            </Box>
            <Typography variant="h6" fontWeight="bold">
              {historyData.asset_info.name}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              財產編號：{historyData.asset_info.sub_no}
            </Typography>
          </Box>

          {/* Timeline */}
          <Box
            sx={{
              p: 3,
              flexGrow: 1,
              overflowY: "auto",
              bgcolor: "background.paper", // 這個本來就會自動切換
            }}
          >
            <Typography
              variant="subtitle2"
              sx={{
                mb: 3,
                display: "flex",
                alignItems: "center",
                gap: 1,
                color: "primary.main",
              }}
            >
              <HistoryIcon fontSize="small" /> 資產生命週期軌跡
            </Typography>

            <Stack spacing={0}>
              {historyData.timeline.map((log, index) => (
                <Box
                  key={index}
                  sx={{
                    display: "flex",
                    gap: 2.5,
                    pb: 4,
                    position: "relative",
                  }}
                >
                  {/* 線條裝飾 */}
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                    }}
                  >
                    <Box
                      sx={{
                        width: 12,
                        height: 12,
                        borderRadius: "50%",
                        border: "2px solid",
                        borderColor: "primary.main",
                        bgcolor: "background.paper",
                        zIndex: 1,
                      }}
                    />
                    {index !== historyData.timeline.length - 1 && (
                      <Box
                        sx={{
                          width: 2,
                          flexGrow: 1,
                          bgcolor: "primary.light",
                          opacity: 0.3,
                          my: 0.5,
                        }}
                      />
                    )}
                  </Box>

                  {/* 內容卡片 */}
                  <Box sx={{ flexGrow: 1, mt: -0.5 }}>
                    <Typography
                      variant="caption"
                      sx={{
                        color: "text.disabled",
                        fontWeight: "bold",
                        letterSpacing: 0.5,
                      }}
                    >
                      {log.event_date}
                    </Typography>

                    <Typography
                      variant="subtitle2"
                      sx={{ fontWeight: 700, mb: 1, color: "text.primary" }}
                    >
                      {log.action_type}
                    </Typography>

                    {/* 修正處：卡片背景色 */}
                    <Paper
                      variant="outlined"
                      sx={(theme) => ({
                        p: 2,
                        borderRadius: 2,
                        // 深色模式下，Paper 內部的卡片通常建議用比 background.paper 更淺一點點或更深一點點的顏色
                        // 這裡使用透明度疊加或者是 background.default
                        bgcolor:
                          theme.palette.mode === "dark"
                            ? "rgba(255, 255, 255, 0.05)"
                            : "grey.50",
                        borderLeft: 4,
                        borderColor: "primary.main",
                      })}
                    >
                      {log.target_name && (
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                            mb: 1,
                          }}
                        >
                          {log.source_type.includes("Maintenance") ? (
                            <BusinessIcon
                              sx={{ fontSize: 16, color: "text.secondary" }}
                            />
                          ) : (
                            <PersonIcon
                              sx={{ fontSize: 16, color: "text.secondary" }}
                            />
                          )}
                          <Typography variant="body2" fontWeight="bold">
                            {log.source_type.includes("Maintenance")
                              ? "維修廠商 / 人員："
                              : "相關人員："}
                            {log.target_name}
                          </Typography>
                        </Box>
                      )}

                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ whiteSpace: "pre-line" }}
                      >
                        {log.description || "無備註說明"}
                      </Typography>

                      {log.location && (
                        <>
                          <Divider sx={{ my: 1.5, borderStyle: "dashed" }} />
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 0.5,
                              color: "primary.main",
                            }}
                          >
                            <LocationOnIcon sx={{ fontSize: 14 }} />
                            <Typography variant="caption" fontWeight="bold">
                              存放位置：{log.location}
                            </Typography>
                          </Box>
                        </>
                      )}
                    </Paper>
                  </Box>
                </Box>
              ))}
            </Stack>
          </Box>
        </Box>
      ) : (
        <Box sx={{ p: 3 }}>
          <Alert severity="info">請選擇資產以載入歷程</Alert>
        </Box>
      )}
    </Drawer>
  );
}
