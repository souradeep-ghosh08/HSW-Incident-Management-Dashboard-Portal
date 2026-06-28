import { Box, Paper, Button, TextField, Dialog, DialogTitle, DialogContent, DialogActions, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TablePagination, CircularProgress, Alert, IconButton, Menu, MenuItem } from '@mui/material';
import { useState, useEffect } from 'react';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import MainLayout from '../components/MainLayout';
import api from '../services/api';
import { useForm, Controller } from 'react-hook-form';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';

const circleSchema = yup.object().shape({
  code: yup.string().required('Code is required'),
  name: yup.string().required('Name is required').min(2),
  location: yup.string(),
});

const CircleManagement = ({ darkMode, toggleDarkMode }) => {
  const [circles, setCircles] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedCircle, setSelectedCircle] = useState(null);

  const { control, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: yupResolver(circleSchema),
  });

  const fetchCircles = async (pageNum = 0) => {
    try {
      setLoading(true);
      const response = await api.get('/circles/', {
        params: {
          page: pageNum + 1,
          page_size: rowsPerPage,
          search: search,
        },
      });
      setCircles(response.data.data);
      setTotal(response.data.total);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load circles');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCircles(0);
  }, [search]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
    fetchCircles(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const onSubmit = async (data) => {
    try {
      if (editingId) {
        await api.put(`/circles/${editingId}`, data);
      } else {
        await api.post('/circles/', data);
      }
      setOpenDialog(false);
      reset();
      setEditingId(null);
      fetchCircles(page);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save circle');
    }
  };

  const handleEdit = (circle) => {
    setEditingId(circle.id);
    reset(circle);
    setOpenDialog(true);
    setAnchorEl(null);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure?')) {
      try {
        await api.delete(`/circles/${id}`);
        fetchCircles(page);
      } catch (err) {
        setError(err.response?.data?.detail || 'Failed to delete circle');
      }
    }
    setAnchorEl(null);
  };

  return (
    <MainLayout darkMode={darkMode} onToggleDarkMode={toggleDarkMode}>
      <Box sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <TextField
            placeholder="Search circles..."
            size="small"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ minWidth: 300 }}
          />
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => {
              setEditingId(null);
              reset();
              setOpenDialog(true);
            }}
            sx={{ backgroundColor: '#E60000' }}
          >
            Add Circle
          </Button>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer component={Paper}>
            <Table>
              <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                <TableRow>
                  <TableCell>Code</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Location</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {circles.map((circle) => (
                  <TableRow key={circle.id} hover>
                    <TableCell sx={{ fontWeight: 600 }}>{circle.code}</TableCell>
                    <TableCell>{circle.name}</TableCell>
                    <TableCell>{circle.location || '-'}</TableCell>
                    <TableCell>{circle.is_active ? 'Active' : 'Inactive'}</TableCell>
                    <TableCell align="right">
                      <IconButton size="small" onClick={(e) => { setAnchorEl(e.currentTarget); setSelectedCircle(circle); }}>
                        <MoreVertIcon />
                      </IconButton>
                      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
                        <MenuItem onClick={() => handleEdit(selectedCircle)}><EditIcon sx={{ mr: 1 }} /> Edit</MenuItem>
                        <MenuItem onClick={() => handleDelete(selectedCircle.id)}><DeleteIcon sx={{ mr: 1 }} /> Delete</MenuItem>
                      </Menu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={total}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </TableContainer>
        )}

        <Dialog open={openDialog} onClose={() => { setOpenDialog(false); setEditingId(null); }} maxWidth="sm" fullWidth>
          <DialogTitle>{editingId ? 'Edit Circle' : 'Add Circle'}</DialogTitle>
          <DialogContent sx={{ pt: 2 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Controller
                name="code"
                control={control}
                render={({ field }) => (
                  <TextField
                    label="Code"
                    fullWidth
                    disabled={!!editingId}
                    error={!!errors.code}
                    helperText={errors.code?.message}
                    {...field}
                  />
                )}
              />
              <Controller
                name="name"
                control={control}
                render={({ field }) => (
                  <TextField
                    label="Name"
                    fullWidth
                    error={!!errors.name}
                    helperText={errors.name?.message}
                    {...field}
                  />
                )}
              />
              <Controller
                name="location"
                control={control}
                render={({ field }) => (
                  <TextField
                    label="Location"
                    fullWidth
                    {...field}
                  />
                )}
              />
              <Controller
                name="description"
                control={control}
                render={({ field }) => (
                  <TextField
                    label="Description"
                    fullWidth
                    multiline
                    rows={3}
                    {...field}
                  />
                )}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => { setOpenDialog(false); setEditingId(null); }}>Cancel</Button>
            <Button onClick={handleSubmit(onSubmit)} variant="contained" sx={{ backgroundColor: '#E60000' }}>
              {editingId ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </MainLayout>
  );
};

export default CircleManagement;
