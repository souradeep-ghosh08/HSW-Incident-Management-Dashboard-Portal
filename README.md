# HSW Incident Management Dashboard Portal

A production-ready incident management dashboard for Health, Safety & Wellness (HSW) operations.

## Technology Stack

- **Frontend**: React 19 + Vite + Material UI
- **Backend**: FastAPI (Python 3.12)
- **Database**: PostgreSQL
- **Authentication**: JWT
- **Deployment**: Docker + Docker Compose
- **Charts**: Chart.js
- **Excel Processing**: pandas + openpyxl
- **PDF Reports**: ReportLab

## Project Structure

```
HSW-Incident-Management-Dashboard-Portal/
├── frontend/                 # React frontend application
├── backend/                  # FastAPI backend application
├── database/                 # Database schemas and migrations
├── docker/                   # Docker configuration files
├── docs/                     # Documentation
├── deployment/               # Deployment scripts
└── README.md
```

## Quick Start

### Prerequisites

- Docker & Docker Compose
- Python 3.12+
- Node.js 18+
- PostgreSQL 14+

### Using Docker Compose

```bash
cd docker
docker-compose up -d
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Documentation: http://localhost:8000/docs

### Manual Setup

See [Installation Guide](./docs/INSTALLATION.md) for detailed setup instructions.

## Features

### Authentication & Authorization
- JWT-based authentication
- Role-based access control (RBAC)
- Login, Logout, Forgot Password functionality
- Multiple roles: Super Admin, National HSW, Circle HSW, Vendor Manager, Site Engineer, Read Only

### Dashboard
- KPI Cards with key metrics
- Monthly Incident Trends
- Vendor Performance Analytics
- Circle Performance Analytics
- Recent Incidents Log
- Pending CAPA Status
- Real-time Notifications

### Incident Management
- Track incident types: Near Miss, First Aid, Medical Treatment Case, LTI, Fatality, Property Damage
- Incident workflow management
- Status tracking and assignment

### CAPA (Corrective and Preventive Action)
- Assignment of corrective actions
- Due date management
- Status tracking
- Overdue alerts

### Master Data Management
- Vendor CRUD operations
- Circle CRUD operations

### Reports & Analytics
- Daily, Weekly, Monthly reports
- Vendor-wise reports
- Circle-wise reports
- Excel import/export functionality
- PDF report generation

### Audit Logging
- Track all create, update, delete operations
- Login/logout tracking
- Export action logging

### Email Integration
- Automated report distribution
- Reminder notifications

### User Interface
- Modern Material UI design
- Fully responsive layout
- Dark/Light theme support

## Documentation

- [Installation Guide](./docs/INSTALLATION.md)
- [API Documentation](./docs/API.md)
- [Database Schema](./docs/DATABASE.md)
- [Development Guide](./docs/DEVELOPMENT.md)
- [Deployment Guide](./docs/DEPLOYMENT.md)

## Project Status

This project is currently under active development. See [ROADMAP.md](./docs/ROADMAP.md) for planned features and milestones.

## License

Copyright © 2024. All rights reserved.
