# 🚀 AarambhApp Backend - Server Requirements for 5000 Users

## 📊 Application Analysis

### Backend Architecture
- **Framework**: Node.js + Express.js
- **Database**: MongoDB
- **Real-time Features**: WebRTC signaling, polling-based updates
- **AI Integration**: OpenAI API for chat and evaluation
- **Payment Gateway**: Razorpay
- **File Upload**: Multer (audio files for pronunciation)

### Resource-Intensive Operations

#### 🔴 **High CPU Usage**
1. **AI Chat & Evaluation** (OpenAI API calls)
   - Conversation generation
   - Pronunciation evaluation
   - Story evaluation
   - Suggestion generation

2. **WebRTC Signaling**
   - Session management for voice/video calls
   - ICE candidate exchange
   - Offer/Answer negotiation
   - Polling every 1 second per active call

3. **Game Processing**
   - Grammar quiz evaluation
   - Score calculation
   - Leaderboard updates

#### 🟡 **Medium CPU Usage**
1. **Authentication & JWT**
   - Token generation/validation
   - Password hashing (bcrypt)

2. **Database Queries**
   - Leaderboard aggregations
   - User statistics
   - Session filtering and pagination
   - Regional rankings

3. **File Processing**
   - Audio file uploads (pronunciation game)
   - Base64 encoding/decoding

#### 🟢 **Low CPU Usage**
1. **CRUD Operations**
   - User management
   - Region management
   - Lecture viewing
   - Transaction history

---

## 💻 **Recommended Server Specifications for 5000 Users**

### 🎯 **Production-Ready Configuration**

#### **Scenario 1: Moderate Usage (Conservative Estimate)**
**Assumptions:**
- 20% concurrent users (1000 active)
- 10% in voice/video calls (100 calls = 200 users)
- 15% playing games (150 users)
- 5% using AI chat (50 users)

**Recommended Specs:**
```
CPU: 4-6 vCPUs (Intel Xeon or AMD EPYC)
RAM: 8-16 GB
Storage: 100 GB SSD (NVMe preferred)
Bandwidth: 1 Gbps network
```

**Estimated Costs (Monthly):**
- DigitalOcean: $48-96/month (Droplet)
- AWS EC2: $60-120/month (t3.xlarge to t3.2xlarge)
- Linode: $48-96/month
- Render: $85-175/month (Pro tier with autoscaling)

---

#### **Scenario 2: High Usage (Peak Hours)**
**Assumptions:**
- 40% concurrent users (2000 active)
- 15% in voice/video calls (300 calls = 600 users)
- 25% playing games (500 users)
- 10% using AI chat (200 users)

**Recommended Specs:**
```
CPU: 8-12 vCPUs
RAM: 16-32 GB
Storage: 200 GB SSD
Bandwidth: 2-5 Gbps network
Load Balancer: Yes (2+ instances)
```

**Estimated Costs (Monthly):**
- DigitalOcean: $168-336/month
- AWS EC2: $200-400/month (c5.2xlarge to c5.4xlarge)
- Render: $250-500/month (with autoscaling)

---

### 🗄️ **MongoDB Atlas Configuration**

#### **For 5000 Users:**
```
Cluster Tier: M20 or M30
Storage: 50-100 GB
RAM: 16-32 GB
CPU: 4-8 vCPUs
Backup: Enabled (daily snapshots)
```

**Estimated Costs:**
- MongoDB Atlas M20: ~$155/month
- MongoDB Atlas M30: ~$580/month

**Alternative (Self-Hosted MongoDB):**
- DigitalOcean Managed MongoDB: ~$120-240/month
- Self-hosted on separate server: ~$48-96/month

---

## 📈 **Resource Breakdown by Feature**

### 1. **WebRTC Voice/Video Calls** 🎥
**Impact:** HIGH
- **Per Call Session:**
  - CPU: ~1-2% per concurrent call
  - RAM: ~10-20 MB per call
  - Network: ~1-2 Mbps per call (TURN server usage)
  - Polling frequency: 1 req/sec × 2 users = 2 req/sec

- **For 100 Concurrent Calls (200 users):**
  - CPU: 10-20%
  - RAM: 2-4 GB
  - Network: 100-200 Mbps
  - Request rate: 200 req/sec for signaling

**Optimization:**
- Use external TURN/STUN servers (free: openrelay.metered.ca)
- Implement WebSocket for signaling (reduces polling overhead)
- Connection timeout: 30 seconds for idle sessions

---

### 2. **AI Chat & Evaluation** 🤖
**Impact:** HIGH (External API Dependency)
- **Per OpenAI Request:**
  - CPU: ~2-5% (JSON processing, token counting)
  - RAM: ~5-10 MB
  - Latency: 2-5 seconds per response
  - Cost: $0.002-0.01 per request (GPT-3.5-turbo)

