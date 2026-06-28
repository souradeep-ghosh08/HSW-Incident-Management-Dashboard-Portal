import { Card, CardContent, Box, Typography } from '@mui/material';
import PropTypes from 'prop-types';

const KPICard = ({ title, value, icon: Icon, color = '#E60000' }) => {
  return (
    <Card
      sx={{
        position: 'relative',
        overflow: 'visible',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
        },
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography color="textSecondary" sx={{ fontSize: 14, mb: 1 }}>
              {title}
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 700, color }}>
              {value}
            </Typography>
          </Box>
          {Icon && (
            <Icon
              sx={{
                fontSize: 40,
                color,
                opacity: 0.3,
              }}
            />
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

KPICard.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  icon: PropTypes.elementType,
  color: PropTypes.string,
};

export default KPICard;
