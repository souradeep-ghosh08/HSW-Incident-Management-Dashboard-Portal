import { Card, CardContent, Typography, Box } from '@mui/material';

const KPICard = ({ title, value, color, icon: Icon }) => {
  return (
    <Card
      sx={{
        background: `linear-gradient(135deg, ${color}20 0%, ${color}10 100%)`,
        borderLeft: `4px solid ${color}`,
        transition: 'transform 0.3s, box-shadow 0.3s',
        '&:hover': {
          transform: 'translateY(-5px)',
          boxShadow: 3,
        },
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography color="textSecondary" gutterBottom>
              {title}
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 'bold', color }}>
              {value}
            </Typography>
          </Box>
          {Icon && <Icon sx={{ fontSize: 40, color, opacity: 0.3 }} />}
        </Box>
      </CardContent>
    </Card>
  );
};

export default KPICard;