- **For 200 Active Chat Users:**
  - Avg 10 messages/session
  - 2000 messages/hour
  - CPU: ~5-10%
  - RAM: ~1-2 GB
  - OpenAI Cost: ~$4-20/hour (~$3000-15000/month if continuous)

**Optimization:**
- Implement response caching for common queries
- Rate limit: 10 requests/minute per user
- Use GPT-3.5-turbo instead of GPT-4 (10x cheaper)
- Batch requests where possible

---

### 3. **Games & Leaderboard** 🎮
**Impact:** MEDIUM
- **Per Game Session:**
  - CPU: ~0.5-1%
  - RAM: ~2-5 MB
  - Database: 1-3 write operations

- **For 500 Active Players:**
  - CPU: ~10-15%
  - RAM: ~1-2 GB
  - Database load: 500-1500 writes/min

**Optimization:**
- Cache leaderboard data (Redis): 5-minute TTL
- Batch leaderboard updates: every 30 seconds
- Indexed queries on userId, regionId, score

---

### 4. **User Authentication & Sessions** 🔐
**Impact:** MEDIUM
- **Per Login:**
  - CPU: ~1-2% (bcrypt hashing)
  - RAM: ~1-2 MB
  - Database: 1-2 queries

- **For 1000 Concurrent Users:**
  - Session storage: ~100-200 MB (JWT in memory)
  - Database connections: 50-100 active

**Optimization:**
- JWT expiry: 7 days (reduces re-authentication)
- Redis session store (if scaling to multiple servers)
- Connection pooling: 100 connections max

---

### 5. **File Uploads (Audio)** 🎤
**Impact:** MEDIUM
- **Per Audio Upload:**
  - CPU: ~5-10% (encoding/decoding)
  - RAM: ~10-20 MB
  - Storage: ~50-200 KB per file
  - Processing time: 1-3 seconds

- **For 100 Uploads/Hour:**
  - CPU: ~5-10%
  - Storage: ~5-20 MB/hour (~150-600 MB/month)

**Optimization:**
- Use external storage: AWS S3 or Cloudinary
- Compress audio: Opus codec at 16kbps
- Max file size: 5 MB

---

## 🔧 **Optimization Strategies**

### 1. **Caching Layer (Redis)** ⚡
```
Use Cases:
- Leaderboard data (5-min TTL)
- User session tokens
- Frequently accessed game data
- Region statistics

Redis Requirements:
- RAM: 512 MB - 2 GB
- Cost: $5-20/month (managed Redis)
```

### 2. **CDN for Static Assets** 🌐
```
Use Cases:
- Profile pictures
- Audio files
- Game images

Recommended:
- Cloudflare (free tier)
- AWS CloudFront
- Bunny CDN ($10-30/month)
```

### 3. **Load Balancing** ⚖️
```
For > 3000 concurrent users:
- Nginx reverse proxy (free)
- AWS ALB ($20-40/month)
- Multiple backend instances (2-3 servers)
```

### 4. **Database Optimization** 🗃️
```
Indexes:
- userId (compound indexes for queries)
- regionId, score (leaderboard)
- sessionId, status (call sessions)
- createdAt (for pagination)

Connection Pooling:
- Max connections: 100-200
- Idle timeout: 30 seconds
```

### 5. **Rate Limiting** 🚦
```
Implemented Limits:
- General API: 100 req/min per user
- AI Chat: 10 req/min per user
- File Upload: 5 req/min per user
- WebRTC Signaling: No limit (real-time)
```

---

## 💰 **Total Cost Estimate (Monthly)**

### **Budget Option (~$200-300/month)**
```
✅ Best for: Development, MVP, < 2000 users

Backend Server:
- DigitalOcean Droplet (4 vCPU, 8 GB): $48
- MongoDB Atlas M20: $155
- Cloudflare CDN: Free
- OpenAI API (moderate usage): $50-100

Total: ~$253-303/month
```

### **Standard Option (~$500-700/month)**
```
✅ Best for: Production, 3000-5000 users

Backend Server:
- DigitalOcean/AWS (8 vCPU, 16 GB): $168
- MongoDB Atlas M30: $280
- Redis (managed): $15
- CDN (Cloudflare/Bunny): $20
- OpenAI API (moderate usage): $100-200

Total: ~$583-683/month
```

### **Premium Option (~$1000-1500/month)**
```
✅ Best for: High traffic, > 5000 users, scaling

Backend Servers (2× instances):
- AWS/Render autoscaling: $400-600
- MongoDB Atlas M40: $580
- Redis cluster: $50
- CDN + Storage (S3): $50
- Load Balancer: $30
- OpenAI API (high usage): $200-400

Total: ~$1310-1710/month
```

---

## 🎯 **Recommended Starting Configuration**

