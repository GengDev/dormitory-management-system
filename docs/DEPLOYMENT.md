# 🚀 Deployment Guide - Dormitory Management System

## Prerequisites

- Docker & Docker Compose
- Domain name (for production)
- SSL certificates (Let's Encrypt recommended)
- Server with minimum 2GB RAM, 2 CPU cores

## Environment Setup

### 1. Clone Repository

```bash
git clone <repository-url>
cd dormitory
```

### 2. Environment Variables

Copy the example environment file:

```bash
cp env.example .env
```

Edit `.env` and set the following variables:

```env
# Database
POSTGRES_USER=your_db_user
POSTGRES_PASSWORD=your_secure_password
POSTGRES_DB=dormitory
POSTGRES_PORT=5432

# Redis
REDIS_PASSWORD=your_redis_password
REDIS_PORT=6379

# JWT
JWT_SECRET=your_very_long_and_secure_jwt_secret_at_least_32_characters
JWT_REFRESH_SECRET=your_very_long_and_secure_refresh_secret_at_least_32_characters

# LINE Integration
LINE_CHANNEL_ID=your_line_channel_id
LINE_CHANNEL_SECRET=your_line_channel_secret
LINE_ACCESS_TOKEN=your_line_access_token

# Supabase (for file storage)
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# CORS (production)
CORS_ORIGIN=https://your-domain.com

# Frontend
NEXT_PUBLIC_API_URL=https://your-domain.com
```

## Development Deployment

### Using Docker Compose

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Without Docker

#### Backend

```bash
cd backend

# Install dependencies
npm install

# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate:deploy

# Seed database (optional)
npm run prisma:seed

# Start development server
npm run dev
```

#### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

## Production Deployment

### 1. SSL Certificates

#### Using Let's Encrypt (Recommended)

```bash
# Install certbot
sudo apt-get install certbot

# Get certificates
sudo certbot certonly --standalone -d your-domain.com -d www.your-domain.com

# Copy certificates
sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem ./ssl/
sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem ./ssl/
```

### 2. Update nginx.conf

Edit `nginx.conf` and replace `your-domain.com` with your actual domain.

### 3. Build and Deploy

```bash
# Build production images
docker-compose -f docker-compose.prod.yml build

# Start production services
docker-compose -f docker-compose.prod.yml up -d

# View logs
docker-compose -f docker-compose.prod.yml logs -f
```

### 4. Database Migration

```bash
# Run migrations in production
docker-compose -f docker-compose.prod.yml exec backend npm run prisma:migrate:deploy

# Seed database (if needed)
docker-compose -f docker-compose.prod.yml exec backend npm run prisma:seed
```

### 5. Verify Deployment

```bash
# Check health endpoint
curl https://your-domain.com/api/health

# Expected response:
# {
#   "status": "ok",
#   "timestamp": "2024-01-15T00:00:00.000Z",
#   "uptime": 123.456,
#   "environment": "production",
#   "checks": {
#     "database": "healthy",
#     "redis": "healthy"
#   }
# }
```

## Database Backup

### Manual Backup

```bash
# Create backup
docker-compose -f docker-compose.prod.yml exec postgres pg_dump -U $POSTGRES_USER $POSTGRES_DB > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore backup
docker-compose -f docker-compose.prod.yml exec -T postgres psql -U $POSTGRES_USER $POSTGRES_DB < backup_20240115_120000.sql
```

### Automated Backup (Cron)

Create a backup script `/usr/local/bin/backup-dormitory.sh`:

```bash
#!/bin/bash
BACKUP_DIR="/backups/dormitory"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/backup_$DATE.sql"

# Create backup
docker-compose -f /path/to/dormitory/docker-compose.prod.yml exec -T postgres pg_dump -U $POSTGRES_USER $POSTGRES_DB > $BACKUP_FILE

# Compress
gzip $BACKUP_FILE

# Keep only last 30 days
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +30 -delete

echo "Backup completed: $BACKUP_FILE.gz"
```

Add to crontab:

```bash
# Daily backup at 2 AM
0 2 * * * /usr/local/bin/backup-dormitory.sh
```

## Monitoring

### Health Checks

```bash
# Health check
curl https://your-domain.com/api/health

# Readiness check
curl https://your-domain.com/api/health/ready

# Liveness check
curl https://your-domain.com/api/health/live

# Metrics
curl https://your-domain.com/api/health/metrics
```

### Logs

```bash
# View all logs
docker-compose -f docker-compose.prod.yml logs -f

# View specific service logs
docker-compose -f docker-compose.prod.yml logs -f backend
docker-compose -f docker-compose.prod.yml logs -f frontend
docker-compose -f docker-compose.prod.yml logs -f postgres
```

## Scaling

### Horizontal Scaling

Update `docker-compose.prod.yml`:

```yaml
backend:
  deploy:
    replicas: 3
    resources:
      limits:
        cpus: '1'
        memory: 1G
```

### Load Balancing

Update `nginx.conf`:

```nginx
upstream backend {
    least_conn;
    server backend_1:3001;
    server backend_2:3001;
    server backend_3:3001;
}
```

## Troubleshooting

### Database Connection Issues

```bash
# Check database status
docker-compose -f docker-compose.prod.yml exec postgres pg_isready

# Check database logs
docker-compose -f docker-compose.prod.yml logs postgres
```

### Redis Connection Issues

```bash
# Check Redis status
docker-compose -f docker-compose.prod.yml exec redis redis-cli ping

# Check Redis logs
docker-compose -f docker-compose.prod.yml logs redis
```

### Application Errors

```bash
# Check backend logs
docker-compose -f docker-compose.prod.yml logs backend

# Check frontend logs
docker-compose -f docker-compose.prod.yml logs frontend

# Restart services
docker-compose -f docker-compose.prod.yml restart backend frontend
```

## Security Checklist

- [ ] Change all default passwords
- [ ] Use strong JWT secrets (minimum 32 characters)
- [ ] Enable SSL/TLS
- [ ] Configure firewall (allow only 80, 443)
- [ ] Set up automated backups
- [ ] Enable rate limiting
- [ ] Configure CORS properly
- [ ] Keep dependencies updated
- [ ] Monitor logs regularly
- [ ] Set up error tracking (Sentry)

## Updates and Maintenance

### Update Application

```bash
# Pull latest changes
git pull origin main

# Rebuild images
docker-compose -f docker-compose.prod.yml build

# Restart services
docker-compose -f docker-compose.prod.yml up -d

# Run migrations
docker-compose -f docker-compose.prod.yml exec backend npm run prisma:migrate:deploy
```

### Update Dependencies

```bash
# Backend
cd backend
npm update
npm audit fix

# Frontend
cd frontend
npm update
npm audit fix
```

## Support

For issues and questions, please refer to:
- [README.md](./README.md)
- [TROUBLESHOOTING.md](./docs/TROUBLESHOOTING.md)
- [API Documentation](./docs/API.md)
