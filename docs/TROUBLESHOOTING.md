# 🔧 Troubleshooting Guide

## Common Issues and Solutions

### Database Issues

#### Cannot connect to database

**Symptoms:**
- Error: `Can't reach database server`
- Application fails to start

**Solutions:**

1. Check if PostgreSQL is running:
```bash
# Docker
docker-compose ps postgres

# Local
sudo systemctl status postgresql
```

2. Verify DATABASE_URL in `.env`:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/dormitory"
```

3. Test connection:
```bash
# Using psql
psql -h localhost -U postgres -d dormitory

# Using Docker
docker-compose exec postgres psql -U postgres -d dormitory
```

4. Check firewall settings:
```bash
sudo ufw status
sudo ufw allow 5432/tcp
```

#### Migration errors

**Symptoms:**
- Error: `Migration failed`
- Schema out of sync

**Solutions:**

1. Reset database (development only):
```bash
npm run prisma:migrate:reset
```

2. Generate Prisma client:
```bash
npm run prisma:generate
```

3. Deploy migrations:
```bash
npm run prisma:migrate:deploy
```

4. Check migration status:
```bash
npx prisma migrate status
```

---

### Redis Issues

#### Redis connection timeout

**Symptoms:**
- Error: `Redis connection timeout`
- Slow application performance

**Solutions:**

1. Check if Redis is running:
```bash
docker-compose ps redis
redis-cli ping
```

2. Verify REDIS_URL in `.env`:
```env
REDIS_URL="redis://localhost:6379"
```

3. Clear Redis cache:
```bash
redis-cli FLUSHALL
```

4. Restart Redis:
```bash
docker-compose restart redis
```

---

### Authentication Issues

#### JWT token invalid

**Symptoms:**
- Error: `Invalid token`
- Users logged out unexpectedly

**Solutions:**

1. Check JWT_SECRET in `.env`:
```env
JWT_SECRET="your-secret-key-at-least-32-characters"
```

2. Clear browser cookies and localStorage

3. Verify token expiration settings:
```env
JWT_EXPIRES_IN="1h"
JWT_REFRESH_EXPIRES_IN="7d"
```

#### Cannot login

**Symptoms:**
- Login fails with correct credentials
- Error: `Authentication failed`

**Solutions:**

1. Check user exists in database:
```sql
SELECT * FROM users WHERE email = 'user@example.com';
```

2. Reset password:
```bash
# Using Prisma Studio
npm run prisma:studio
```

3. Check password hashing:
```typescript
// Verify bcrypt is working
const bcrypt = require('bcrypt');
const hash = await bcrypt.hash('password', 10);
const match = await bcrypt.compare('password', hash);
console.log(match); // Should be true
```

---

### LINE Integration Issues

#### Webhook not receiving events

**Symptoms:**
- LINE messages not processed
- No webhook events in logs

**Solutions:**

1. Verify webhook URL in LINE Developers Console:
```
https://your-domain.com/api/line/webhook
```

2. Check ngrok (development):
```bash
ngrok http 3001
# Use the HTTPS URL in LINE Console
```

3. Verify LINE credentials in `.env`:
```env
LINE_CHANNEL_ID="your-channel-id"
LINE_CHANNEL_SECRET="your-channel-secret"
LINE_ACCESS_TOKEN="your-access-token"
```

4. Test webhook manually:
```bash
curl -X POST https://your-domain.com/api/line/webhook \
  -H "Content-Type: application/json" \
  -d '{"events":[]}'
```

#### LINE messages not sending

**Symptoms:**
- Notifications not delivered
- Error: `LINE API error`

**Solutions:**

1. Check LINE access token validity

2. Verify LINE user is linked:
```sql
SELECT * FROM line_users WHERE lineUserId = 'U1234567890abcdef';
```

3. Check LINE API quota limits

4. Review LINE webhook logs:
```bash
docker-compose logs backend | grep LINE
```

---

### File Upload Issues

#### Upload fails

**Symptoms:**
- Error: `File upload failed`
- Files not appearing

**Solutions:**

1. Check file size limits:
```typescript
// In middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
```

2. Verify Supabase configuration:
```env
SUPABASE_URL="your-supabase-url"
SUPABASE_ANON_KEY="your-anon-key"
```

3. Check upload directory permissions:
```bash
chmod 755 backend/uploads
```

4. Test Supabase connection:
```typescript
const { data, error } = await supabase.storage.getBucket('uploads');
console.log(data, error);
```

---

### Performance Issues

#### Slow page load

**Symptoms:**
- Pages take >3 seconds to load
- High server CPU usage

**Solutions:**

1. Enable Redis caching:
```typescript
// Cache frequently accessed data
const cached = await redis.get('key');
if (cached) return JSON.parse(cached);
```

2. Optimize database queries:
```typescript
// Add indexes
@@index([email])
@@index([createdAt])
```

3. Enable gzip compression (already in nginx.conf)

4. Optimize images:
```bash
# Use WebP format
# Lazy load images
```

#### High memory usage

**Symptoms:**
- Server running out of memory
- Application crashes

**Solutions:**

1. Check memory usage:
```bash
docker stats
```

2. Increase memory limits in docker-compose:
```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          memory: 2G
```

3. Optimize Prisma queries:
```typescript
// Use select to fetch only needed fields
const users = await prisma.user.findMany({
  select: { id: true, email: true }
});
```

---

### Socket.io Issues

#### Real-time chat not working

**Symptoms:**
- Messages not appearing in real-time
- Socket connection fails

**Solutions:**

1. Check Socket.io connection:
```javascript
// In browser console
socket.connected // Should be true
```

2. Verify CORS settings:
```typescript
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN,
    credentials: true
  }
});
```

3. Check nginx WebSocket proxy:
```nginx
location /socket.io/ {
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
}
```

---

### Docker Issues

#### Container fails to start

**Symptoms:**
- Error: `Container exited with code 1`
- Services not running

**Solutions:**

1. Check logs:
```bash
docker-compose logs backend
```

2. Rebuild images:
```bash
docker-compose build --no-cache
```

3. Remove old containers:
```bash
docker-compose down -v
docker-compose up -d
```

4. Check disk space:
```bash
df -h
docker system prune -a
```

---

### Frontend Issues

#### Page not loading

**Symptoms:**
- Blank page
- Error in browser console

**Solutions:**

1. Check browser console for errors

2. Verify API URL:
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

3. Clear Next.js cache:
```bash
rm -rf .next
npm run build
```

4. Check network requests in DevTools

#### Build fails

**Symptoms:**
- Error during `npm run build`
- TypeScript errors

**Solutions:**

1. Clear node_modules:
```bash
rm -rf node_modules package-lock.json
npm install
```

2. Fix TypeScript errors:
```bash
npm run lint
```

3. Check Next.js version compatibility

---

## Getting Help

If you can't resolve the issue:

1. Check the logs:
```bash
# Backend logs
docker-compose logs backend

# Frontend logs
docker-compose logs frontend

# All logs
docker-compose logs
```

2. Enable debug mode:
```env
NODE_ENV=development
DEBUG=*
```

3. Check health endpoints:
```bash
curl http://localhost:3001/api/health
```

4. Review recent changes:
```bash
git log --oneline -10
```

## Debug Checklist

- [ ] Check all services are running
- [ ] Verify environment variables
- [ ] Review logs for errors
- [ ] Test database connection
- [ ] Test Redis connection
- [ ] Check network connectivity
- [ ] Verify file permissions
- [ ] Check disk space
- [ ] Review recent code changes
- [ ] Test in incognito/private mode
