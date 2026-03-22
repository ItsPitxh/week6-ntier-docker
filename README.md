# 🐳 Task Board - N-Tier Architecture with Docker
## ENGSE207 - Week 6 Docker Version

**ชื่อ-นามสกุล:** พิชฌ์ สินธรสวัสดิ์
**รหัสนักศึกษา:** 67543210061-7
**วันที่:** 11 กุมภาพันธ์ 2026

---

## 📋 สารบัญ

1. [ภาพรวมโปรเจกต์](#ภาพรวมโปรเจกต์)
2. [Architecture Overview](#architecture-overview)
3. [โครงสร้างโปรเจกต์](#โครงสร้างโปรเจกต์)
4. [วิธีติดตั้งและรันโปรเจกต์](#วิธีติดตั้งและรันโปรเจกต์)
5. [การตั้งค่า SSL/HTTPS](#การตั้งค่า-sslhttps)
6. [API Endpoints](#api-endpoints)
7. [คำสั่ง Docker ที่ใช้บ่อย](#คำสั่ง-docker-ที่ใช้บ่อย)
8. [การวิเคราะห์เปรียบเทียบ: VM vs Docker](#การวิเคราะห์เปรียบเทียบ-vm-vs-docker)

---

## ภาพรวมโปรเจกต์

Task Board web application ที่ใช้ **N-Tier Architecture** แบบ Dockerized ประกอบด้วย 3 containers:

| Container | Image | หน้าที่ |
|-----------|-------|--------|
| `taskboard-nginx` | nginx:alpine | Web server + Reverse Proxy + SSL Termination |
| `taskboard-api` | node:20-alpine (custom) | REST API Backend |
| `taskboard-db` | postgres:16-alpine | Database |

---

## Architecture Overview

```
                    ┌─────────────────────────────────────────┐
                    │            Docker Network               │
                    │         (taskboard-network)             │
                    │                                         │
  Browser  ─HTTPS─► │  ┌──────────┐    ┌──────────┐          │
  :443              │  │  Nginx   │───►│   API    │          │
                    │  │ (port 80 │    │ (Node.js │          │
  Browser  ─HTTP──► │  │  / 443)  │    │  :3000)  │          │
  :80  (redirect)   │  └──────────┘    └────┬─────┘          │
                    │                       │                 │
                    │                  ┌────▼──────┐          │
                    │                  │PostgreSQL │          │
                    │                  │  (:5432)  │          │
                    │                  └───────────┘          │
                    └─────────────────────────────────────────┘
```

---

## โครงสร้างโปรเจกต์

```
week6-ntier-docker/
├── api/                        # Node.js Backend
│   ├── Dockerfile
│   ├── package.json
│   ├── server.js
│   └── src/
│       ├── config/database.js
│       ├── controllers/taskController.js
│       ├── middleware/errorHandler.js
│       ├── models/Task.js
│       ├── repositories/taskRepository.js
│       ├── routes/taskRoutes.js
│       └── services/taskService.js
├── database/
│   └── init.sql                # Database schema + seed data
├── frontend/                   # Static HTML/CSS/JS
│   ├── index.html
│   ├── css/style.css
│   └── js/app.js
├── nginx/
│   ├── nginx.conf
│   ├── conf.d/default.conf     # HTTPS + reverse proxy config
│   └── ssl/                    # SSL certificates (สร้างด้วย generate-ssl.sh)
│       ├── server.crt
│       └── server.key
├── scripts/
│   ├── generate-ssl.sh         # สร้าง self-signed certificate
│   ├── start.sh
│   ├── stop.sh
│   ├── logs.sh
│   └── test-api.sh
├── docker-compose.yml
└── .env.example
```

---

## วิธีติดตั้งและรันโปรเจกต์

### ขั้นตอนที่ 1: Clone โปรเจกต์

```bash
git clone <repository-url>
cd week6-ntier-docker
```

### ขั้นตอนที่ 2: สร้าง SSL Certificate

**ต้องทำก่อนรัน Docker เสมอ** ไม่เช่นนั้น Nginx จะ crash

```bash
bash scripts/generate-ssl.sh
```

คำสั่งนี้จะสร้างไฟล์ `nginx/ssl/server.crt` และ `nginx/ssl/server.key`

### ขั้นตอนที่ 3: ตั้งค่า Environment (ถ้าต้องการ)

```bash
cp .env.example .env
# แก้ไขค่าใน .env ตามต้องการ (ไม่บังคับ มี default แล้ว)
```

### ขั้นตอนที่ 4: รัน Docker Compose

```bash
docker compose up -d
```

Docker จะ:
1. Pull images (postgres, nginx)
2. Build API image จาก `api/Dockerfile`
3. รอให้ database healthy ก่อนเริ่ม API
4. รอให้ API healthy ก่อนเริ่ม Nginx

### ขั้นตอนที่ 5: เปิดเว็บ

เปิดเบราว์เซอร์และไปที่:

```
https://localhost
```

> ⚠️ เบราว์เซอร์จะแจ้งเตือน "Your connection is not private" เนื่องจากใช้ self-signed certificate
> กด **Advanced** → **Proceed to localhost (unsafe)** เพื่อเข้าใช้งาน

---

## การตั้งค่า SSL/HTTPS

### Self-Signed Certificate

โปรเจกต์นี้ใช้ self-signed certificate สำหรับ HTTPS บน localhost:

```bash
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout nginx/ssl/server.key \
    -out nginx/ssl/server.crt \
    -subj "/C=TH/ST=ChiangMai/L=ChiangMai/O=RMUTL/OU=SoftwareEngineering/CN=localhost"
```

### ปัญหาที่พบและวิธีแก้ไข

| ปัญหา | สาเหตุ | วิธีแก้ |
|-------|--------|--------|
| `SSL_CTX_set_cipher_list failed` | cipher ชื่อไม่ถูกต้อง (`GCM-SHA512` ไม่มีใน TLS) | เปลี่ยนเป็น `GCM-SHA384` และ `GCM-SHA256` |
| `cannot open /etc/nginx/ssl/server.crt` | ไม่มี SSL certificate | รัน `scripts/generate-ssl.sh` ก่อน |
| Nginx crash on startup | ทั้งสองปัญหาข้างต้น | แก้ cipher + สร้าง cert แล้ว restart |

การแก้ไข cipher ใน `nginx/conf.d/default.conf`:

```nginx
# ❌ ผิด (GCM-SHA512 ไม่มีใน TLS spec)
ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;

# ✅ ถูก
ssl_ciphers ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES128-GCM-SHA256;
```

---

## API Endpoints

Base URL: `https://localhost/api`

| Method | Endpoint | คำอธิบาย |
|--------|----------|---------|
| `GET` | `/api/health` | Health check |
| `GET` | `/api/tasks` | ดึง task ทั้งหมด |
| `POST` | `/api/tasks` | สร้าง task ใหม่ |
| `GET` | `/api/tasks/:id` | ดึง task ตาม ID |
| `PUT` | `/api/tasks/:id` | แก้ไข task |
| `DELETE` | `/api/tasks/:id` | ลบ task |

### ตัวอย่าง Request Body (POST/PUT)

```json
{
  "title": "ทำการบ้าน Week 6",
  "description": "ทำ Lab N-Tier Architecture",
  "status": "IN_PROGRESS",
  "priority": "HIGH"
}
```

Status: `TODO` | `IN_PROGRESS` | `DONE`
Priority: `LOW` | `MEDIUM` | `HIGH`

### ทดสอบ API ด้วย curl

```bash
# Health check
curl -k https://localhost/api/health

# ดึง tasks ทั้งหมด
curl -k https://localhost/api/tasks

# สร้าง task ใหม่
curl -k -X POST https://localhost/api/tasks \
  -H "Content-Type: application/json" \
  -d '{"title":"Test","status":"TODO","priority":"MEDIUM"}'
```

---

## คำสั่ง Docker ที่ใช้บ่อย

```bash
# เริ่มต้นระบบ (background)
docker compose up -d

# หยุดระบบ
docker compose down

# ดู status ของทุก container
docker compose ps

# ดู logs แบบ real-time
docker compose logs -f

# ดู logs เฉพาะ service
docker compose logs -f nginx
docker compose logs -f api
docker compose logs -f db

# Build ใหม่ (เมื่อแก้ไข code ใน api/)
docker compose build --no-cache
docker compose up -d

# เข้าไปใน container
docker exec -it taskboard-api sh
docker exec -it taskboard-db psql -U taskboard -d taskboard_db

# ดู resource usage
docker stats

# ดู disk usage
docker system df

# ลบ volumes (reset database)
docker compose down -v
```

---

## การวิเคราะห์เปรียบเทียบ: VM vs Docker

## 1. ตารางเปรียบเทียบ Setup Process

| ขั้นตอน | Version 1 (VM) | Version 2 (Docker) |
|---------|----------------|-------------------|
| ติดตั้ง PostgreSQL | ติดตั้งผ่าน apt install postgresql และตั้งค่า user/password เอง | ใช้ image postgres จาก Docker Hub กำหนด ENV ผ่าน docker-compose |
| ติดตั้ง Node.js | ติดตั้งผ่าน apt install nodejs และ npm | ใช้ node:20-alpine image ใน Dockerfile |
| ติดตั้ง Nginx | ติดตั้งผ่าน apt install nginx และแก้ config ที่ /etc/nginx | ใช้ nginx image และ mount config ผ่าน volume |
| Configure Database | แก้ไขไฟล์ .env และตั้งค่า database manually | กำหนด environment variables ใน docker-compose.yml |
| Configure SSL | ติดตั้ง certbot และตั้งค่า SSL ด้วยตนเอง | รัน scripts/generate-ssl.sh แล้ว mount เข้า container |
| Start Services | ใช้ systemctl start ทีละ service | ใช้คำสั่ง docker compose up -d ครั้งเดียว |
| **เวลาทั้งหมด** | ประมาณ 30-45 นาที | ประมาณ 5-10 นาที |

---

## 2. ตารางเปรียบเทียบ Resource Usage

| Resource | Version 1 (VM) | Version 2 (Docker) |
|----------|----------------|-------------------|
| Memory Usage | ~700MB - 1GB (รวม OS) | ~250MB - 400MB |
| Disk Usage | 8-10GB (รวม Ubuntu OS) | 1-2GB (รวม images) |
| CPU Usage | สูงกว่าเนื่องจากมี OS เต็มระบบ | ต่ำกว่า เพราะใช้ shared kernel |
| Startup Time | 30-60 วินาที (boot VM) | 3-10 วินาที (start containers) |

---

## 3. ข้อดีของ Docker Deployment

1. **รวดเร็วในการติดตั้ง:**
   สามารถ deploy ทั้งระบบด้วยคำสั่งเดียว (`docker compose up -d`) ไม่ต้องติดตั้ง dependency ทีละตัว

2. **Environment Consistency:**
   ทุกคนในทีมใช้ environment เดียวกัน ลดปัญหา "เครื่องเราใช้ได้ แต่เครื่องเพื่อนใช้ไม่ได้"

3. **Resource Efficiency:**
   ใช้ทรัพยากรน้อยกว่า VM เพราะไม่ต้องมี Guest OS เต็มรูปแบบ

4. **Scalability:**
   สามารถ scale service ได้ง่าย เช่น เพิ่มจำนวน API container

5. **Portability:**
   ย้ายไปรันบนเครื่องอื่นหรือ cloud ได้ทันที แค่มี Docker ติดตั้ง

---

## 4. ข้อเสียของ Docker Deployment

1. **Learning Curve:**
   ผู้เริ่มต้นอาจสับสนเรื่อง networking, volumes, healthcheck และ container lifecycle

2. **Debugging Complexity:**
   การ debug บางครั้งต้องดู log หลาย container พร้อมกัน

3. **Dependency on Docker Engine:**
   หาก Docker daemon มีปัญหา ระบบทั้งหมดจะไม่สามารถทำงานได้

---

## 5. เมื่อไหร่ควรใช้ VM vs Docker?

### ควรใช้ VM เมื่อ:
- ต้องการจำลองระบบ OS เต็มรูปแบบ
- ต้องการ isolation ระดับ OS (เช่น งานด้าน security)
- รัน application legacy ที่ไม่รองรับ container

### ควรใช้ Docker เมื่อ:
- พัฒนาและ deploy web application แบบ microservices
- ต้องการ CI/CD และ automation
- ต้องการ deploy เร็วและ scale ได้ง่าย

---

## 6. สิ่งที่ได้เรียนรู้จาก Lab นี้

จาก Lab นี้ได้เรียนรู้ความแตกต่างระหว่างการ deploy แบบ Virtual Machine และ Docker อย่างชัดเจน
Docker ช่วยให้การจัดการ dependency และ environment ง่ายขึ้นมาก
ได้เข้าใจแนวคิด N-Tier Architecture (Nginx → API → Database)
รวมถึงการใช้ healthcheck และ docker-compose ในการจัดการ service หลายตัวพร้อมกัน
นอกจากนี้ยังได้เรียนรู้เรื่อง SSL/TLS cipher suites และการ debug ปัญหา Nginx ที่เกิดจาก cipher ที่ไม่ถูกต้อง

---

*ENGSE207 - Software Architecture - Week 6*
*มหาวิทยาลัยเทคโนโลยีราชมงคลล้านนา*
