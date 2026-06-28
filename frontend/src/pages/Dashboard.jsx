import { Box, Grid, Paper, Typography, Card, CardContent } from '@mui/material';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useEffect, useState } from 'react';
import api from '../services/api';
import KPICard from '../components/KPICard';
import MainLayout from '../components/MainLayout';
import WarningIcon from '@mui/icons-material/Warning';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import PersonIcon from '@mui/icons-material/Person';
import BuildIcon from '@mui/icons-material/Build';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';

const COLORS = ['#E60000', '#4A148C', '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A'];

const Dashboard = ({ darkMode, toggleDarkMode }) => {
  const [kpis, setKpis] = useState(null);
  const [trends, setTrends] = useState([]);
  const [recentIncidents, setRecentIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [kpiRes, trendsRes, incidentsRes] = await Promise.all([
          api.get('/dashboard/kpis'),
          api.get('/dashboard/incident-trends'),
          api.get('/dashboard/recent-incidents')
        ]);
        setKpis(kpiRes.data);
        setTrends(trendsRes.data);
        setRecentIncidents(incidentsRes.data);
      } catch (err) {
        setError(err.response?.data?.detail || 'Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <MainLayout darkMode={darkMode} onToggleDarkMode={toggleDarkMode}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <Typography>Loading...</Typography>
        </Box>
      </MainLayout>
    );
  }

  const vendorPerformanceData = [
    { name: 'Vendor A', incidents: 12, capa: 8 },
    { name: 'Vendor B', incidents: 8, capa: 5 },
    { name: 'Vendor C', incidents: 15, capa: 10 },
  ];

  const incidentCategoryData = [
    { name: 'Near Miss', value: kpis?.near_miss_count || 0 },
    { name: 'First Aid', value: kpis?.first_aid_count || 0 },
    { name: 'Medical', value: kpis?.medical_treatment_count || 0 },
    { name: 'LTI', value: kpis?.lti_count || 0 },
    { name: 'Fatality', value: kpis?.fatality_count || 0 },
  ];

  return (
    <MainLayout darkMode={darkMode} onToggleDarkMode={toggleDarkMode}>
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" sx={{ mb: 3, fontWeight: 600 }}>Dashboard</Typography>

        {/* KPI Cards */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <KPICard
              title="Total Incidents"
              value={kpis?.total_incidents || 0}
              icon={WarningIcon}
              color="#E60000"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <KPICard
              title="Near Miss"
              value={kpis?.near_miss_count || 0}
              icon={WarningIcon}
              color="#FF9800"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <KPICard
              title="First Aid"
              value={kpis?.first_aid_count || 0}
              icon={LocalHospitalIcon}
              color="#2196F3"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <KPICard
              title="LTI"
              value={kpis?.lti_count || 0}
              icon={PersonIcon}
              color="#F44336"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <KPICard
              title="Pending CAPA"
              value={kpis?.pending_capa || 0}
              icon={BuildIcon}
              color="#4A148C"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <KPICard
              title="Overdue CAPA"
              value={kpis?.overdue_capa || 0}
              icon={TrendingUpIcon}
              color="#D32F2F"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <KPICard
              title="LTIR"
              value={(kpis?.ltir || 0).toFixed(2)}
              icon={TrendingUpIcon}
              color="#388E3C"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <KPICard
              title="TRIR"
              value={(kpis?.trir || 0).toFixed(2)}
              icon={TrendingUpIcon}
              color="#1976D2"
            />
          </Grid>
        </Grid>

        {/* Charts */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>Monthly Incident Trends</Typography>
              {trends.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={trends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="incidents" stroke="#E60000" strokeWidth={2} />
                    <Line type="monotone" dataKey="capa" stroke="#4A148C" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Typography color="textSecondary">No data available</Typography>
                </Box>
              )}
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>Vendor Performance</Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={vendorPerformanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="incidents" fill="#E60000" />
                  <Bar dataKey="capa" fill="#4A148C" />
                </BarChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>Incident Category Distribution</Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={incidentCategoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {incidentCategoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>Recent Incidents</Typography>
              <Box sx={{ maxHeight: 300, overflowY: 'auto' }}>
                {recentIncidents.length > 0 ? (
                  recentIncidents.map((incident) => (
                    <Card key={incident.id} sx={{ mb: 1 }}>
                      <CardContent sx={{ py: 1, px: 2 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                          {incident.incident_number}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          {incident.title}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                          <Typography variant="caption" sx={{ backgroundColor: '#f0f0f0', px: 1, py: 0.5, borderRadius: 1 }}>
                            {incident.incident_type}
                          </Typography>
                          <Typography variant="caption" sx={{ backgroundColor: '#e0e0e0', px: 1, py: 0.5, borderRadius: 1 }}>
                            {incident.status}
                          </Typography>
                        </Box>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <Typography color="textSecondary">No recent incidents</Typography>
                )}
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </MainLayout>
  );
};

export default Dashboard;
