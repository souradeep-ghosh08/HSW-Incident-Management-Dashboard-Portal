import { Box, Paper, Button, TextField, Dialog, DialogTitle, DialogContent, DialogActions, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TablePagination, CircularProgress, Alert, Chip, IconButton, Menu, MenuItem } from '@mui/material';
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

const incidentSchema = yup.object().shape({
  circle_id: yup.string().required('Circle is required'),
  vendor_id: yup.string(),
  incident_type: yup.string().required('Incident type is required'),
  title: yup.string().required('Title is required').min(3),
  description: yup.string().required('Description is required').min(10),
  location: yup.string(),
  severity: yup.string(),
});

const IncidentManagement = ({ darkMode, toggleDarkMode }) => {
  const [incidents, setIncidents] = useState([]);
  const [circles, setCircles] = useState([]);
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
  const [selectedIncident, setSelectedIncident] = useState(null);

  const { control, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: yupResolver(incidentSchema),
  });

  const fetchIncidents = async (pageNum = 0) => {
    try {
      setLoading(true);
      const response = await api.get('/incidents/', {
        params: {
          page: pageNum + 1,
          page_size: rowsPerPage,
          search: search,
        },
      });
      setIncidents(response.data.data);
      setTotal(response.data.total);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load incidents');
    } finally {
      setLoading(false);
    }
  };

  const fetchCircles = async () => {
    try {
      const response = await api.get('/circles/', { params: { page_size: 100 } });
      setCircles(response.data.data);
    } catch (err) {
      console.error('Failed to load circles');
    }
  };

  const fetchVendors = async () => {
    try {
      const response = await api.get('/vendors/', { params: { page_size: 100 } });
      setVendors(response.data.data);
    } catch (err) {
      console.error('Failed to load vendors');
    }
  };

  useEffect(() => {
    fetchIncidents(0);
    fetchCircles();
    fetchVendors();
  }, [search]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
    fetchIncidents(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const onSubmit = async (data) => {
    try {
      if (editingId) {
        await api.put(`/incidents/${editingId}`, data);
      } else {
        await api.post('/incidents/', data);
      }
      setOpenDialog(false);
      reset();
      setEditingId(null);
      fetchIncidents(page);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save incident');
    }
  };

  const handleEdit = (incident) => {
    setEditingId(incident.id);
    reset(incident);
    setOpenDialog(true);
    setAnchorEl(null);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure?')) {
      try {
        await api.delete(`/incidents/${id}`);
        fetchIncidents(page);
      } catch (err) {
        setError(err.response?.data?.detail || 'Failed to delete incident');
      }
    }
    setAnchorEl(null);
  };

  return (
    <MainLayout darkMode={darkMode} onToggleDarkMode={toggleDarkMode}>
      <Box sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <TextField
              placeholder="Search incidents..."
              size="small"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              sx={{ minWidth: 300 }}
            />
          </Box>
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
            Add Incident
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
                  <TableCell>Incident #</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Title</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Severity</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {incidents.map((incident) => (
                  <TableRow key={incident.id} hover>
                    <TableCell sx={{ fontWeight: 600 }}>{incident.incident_number}</TableCell>
                    <TableCell>{incident.incident_type}</TableCell>
                    <TableCell>{incident.title}</TableCell>
                    <TableCell>
                      <Chip label={incident.status} size="small" color={incident.status === 'closed' ? 'success' : 'default'} />
                    </TableCell>
                    <TableCell>{incident.severity || '-'}</TableCell>
                    <TableCell>{new Date(incident.incident_date).toLocaleDateString()}</TableCell>
                    <TableCell align="right">
                      <IconButton size="small" onClick={(e) => { setAnchorEl(e.currentTarget); setSelectedIncident(incident); }}>
                        <MoreVertIcon />
                      </IconButton>
                      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
                        <MenuItem onClick={() => handleEdit(selectedIncident)}><EditIcon sx={{ mr: 1 }} /> Edit</MenuItem>
                        <MenuItem onClick={() => handleDelete(selectedIncident.id)}><DeleteIcon sx={{ mr: 1 }} /> Delete</MenuItem>
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
          <DialogTitle>{editingId ? 'Edit Incident' : 'Add Incident'}</DialogTitle>
          <DialogContent sx={{ pt: 2 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Controller
                name="circle_id"
                control={control}
                render={({ field }) => (
                  <TextField
                    select
                    label="Circle"
                    fullWidth
                    error={!!errors.circle_id}
                    helperText={errors.circle_id?.message}
                    {...field}
                  >
                    {circles.map((circle) => (
                      <MenuItem key={circle.id} value={circle.id}>{circle.name}</MenuItem>
                    ))}
                  </TextField>
                )}
              />
              <Controller
                name="vendor_id"
                control={control}
                render={({ field }) => (
                  <TextField
                    select
                    label="Vendor"
                    fullWidth
                    {...field}
                  >
                    <MenuItem value="">None</MenuItem>
                    {vendors.map((vendor) => (
                      <MenuItem key={vendor.id} value={vendor.id}>{vendor.name}</MenuItem>
                    ))}
                  </TextField>
                )}
              />
              <Controller
                name="incident_type"
                control={control}
                render={({ field }) => (
                  <TextField
                    select
                    label="Incident Type"
                    fullWidth
                    error={!!errors.incident_type}
                    helperText={errors.incident_type?.message}
                    {...field}
                  >
                    <MenuItem value="near_miss">Near Miss</MenuItem>
                    <MenuItem value="first_aid">First Aid</MenuItem>
                    <MenuItem value="medical_treatment_case">Medical Treatment</MenuItem>
                    <MenuItem value="lti">LTI</MenuItem>
                    <MenuItem value="fatality">Fatality</MenuItem>
                    <MenuItem value="property_damage">Property Damage</MenuItem>
                  </TextField>
                )}
              />
              <Controller
                name="title"
                control={control}
                render={({ field }) => (
                  <TextField
                    label="Title"
                    fullWidth
                    error={!!errors.title}
                    helperText={errors.title?.message}
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
                    rows={4}
                    error={!!errors.description}
                    helperText={errors.description?.message}
                    {...field}
                  />
                )}
              />
              <Controller
                name="severity"
                control={control}
                render={({ field }) => (
                  <TextField
                    select
                    label="Severity"
                    fullWidth
                    {...field}
                  >
                    <MenuItem value="low">Low</MenuItem>
                    <MenuItem value="medium">Medium</MenuItem>
                    <MenuItem value="high">High</MenuItem>
                    <MenuItem value="critical">Critical</MenuItem>
                  </TextField>
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

export default IncidentManagement;
