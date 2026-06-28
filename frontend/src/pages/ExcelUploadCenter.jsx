import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Card,
  CardContent,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  IconButton,
  Tooltip,
  Grid,
  TextField,
  CircularProgress,
} from '@mui/material';
import {
  CloudUpload as CloudUploadIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Download as DownloadIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import MainLayout from '../components/MainLayout';
import api from '../services/api';

const ExcelUploadCenter = ({ darkMode, toggleDarkMode }) => {
  const [uploadHistory, setUploadHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragActive, setIsDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadError, setUploadError] = useState(null);
  const [uploadSuccess, setUploadSuccess] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewData, setPreviewData] = useState([]);
  const [selectedUpload, setSelectedUpload] = useState(null);
  const [validationSummary, setValidationSummary] = useState(null);
  const dragCounter = useRef(0);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchUploadHistory();
  }, []);

  const fetchUploadHistory = async () => {
    try {
      setLoading(true);
      const response = await api.get('/uploads/history');
      setUploadHistory(response.data.data || []);
    } catch (err) {
      setUploadError(err.response?.data?.detail || 'Failed to load upload history');
    } finally {
      setLoading(false);
    }
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current += 1;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragActive(true);
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current -= 1;
    if (dragCounter.current === 0) {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    dragCounter.current = 0;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (validateFile(file)) {
        setSelectedFile(file);
        setUploadError(null);
      }
    }
  };

  const validateFile = (file) => {
    const validExtensions = ['.xlsx', '.xls'];
    const extension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();

    if (!validExtensions.includes(extension)) {
      setUploadError('Only .xlsx and .xls files are allowed');
      return false;
    }

    if (file.size > 10 * 1024 * 1024) {
      setUploadError('File size must be less than 10MB');
      return false;
    }

    return true;
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (validateFile(file)) {
        setSelectedFile(file);
        setUploadError(null);
      }
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setUploadError('Please select a file');
      return;
    }

    try {
      setLoading(true);
      setUploadProgress(0);
      setUploadError(null);

      const formData = new FormData();
      formData.append('file', selectedFile);

      const response = await api.post('/uploads/excel', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setUploadProgress(percentCompleted);
        },
      });

      setUploadSuccess(`Successfully imported ${response.data.records_imported} records`);
      setValidationSummary(response.data.validation_summary);
      setSelectedFile(null);
      setUploadProgress(0);
      fileInputRef.current.value = '';
      fetchUploadHistory();

      setTimeout(() => setUploadSuccess(null), 5000);
    } catch (err) {
      setUploadError(err.response?.data?.detail || 'Upload failed');
      setUploadProgress(0);
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = async (uploadId) => {
    try {
      const response = await api.get(`/uploads/${uploadId}/preview`);
      setPreviewData(response.data.data || []);
      setSelectedUpload(uploadId);
      setPreviewOpen(true);
    } catch (err) {
      setUploadError('Failed to load preview');
    }
  };

  const handleDownloadErrors = async (uploadId) => {
    try {
      const response = await api.get(`/uploads/${uploadId}/errors`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `upload-errors-${uploadId}.csv`);
      document.body.appendChild(link);
      link.click();
      link.parentElement.removeChild(link);
    } catch (err) {
      setUploadError('Failed to download error log');
    }
  };

  const handleDeleteUpload = async (uploadId) => {
    if (window.confirm('Are you sure? This will remove the uploaded records from the database.')) {
      try {
        await api.delete(`/uploads/${uploadId}`);
        fetchUploadHistory();
        setUploadSuccess('Upload deleted successfully');
        setTimeout(() => setUploadSuccess(null), 3000);
      } catch (err) {
        setUploadError(err.response?.data?.detail || 'Failed to delete upload');
      }
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'success':
        return 'success';
      case 'partial':
        return 'warning';
      case 'failed':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <MainLayout darkMode={darkMode} onToggleDarkMode={toggleDarkMode}>
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" sx={{ mb: 3, fontWeight: 600 }}>
          Excel Upload Center
        </Typography>

        {/* Upload Card */}
        <Paper
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          sx={{
            p: 4,
            textAlign: 'center',
            border: isDragActive ? '2px dashed #E60000' : '2px dashed #ccc',
            backgroundColor: isDragActive ? 'rgba(230, 0, 0, 0.05)' : 'transparent',
            transition: 'all 0.3s ease',
            cursor: 'pointer',
            mb: 3,
          }}
        >
          <CloudUploadIcon sx={{ fontSize: 60, color: '#E60000', mb: 2 }} />
          <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
            {selectedFile ? selectedFile.name : 'Drag and drop Excel file here'}
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
            or
          </Typography>
          <Button
            variant="contained"
            sx={{ backgroundColor: '#E60000', mr: 2 }}
            onClick={() => fileInputRef.current?.click()}
          >
            Browse File
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />
          <Typography variant="caption" color="textSecondary" display="block" sx={{ mt: 2 }}>
            Accepted formats: .xlsx, .xls (Max 10MB)
          </Typography>
        </Paper>

        {/* Upload Progress */}
        {selectedFile && uploadProgress > 0 && (
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">Uploading...</Typography>
                <Typography variant="body2">{uploadProgress}%</Typography>
              </Box>
              <LinearProgress variant="determinate" value={uploadProgress} />
            </CardContent>
          </Card>
        )}

        {/* Validation Summary */}
        {validationSummary && (
          <Card sx={{ mb: 3, backgroundColor: '#f5f5f5' }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Validation Summary
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={3}>
                  <Box sx={{ textAlign: 'center', p: 2, backgroundColor: '#e8f5e9', borderRadius: 1 }}>
                    <Typography variant="h6" sx={{ color: '#2e7d32', fontWeight: 600 }}>
                      {validationSummary.total_rows}
                    </Typography>
                    <Typography variant="caption">Total Rows</Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={3}>
                  <Box sx={{ textAlign: 'center', p: 2, backgroundColor: '#e3f2fd', borderRadius: 1 }}>
                    <Typography variant="h6" sx={{ color: '#1565c0', fontWeight: 600 }}>
                      {validationSummary.imported_rows}
                    </Typography>
                    <Typography variant="caption">Imported</Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={3}>
                  <Box sx={{ textAlign: 'center', p: 2, backgroundColor: '#fff3e0', borderRadius: 1 }}>
                    <Typography variant="h6" sx={{ color: '#e65100', fontWeight: 600 }}>
                      {validationSummary.duplicate_rows}
                    </Typography>
                    <Typography variant="caption">Duplicates Skipped</Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={3}>
                  <Box sx={{ textAlign: 'center', p: 2, backgroundColor: '#ffebee', borderRadius: 1 }}>
                    <Typography variant="h6" sx={{ color: '#c62828', fontWeight: 600 }}>
                      {validationSummary.error_rows}
                    </Typography>
                    <Typography variant="caption">Errors</Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        )}

        {/* Alerts */}
        {uploadError && <Alert severity="error" sx={{ mb: 2 }}>{uploadError}</Alert>}
        {uploadSuccess && <Alert severity="success" sx={{ mb: 2 }}>{uploadSuccess}</Alert>}

        {/* Upload Button */}
        {selectedFile && uploadProgress === 0 && (
          <Box sx={{ mb: 3, display: 'flex', gap: 1 }}>
            <Button
              variant="contained"
              sx={{ backgroundColor: '#E60000' }}
              onClick={handleUpload}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Upload File'}
            </Button>
            <Button
              variant="outlined"
              onClick={() => {
                setSelectedFile(null);
                fileInputRef.current.value = '';
              }}
              disabled={loading}
            >
              Cancel
            </Button>
          </Box>
        )}

        {/* Upload History */}
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
          Upload History
        </Typography>

        {loading && uploadHistory.length === 0 ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer component={Paper}>
            <Table>
              <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                <TableRow>
                  <TableCell>Filename</TableCell>
                  <TableCell>Upload Date</TableCell>
                  <TableCell align="center">Records</TableCell>
                  <TableCell align="center">Duplicates</TableCell>
                  <TableCell align="center">Errors</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {uploadHistory.map((upload) => (
                  <TableRow key={upload.id} hover>
                    <TableCell sx={{ fontWeight: 600 }}>{upload.filename}</TableCell>
                    <TableCell>{new Date(upload.upload_date).toLocaleString()}</TableCell>
                    <TableCell align="center">{upload.records_imported}</TableCell>
                    <TableCell align="center">{upload.duplicate_records}</TableCell>
                    <TableCell align="center">{upload.error_count}</TableCell>
                    <TableCell>
                      <Chip
                        label={upload.status}
                        size="small"
                        color={getStatusColor(upload.status)}
                        icon={
                          upload.status === 'success' ? (
                            <CheckCircleIcon />
                          ) : upload.status === 'failed' ? (
                            <ErrorIcon />
                          ) : undefined
                        }
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Preview">
                        <IconButton
                          size="small"
                          onClick={() => handlePreview(upload.id)}
                        >
                          <VisibilityIcon />
                        </IconButton>
                      </Tooltip>
                      {upload.error_count > 0 && (
                        <Tooltip title="Download Errors">
                          <IconButton
                            size="small"
                            onClick={() => handleDownloadErrors(upload.id)}
                          >
                            <DownloadIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                      <Tooltip title="Delete">
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteUpload(upload.id)}
                          sx={{ color: '#E60000' }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* Preview Dialog */}
        <Dialog open={previewOpen} onClose={() => setPreviewOpen(false)} maxWidth="lg" fullWidth>
          <DialogTitle>Import Preview - {selectedUpload}</DialogTitle>
          <DialogContent sx={{ pt: 2 }}>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                    {previewData.length > 0 &&
                      Object.keys(previewData[0]).map((key) => (
                        <TableCell key={key} sx={{ fontWeight: 600 }}>
                          {key}
                        </TableCell>
                      ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {previewData.slice(0, 20).map((row, idx) => (
                    <TableRow key={idx}>
                      {Object.values(row).map((value, cellIdx) => (
                        <TableCell key={cellIdx}>{value}</TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            {previewData.length > 20 && (
              <Typography variant="caption" color="textSecondary" sx={{ mt: 2, display: 'block' }}>
                Showing 20 of {previewData.length} records
              </Typography>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setPreviewOpen(false)}>Close</Button>
          </DialogActions>
        </Dialog>
      </Box>
    </MainLayout>
  );
};

export default ExcelUploadCenter;
