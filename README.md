# 🏠 ระบบจัดการหอพัก (Dormitory Management System)

> แพลตฟอร์มบริหารจัดการหอพักแบบครบวงจร พร้อมระบบแชท Real-time, เชื่อมต่อ LINE OA, และระบบจัดการบิลอัตโนมัติ

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![Express](https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://www.prisma.io/)

---

## 📋 สารบัญ

- [ภาพรวมโปรเจค](#-ภาพรวมโปรเจค)
- [ฟีเจอร์หลัก](#-ฟีเจอร์หลัก)
- [เทคโนโลยีที่ใช้](#-เทคโนโลยีที่ใช้)
- [สถาปัตยกรรมระบบ](#-สถาปัตยกรรมระบบ)
- [รูปตัวอย่าง](#-รูปตัวอย่าง)
- [เริ่มต้นใช้งาน](#-เริ่มต้นใช้งาน)
- [จุดเด่นของโปรเจค](#-จุดเด่นของโปรเจค)
- [การทดสอบ (Testing)](#-การทดสอบ-testing)
- [เอกสารประกอบ](#-เอกสารประกอบ)
- [การ Deploy](#-การ-deploy)
- [สิ่งที่ได้เรียนรู้](#-สิ่งที่ได้เรียนรู้)

---

## 🎯 ภาพรวมโปรเจค

ระบบจัดการหอพักระดับ Production-ready ที่ออกแบบมาเพื่อช่วยลดภาระของผู้ดูแล (Admin) และเพิ่มความสะดวกสบายให้กับผู้เช่า (Tenant) ระบบครอบคลุมตั้งแตการจัดการสัญญาเช่า, การคำนวณบิลค่าน้ำ-ค่าไฟอัตโนมัติ, ระบบแจ้งซ่อม, ไปจนถึงการสื่อสารผ่าน Real-time Chat และ LINE Official Account

**สถานะโปรเจค:** ✅ เสร็จสมบูรณ์ (Production-Ready)

**Live Demo:**
- **Frontend (ผู้ใช้งาน):** [https://dormitory-management-frontend.vercel.app](https://dormitory-management-frontend.vercel.app)
- **Backend API:** [https://dormitory-management-system-production.up.railway.app](https://dormitory-management-system-production.up.railway.app)


---

## ✨ ฟีเจอร์หลัก

### สำหรับผู้ดูแลระบบ (Admin)
- 📊 **Dashboard & Analytics** - ดูภาพรวมหอพัก, อัตราการเข้าพัก, และรายรับ-รายจ่ายแบบ Real-time
- 🏢 **จัดการอาคารและห้องพัก** - รองรับหลายอาคาร, ตั้งค่าประเภทห้อง, และราคาค่าเช่า
- 👥 **จัดการผู้เช่า** - บันทึกข้อมูลสัญญาเช่า, วันย้ายเข้า-ออก, และสถานะการเช่า
- 💰 **ระบบบิลอัจฉริยะ** - สร้างบิลรายเดือนอัตโนมัติ พร้อมคำนวณค่าน้ำ-ไฟตามมิเตอร์
- 💳 **ตรวจสอบการโอนเงิน** - ตรวจสลิปโอนเงินที่ผู้เช่าแนบมา และอนุมัติผ่านระบบ
- 🔧 **จัดการแจ้งซ่อม** - รับเรื่องแจ้งซ่อม, อัพเดทสถานะ, และบันทึกค่าใช้จ่าย
- 📈 **รายงานสรุป** - Export รายงานการเงินและสถานะหอพักได้

### สำหรับผู้เช่า (Tenant)
- 📱 **เชื่อมต่อ LINE OA** - รับบิล, การแจ้งเตือนข่าวสาร, และคุยกับผู้ดูแลผ่าน LINE ได้ทันที
- 💵 **จ่ายบิลออนไลน์** - ดูรายละเอียดค่าใช้จ่ายและแนบสลิปโอนเงินผ่านเว็บได้เลย
- 🛠️ **แจ้งซ่อมออนไลน์** - ถ่ายรูปจุดที่เสียหายและแจ้งซ่อม พร้อมติดตามสถานะงาน
- 💬 **แชทส่วนตัว** - ติดต่อผู้ดูแลหอพักได้ผ่านระบบแชท Real-time
- 📊 **ประวัติการชำระเงิน** - ดูบิลย้อนหลังและประวัติการแจ้งซ่อมของตัวเองได้ครบถ้วน

### ฟีเจอร์เชิงเทคนิค
- 🔐 **ความปลอดภัยสูง** - ยืนยันตัวตนด้วย JWT (Access/Refresh Token) และ Role-based Access Control
- ⚡ **Real-time Updates** - ใช้ Socket.io อัพเดทแจ้งเตือนและแชททันทีโดยไม่ต้องรีหน้าเว็บ
- 🤖 **ระบบอัตโนมัติ** - มี Cron Jobs ช่วยสร้างบิลและส่งแจ้งเตือนตามรอบเดือนที่กำหนด
- 📧 **แจ้งเตือนครบวงจร** - รองรับทั้ง Notification ภายในเว็บ, Email, และ LINE
- 🧪 **มี Test Coverage สูง** - ผ่านการทดสอบด้วย Unit Test และ Integration Test (60%+)
- 📱 **รองรับมือถือ** - หน้าเว็บออกแบบมาให้ใช้งานง่ายบนทุกอุปกรณ์ (Responsive Design)

---

## 🛠️ เทคโนโลยีที่ใช้

### Frontend
- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **State Management:** Zustand
- **Real-time:** Socket.io Client
- **Forms:** React Hook Form + Zod
- **Charts:** Recharts (สำหรับกราฟ)

### Backend
- **Framework:** Express.js
- **Language:** TypeScript
- **Database:** PostgreSQL 14
- **ORM:** Prisma
- **Cache:** Redis (สำหรับ Queue และ Caching)
- **Queue:** Bull (จัดการ Background Jobs)
- **Real-time:** Socket.io Server
- **Authentication:** JWT (JSON Web Token)
- **File Storage:** Supabase Storage
- **Logging:** Winston

### DevOps & Tools
- **Testing:** Jest, Supertest
- **Linting:** ESLint, Prettier
- **Version Control:** Git
- **Deployment:** Railway (Backend/DB) + Vercel (Frontend)

---

## 🏗️ สถาปัตยกรรมระบบ

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend (Next.js)                   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │  Admin   │  │  Tenant  │  │  Public  │  │   Chat   │   │
│  │Dashboard │  │Dashboard │  │  Pages   │  │  System  │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ↕ HTTP/WebSocket
┌─────────────────────────────────────────────────────────────┐
│                    Backend (Express.js)                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │   API    │  │  Socket  │  │   Jobs   │  │   LINE   │   │
│  │ Routes   │  │ Gateway  │  │  Queue   │  │ Webhook  │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│              Data Layer                                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                 │
│  │PostgreSQL│  │  Redis   │  │ Supabase │                 │
│  │ Database │  │  Cache   │  │ Storage  │                 │
│  └──────────┘  └──────────┘  └──────────┘                 │
└─────────────────────────────────────────────────────────────┘
```

---

## 📸 รูปตัวอย่าง

### Admin Dashboard
![Admin Dashboard](./screenshots/admin-dashboard.png)
*หน้าแดชบอร์ดแสดงภาพรวมหอพักรายได้และการเข้าพัก*

### การจัดการบิล (Bill Management)
![Bill Management](./screenshots/bill-management.png)
*ระบบสร้างและจัดการบิลรายเดือน พร้อมคำนวณค่าน้ำ-ไฟ*

### หน้าผู้เช่า (Tenant Dashboard)
![Tenant Dashboard](./screenshots/tenant-dashboard.png)
*หน้าแรกสำหรับผู้เช่า ดูยอดกค้างชำระและเมนูลัดต่างๆ*

### การเชื่อมต่อ LINE (LINE Integration)
![LINE Integration](./screenshots/line-integration.png)
*การแจ้งเตือนบิลผ่าน LINE Official Account*

---

## 🚀 เริ่มต้นใช้งาน

### สิ่งที่ต้องมี (Prerequisites)
- Node.js 18 ขึ้นไป
- PostgreSQL 14 ขึ้นไป (หรือใช้ Docker)
- Redis 6 ขึ้นไป (หรือใช้ Docker)

### การติดตั้ง (Installation)

```bash
# Clone repository
git clone https://github.com/yourusername/dormitory-management-system.git
cd dormitory-management-system

# Install dependencies
npm install
cd backend && npm install
cd ../frontend && npm install
cd ..

# ตั้งค่า Environment Variables
cp .env.example .env
# แก้ไขไฟล์ .env ใส่ค่า Database, Redis, LINE API ของคุณ
```

### การตั้งค่า Database

```bash
cd backend

# สร้าง Prisma client
npm run prisma:generate

# รัน Migration เพื่อสร้างตารางใน Database
npm run prisma:migrate:deploy

# จำลองข้อมูลตัวอย่าง (Optional)
npm run prisma:seed
```

### รันโปรแกรม (Run Application)

```bash
# Terminal 1: รัน Backend
cd backend
npm run dev

# Terminal 2: รัน Frontend
cd frontend
npm run dev
```

**เข้าใช้งานได้ที่:**
- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:3001`
- Prisma Studio (ดูข้อมูลใน DB): `npm run prisma:studio`

👉 ดูวิธีติดตั้งแบบละเอียดสำหรับการ Deploy ได้ที่ [คู่มือการ Deploy](./docs/DEPLOY_RAILWAY_VERCEL.md)

---

## 🌟 จุดเด่นของโปรเจค

### โปรเจคนี้โดดเด่นอย่างไร?

1. **สถาปัตยกรรมระดับ Production**
   - มีการจัดการ Error Handling ที่ครอบคลุม
   - ใช้ Security Best Practices (CSRF, Rate Limiting, Sanitization)
   - มี Health Check และ Monitoring endpoints 
   - รองรับ Graceful Shutdown เมื่อเกิดข้อผิดพลาด

2. **ตอบโจทย์ธุรกิจจริง (Business Logic Completeness)**
   - ระบบคำนวณบิลที่ซับซ้อน รองรับทั้งแบบเหมาจ่ายและตามมิเตอร์
   - Workflow การตรวจสอบสลิปโอนเงินที่รัดกุม 
   - ระบบสร้างบิลอัตโนมัติช่วยลดงาน Admin ได้จริง

3. **ฟีเจอร์ระดับสูง (Advanced Features)**
   - ระบบแชท Real-time ด้วย Socket.io ที่เสถียร
   - เชื่อมต่อ LINE Messaging API ได้สมบูรณ์แบบ (Push Message/Webhook)
   - ใช้ Background Job (Bull Queue) จัดการงานหนักๆ ไม่ให้เซิร์ฟเวอร์ค้าง

4. **คุณภาพของโค้ด (Code Quality)**
   - เขียน Test ด้วย Jest ครอบคลุมกว่า 60%
   - ใช้ TypeScript 100% เพิ่มความเสถียรลดบั๊ก
   - มีเอกสาร API Documentation ครบถ้วน

---

## 🧪 การทดสอบ (Testing)

```bash
# รัน Test ของ Backend
cd backend
npm test

# รันเช็ค Test Coverage
npm run test:cov

# รันเฉพาะไฟล์ที่ต้องการ
npm test -- auth.test.ts
```

**Test Coverage ปัจจุบัน:**
- Authentication: 85%
- Bill Management: 75%
- LINE Integration: 65%
- Chat System: 70%

---

## 📚 เอกสารประกอบ (Documentation)

เรามีคู่มือภาษาไทยและอังกฤษครบถ้วน:

- **[คู่มือการ Deploy (Deployment Guide)](./docs/DEPLOY_RAILWAY_VERCEL.md)** - วิธีนำขึ้น Railway + Vercel
- **[คู่มือแก้ปัญหา (Troubleshooting)](./docs/TROUBLESHOOTING.md)** - รวมวิธีแก้ Error ฮิตๆ ที่พบบ่อย
- **[คู่มือผู้ดูแลระบบ (Admin Manual)](./docs/USER_MANUAL_ADMIN.md)** - สอนการใช้งานระบบหลังบ้านทั้งหมด
- **[คู่มือผู้เช่า (Tenant Manual)](./docs/USER_MANUAL_TENANT.md)** - สอนการใช้งานสำหรับผู้เช่า
- **[API Documentation](./docs/API.md)** - (English) คู่มือการต่อ API สำหรับนักพัฒนา

---

## 🚢 การ Deploy

**แนะนำ:** Railway (Backend) + Vercel (Frontend)

ดูขั้นตอนแบบละเอียดได้ที่: [คู่มือการ Deploy ไปยัง Railway และ Vercel](./docs/DEPLOY_RAILWAY_VERCEL.md)

---

## 📖 สิ่งที่ได้เรียนรู้

### ทักษะทางเทคนิคที่ได้พัฒนา

**Backend Development:**
- การสร้าง RESTful API ที่มีมาตรฐานด้วย Express.js
- การออกแบบ Database Relationship ที่ซับซ้อนด้วย Prisma
- การทำ Authentication/Authorization ด้วย JWT และ Refresh Token Flow
- การจัดการ Real-time Socket และ Background Tasks

**Frontend Development:**
- การใช้ Next.js 14 App Router และ Server/Client Components
- การจัดการ Global State ด้วย Zustand
- การทำ Form Validation ที่ซับซ้อน

**DevOps & Infrastructure:**
- การ Deploy ขึ้น Cloud Platform จริง
- การจัดการ Environment Variables และ Security
- การทำ Database Migration บน Production

---

## 📝 License

โปรเจคนี้อยู่ภายใต้ [MIT License](LICENSE)

---

## 👤 ผู้พัฒนา

**Watchara**

- GitHub: [@yourusername](https://github.com/yourusername)
- Email: your.email@example.com

---

## 🙏 ขอบคุณ

- Documentation ดีๆจาก LINE Messaging API
- Community ของ Next.js และ Express.js
- Prisma Team สำหรับ ORM เทพๆ

---

<div align="center">

**⭐ ถ้าคุณชอบโปรเจคนี้ ฝากกด Star ให้ด้วยนะครับ! ⭐**

Made with ❤️ by Watchara

</div>