### **For Initial Launch (5000 users, moderate usage):**

```yaml
Backend Server:
  Provider: DigitalOcean / AWS / Render
  CPU: 4-6 vCPUs
  RAM: 8-16 GB
  Storage: 100 GB SSD
  Cost: ~$50-100/month

Database:
  Provider: MongoDB Atlas
  Tier: M20 (4 GB RAM, 40 GB storage)
  Cost: ~$155/month

Caching:
  Provider: Redis Cloud (optional)
  RAM: 512 MB
  Cost: ~$10/month (can skip initially)

CDN:
  Provider: Cloudflare
  Plan: Free tier
  Cost: $0

OpenAI:
  Model: GPT-3.5-turbo
  Budget: $100-200/month
  Rate limits: 10 req/min per user

TURN Server:
  Provider: openrelay.metered.ca
  Cost: Free (public servers)

TOTAL MONTHLY COST: ~$315-465/month
```

---

## 📊 **Scaling Milestones**

### **0-2000 Users:**
```
✅ Single server (4 vCPU, 8 GB)
✅ MongoDB M20
✅ No load balancer needed
Cost: ~$250/month
```

### **2000-5000 Users:**
```
✅ Single server (6-8 vCPU, 16 GB)
✅ MongoDB M30
✅ Add Redis caching
✅ Consider CDN for media
Cost: ~$500-700/month
```

### **5000-10000 Users:**
```
✅ 2× backend servers with load balancer
✅ MongoDB M40 or M50
✅ Redis cluster
✅ CDN required
✅ Consider microservices for WebRTC
Cost: ~$1000-1500/month
```

### **10000+ Users:**
```
✅ 3+ backend servers, autoscaling
✅ MongoDB sharded cluster
✅ Redis cluster (HA)
✅ Dedicated TURN servers
✅ Microservices architecture
✅ Kubernetes/Docker orchestration
Cost: ~$2000-5000/month
```

---

## 🔍 **Monitoring & Alerts**

### **Essential Metrics:**
```
Server:
- CPU usage > 70% (alert)
- RAM usage > 80% (alert)
- Disk usage > 80% (alert)
- Network bandwidth > 500 Mbps (alert)

Database:
- Query response time > 200ms (warning)
- Connection count > 80 (alert)
- Disk IOPS > 3000 (alert)

Application:
- API response time > 2 seconds (alert)
- Error rate > 5% (critical)
- WebRTC call failures > 10% (alert)
- OpenAI API failures > 5% (alert)
```

### **Recommended Tools:**
```
- Datadog (paid, comprehensive): ~$15-50/month
- New Relic (paid, APM): ~$25-100/month
- PM2 (free, basic monitoring)
- Grafana + Prometheus (free, self-hosted)
- MongoDB Atlas built-in monitoring (included)
```

---

## 🚀 **Quick Start Deployment Guide**

### **1. Choose Provider:**
```bash
# DigitalOcean (Recommended for simplicity)
https://www.digitalocean.com/products/droplets

# AWS EC2 (Recommended for scalability)
https://aws.amazon.com/ec2/

# Render (Recommended for ease of use)
https://render.com/
```

### **2. Server Setup:**
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2 for process management
sudo npm install -g pm2

# Clone and setup backend
git clone <your-repo>
cd BackEnd
npm install
```

### **3. Environment Configuration:**
```bash
# Copy env.local and configure
cp env.example env.local
nano env.local

# Required variables:
MONGODB_URI=<mongodb-atlas-connection-string>
JWT_SECRET=<generate-random-secret>
OPENAI_API_KEY=<your-openai-key>
RAZORPAY_KEY_ID=<your-razorpay-id>
RAZORPAY_KEY_SECRET=<your-razorpay-secret>
NODE_ENV=production
PORT=5000
```

### **4. Start Application:**
```bash
# Start with PM2
pm2 start server.js --name "aarambh-backend"

# Save PM2 configuration
pm2 save
pm2 startup

# Monitor
pm2 monit
```

### **5. Setup Nginx Reverse Proxy:**
```bash
sudo apt install nginx

# Create config
sudo nano /etc/nginx/sites-available/aarambh

# Paste:
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# Enable and restart
sudo ln -s /etc/nginx/sites-available/aarambh /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### **6. Setup SSL (Free with Let's Encrypt):**
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

---

## 📞 **Support & Scaling Consultation**

For optimal performance with your specific use case:
1. Monitor actual usage patterns for 2-4 weeks
2. Analyze peak hours and concurrent user metrics
3. Scale vertically first (upgrade server resources)
4. Scale horizontally when vertical scaling is insufficient
5. Consider managed services (Render, AWS Elastic Beanstalk) for auto-scaling

---

**Last Updated:** October 2025  
**Recommended Review:** Every 3 months or when reaching 80% capacity

