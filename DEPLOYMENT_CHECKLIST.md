# 🚀 Pre-Deployment Checklist

## ✅ ก่อน Push ขึ้น GitHub

### 1. ตรวจสอบไฟล์ที่ไม่ควร commit
- [ ] ตรวจสอบว่า `.env` ไม่ถูก commit
- [ ] ตรวจสอบว่า `node_modules/` ไม่ถูก commit
- [ ] ตรวจสอบว่า `.next/` ไม่ถูก commit
- [ ] ตรวจสอบว่า `dist/` ไม่ถูก commit

### 2. ตรวจสอบ Environment Files
- [x] มี `backend/.env.example`
- [x] มี `frontend/.env.example`
- [ ] ลบข้อมูล sensitive ออกจาก example files

### 3. ตรวจสอบ Documentation
- [x] README.md มีข้อมูลครบถ้วน
- [x] PORTFOLIO.md พร้อมใช้
- [x] API Documentation
- [x] Deployment Guide

### 4. ตรวจสอบ Code
- [ ] Backend build ผ่าน: `cd backend && npm run build`
- [ ] Frontend build ผ่าน: `cd frontend && npm run build`
- [ ] Tests ผ่าน: `cd backend && npm test`

---

## 🔐 Environment Variables ที่ต้องเตรียม

### สำหรับ Railway (Backend)

```env
# Database (Railway จะสร้างให้อัตโนมัติ)
DATABASE_URL=postgresql://...

# Redis (Railway จะสร้างให้อัตโนมัติ)
REDIS_URL=redis://...

# JWT (สร้าง secret ใหม่)
JWT_SECRET=<สร้าง random string 32+ ตัวอักษร>
JWT_REFRESH_SECRET=<สร้าง random string 32+ ตัวอักษร>

# LINE (copy จาก LINE Developers Console)
LINE_CHANNEL_ID=<your-channel-id>
LINE_CHANNEL_SECRET=<your-channel-secret>
LINE_ACCESS_TOKEN=<your-access-token>

# Supabase (copy จาก Supabase Dashboard)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>

# Server
NODE_ENV=production
PORT=3001

# CORS (จะได้หลัง deploy Vercel)
CORS_ORIGIN=https://your-app.vercel.app
```

### สำหรับ Vercel (Frontend)

```env
# Backend API (จะได้หลัง deploy Railway)
NEXT_PUBLIC_API_URL=https://your-backend.railway.app

# Environment
NODE_ENV=production
```

---

## 📝 ขั้นตอนการ Deploy

### Step 1: Push to GitHub

```bash
# ตรวจสอบ status
git status

# Add files
git add .

# Commit
git commit -m "Ready for deployment

- Complete backend with Express.js + TypeScript
- Complete frontend with Next.js 14
- PostgreSQL database with Prisma
- Real-time chat with Socket.io
- LINE Official Account integration
- 60%+ test coverage
- Production-ready configuration"

# Push to GitHub
git push origin main
```

### Step 2: Deploy Backend to Railway

1. ไปที่ https://railway.app
2. Sign in with GitHub
3. Click "New Project"
4. Select "Deploy from GitHub repo"
5. เลือก repository: `dormitory-management-system`
6. Click "Add variables" → Add PostgreSQL
7. Click "Add variables" → Add Redis
8. ไปที่ Settings:
   - Root Directory: `backend`
   - Build Command: `npm install && npx prisma generate && npm run build`
   - Start Command: `npx prisma migrate deploy && npm start`
9. Add environment variables (ตามรายการด้านบน)
10. Click "Deploy"
11. รอ deploy เสร็จ → Copy URL (เช่น `https://dormitory-backend-production.up.railway.app`)

### Step 3: Deploy Frontend to Vercel

1. ไปที่ https://vercel.com
2. Sign in with GitHub
3. Click "Add New Project"
4. Import repository: `dormitory-management-system`
5. Configure:
   - Framework Preset: Next.js
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `.next`
6. Add environment variables:
   - `NEXT_PUBLIC_API_URL`: <Railway backend URL>
   - `NODE_ENV`: production
7. Click "Deploy"
8. รอ deploy เสร็จ → Copy URL (เช่น `https://dormitory.vercel.app`)

### Step 4: Update CORS

1. กลับไปที่ Railway
2. เพิ่ม/แก้ไข environment variable:
   - `CORS_ORIGIN`: <Vercel frontend URL>
3. Redeploy backend

### Step 5: Setup LINE Webhook

1. ไปที่ LINE Developers Console
2. เลือก channel ของคุณ
3. ไปที่ Messaging API tab
4. Set Webhook URL: `https://your-backend.railway.app/api/line/webhook`
5. Enable "Use webhook"
6. Click "Verify"

### Step 6: Test Everything

- [ ] เปิด frontend URL
- [ ] ทดสอบ login
- [ ] ทดสอบสร้างบิล
- [ ] ทดสอบ upload รูป (Supabase)
- [ ] ทดสอบ chat
- [ ] ทดสอบ LINE notification

---

## 🎯 หลัง Deploy เสร็จ

### อัพเดท README.md

เพิ่ม live demo links:

```markdown
## 🌐 Live Demo

- **Frontend:** https://your-app.vercel.app
- **Backend API:** https://your-backend.railway.app
- **API Health:** https://your-backend.railway.app/api/health

**Test Account:**
- Email: demo@example.com
- Password: demo123
```

### เพิ่ม Badges

```markdown
[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/new/template)
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone)
```

---

## 🐛 Troubleshooting

### Backend ไม่ start

```bash
# ดู logs ใน Railway
# ตรวจสอบว่า migrations ทำงาน
# ตรวจสอบ environment variables
```

### Frontend ไม่เชื่อม Backend

```bash
# ตรวจสอบ NEXT_PUBLIC_API_URL
# ตรวจสอบ CORS_ORIGIN
# ดู Network tab ใน DevTools
```

### LINE Webhook ไม่ทำงาน

```bash
# ตรวจสอบ webhook URL
# ตรวจสอบ LINE credentials
# ดู logs ใน Railway
```

---

## 📊 Monitoring

### Railway
- Logs: Project → Service → Logs
- Metrics: Project → Service → Metrics
- Database: Project → PostgreSQL → Data

### Vercel
- Logs: Project → Deployments → Latest → Logs
- Analytics: Project → Analytics

---

## 💰 Cost Tracking

### Railway
- Dashboard → Usage
- ควรอยู่ที่ ~$5/month (ฟรีจาก credit)

### Vercel
- Dashboard → Usage
- ควรอยู่ใน free tier

---

## ✅ Success Criteria

- [ ] Frontend accessible และ load ได้
- [ ] Backend API responding
- [ ] Database connected
- [ ] Redis working
- [ ] Socket.io connected
- [ ] LINE webhook verified
- [ ] File upload working (Supabase)
- [ ] All features working

---

**พร้อม deploy แล้ว!** 🚀
