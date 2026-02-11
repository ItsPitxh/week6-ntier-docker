# 📊 การวิเคราะห์เปรียบเทียบ: VM vs Docker Deployment
## ENGSE207 - Week 6 N-Tier Architecture

**ชื่อ-นามสกุล:** พิชฌ์ สินธรสวัสดิ์ 
**รหัสนักศึกษา:** 67543210061-7
**วันที่:** 11 กุมภาพันธ์ 2026  

---

## 1. ตารางเปรียบเทียบ Setup Process

| ขั้นตอน | Version 1 (VM) | Version 2 (Docker) |
|---------|----------------|-------------------|
| ติดตั้ง PostgreSQL | ติดตั้งผ่าน apt install postgresql และตั้งค่า user/password เอง | ใช้ image postgres จาก Docker Hub กำหนด ENV ผ่าน docker-compose |
| ติดตั้ง Node.js | ติดตั้งผ่าน apt install nodejs และ npm | ใช้ node:20-alpine image ใน Dockerfile |
| ติดตั้ง Nginx | ติดตั้งผ่าน apt install nginx และแก้ config ที่ /etc/nginx | ใช้ nginx image และ mount config ผ่าน volume |
| Configure Database | แก้ไขไฟล์ .env และตั้งค่า database manually | กำหนด environment variables ใน docker-compose.yml |
| Configure SSL | ติดตั้ง certbot และตั้งค่า SSL ด้วยตนเอง | สามารถเพิ่ม reverse proxy container หรือ certbot container |
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

---

## 7. คำสั่ง Docker ที่ใช้บ่อย (Quick Reference)

```bash
docker compose up -d
docker compose down
docker compose ps
docker compose logs -f
docker compose build --no-cache
docker stats
docker system df
docker exec -it <container> sh
docker inspect <container>