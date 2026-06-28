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

const vendorSchema = yup.object().shape({
  code: yup.string().required('Code is required'),
  name: yup.string().required('Name is required').min(2),
  email: yup.string().email(),
  phone: yup.string(),
});

const VendorManagement = ({ darkMode, toggleDarkMode }) => {
  const [vendors, setVendors] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedVendor, setSelectedVendor] = useState(null);

  const { control, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: yupResolver(vendorSchema),
  });

  const fetchVendors = async (pageNum = 0) => {
    try {
      setLoading(true);
      const response = await api.get('/vendors/', {
        params: {
          page: pageNum + 1,
          page_size: rowsPerPage,
          search: search,
        },
      });
      setVendors(response.data.data);
      setTotal(response.data.total);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load vendors');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendors(0);
  }, [search]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
    fetchVendors(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const onSubmit = async (data) => {
    try {
      if (editingId) {
        await api.put(`/vendors/${editingId}`, data);
      } else {
        await api.post('/vendors/', data);
      }
      setOpenDialog(false);
      reset();
      setEditingId(null);
      fetchVendors(page);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save vendor');
    }
  };

  const handleEdit = (vendor) => {
    setEditingId(vendor.id);
    reset(vendor);
    setOpenDialog(true);
    setAnchorEl(null);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure?')) {
      try {
        await api.delete(`/vendors/${id}`);
        fetchVendors(page);
      } catch (err) {
        setError(err.response?.data?.detail || 'Failed to delete vendor');
      }
    }
    setAnchorEl(null);
  };

  return (
    <MainLayout darkMode={darkMode} onToggleDarkMode={toggleDarkMode}>
      <Box sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <TextField
            placeholder="Search vendors..."
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
            Add Vendor
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
                  <TableCell>Email</TableCell>
                  <TableCell>Phone</TableCell>
                  <TableCell>City</TableCell>
                  <TableCell>State</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {vendors.map((vendor) => (
                  <TableRow key={vendor.id} hover>
                    <TableCell sx={{ fontWeight: 600 }}>{vendor.code}</TableCell>
                    <TableCell>{vendor.name}</TableCell>
                    <TableCell>{vendor.email || '-'}</TableCell>
                    <TableCell>{vendor.phone || '-'}</TableCell>
                    <TableCell>{vendor.city || '-'}</TableCell>
                    <TableCell>{vendor.state || '-'}</TableCell>
                    <TableCell align="right">
                      <IconButton size="small" onClick={(e) => { setAnchorEl(e.currentTarget); setSelectedVendor(vendor); }}>
                        <MoreVertIcon />
                      </IconButton>
                      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
                        <MenuItem onClick={() => handleEdit(selectedVendor)}><EditIcon sx={{ mr: 1 }} /> Edit</MenuItem>
                        <MenuItem onClick={() => handleDelete(selectedVendor.id)}><DeleteIcon sx={{ mr: 1 }} /> Delete</MenuItem>
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
          <DialogTitle>{editingId ? 'Edit Vendor' : 'Add Vendor'}</DialogTitle>
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
                name="email"
                control={control}
                render={({ field }) => (
                  <TextField
                    label="Email"
                    fullWidth
                    type="email"
                    error={!!errors.email}
                    helperText={errors.email?.message}
                    {...field}
                  />
                )}
              />
              <Controller
                name="phone"
                control={control}
                render={({ field }) => (
                  <TextField
                    label="Phone"
                    fullWidth
                    {...field}
                  />
                )}
              />
              <Controller
                name="city"
                control={control}
                render={({ field }) => (
                  <TextField
                    label="City"
                    fullWidth
                    {...field}
                  />
                )}
              />
              <Controller
                name="state"
                control={control}
                render={({ field }) => (
                  <TextField
                    label="State"
                    fullWidth
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

export default VendorManagement;
