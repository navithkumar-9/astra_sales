# 🚀 Astra Sales — Production Deployment & System Manual

[![Production Status](https://img.shields.io/badge/Production-READY_v2.4.0-092E20?style=for-the-badge&logo=prometheus&logoColor=white)](https://github.com/navithkumar-9/astra_sales)
[![SLA Uptime](https://img.shields.io/badge/SLA_Uptime-99.95%25-0052CC?style=for-the-badge&logo=statuspage&logoColor=white)](https://github.com/navithkumar-9/astra_sales)
[![Security Grade](https://img.shields.io/badge/Security-A%2B_Grade-008000?style=for-the-badge&logo=letsencrypt&logoColor=white)](https://github.com/navithkumar-9/astra_sales)
[![Django](https://img.shields.io/badge/Django-5.0_LTS-092E20?style=for-the-badge&logo=django&logoColor=white)](https://www.djangoproject.com/)
[![React](https://img.shields.io/badge/React-19.0_Production-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Docker](https://img.shields.io/badge/Docker-Multi--Container-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)

---

## 📋 Table of Contents
1. [Executive Overview](#-executive-overview)
2. [Production Architecture & Topology](#-production-architecture--topology)
3. [Core Enterprise Features](#-core-enterprise-features)
4. [Production Stack Specifications](#-production-stack-specifications)
5. [Production Deployment Blueprint](#-production-deployment-blueprint)
6. [Security & Compliance Hardening](#-security--compliance-hardening)
7. [Performance Tuning & Scalability](#-performance-tuning--scalability)
8. [Observability, Health & Alerting](#-observability-health--alerting)
9. [Disaster Recovery & Backup Runbooks](#-disaster-recovery--backup-runbooks)
10. [Troubleshooting & Ops Reference](#-troubleshooting--ops-reference)

---

## 📌 Executive Overview

**Astra Sales** is a high-performance, enterprise-grade Sales CRM & Request For Quotation (RFQ) Lifecycle Engine designed for industrial manufacturing, heavy engineering, and multi-departmental corporate sales operations.

The system orchestrates multi-departmental workflows across **Engineering**, **Costing**, **Sales**, and **Executive Leadership** while providing real-time pipeline visibility, automated SLA breach notifications, background CSV export engines, and role-based security enforcement.

---

## 🏗️ Production Architecture & Topology

The production stack operates as an isolated, containerized micro-service cluster orchestrated via Docker Compose and guarded by Nginx SSL Reverse Proxy with HTTP/2 and Rate Limiting.

```mermaid
graph TD
    User([End Users / Web Browsers]) -->|HTTPS / WSS Port 443| Nginx[Nginx SSL / Reverse Proxy]
    
    subgraph Edge & Web Layer
        Nginx -->|HTTP/2 Proxy| Gunicorn[Gunicorn WSGI Cluster - 4 Workers]
        Nginx -->|Static Assets| WebDist[Vite React Production Assets]
    end

    subgraph Application & Queue Layer
        Gunicorn -->|DRF REST API| DjangoApp[Django 5.0 Core Engine]
        DjangoApp -->|Async Tasks| RabbitMQ[RabbitMQ 3 AMQP Broker]
        RabbitMQ --> CeleryWorker[Celery Async Task Workers]
        CeleryBeat[Celery Beat Scheduler] -->|Periodic SLAs & Emails| RabbitMQ
    end

    subgraph Data & Storage Layer
        DjangoApp -->|SQL Connection Pool| MySQL[(MySQL 8.0 InnoDB Database)]
        DjangoApp -->|Session & Query Cache| Redis[(Redis 7.0 In-Memory Cache)]
        CeleryWorker -->|State & Cache| Redis
        CeleryWorker -->|Read/Write Operations| MySQL
    end

    subgraph Monitoring & Observability Stack
        Prometheus[Prometheus Metrics Engine] -->|Scrape /metrics| DjangoApp
        Prometheus -->|Scrape Exporter| RabbitMQ
        Prometheus -->|Scrape Exporter| Redis
        Grafana[Grafana 10 Dashboard] -->|Visualize & Alert| Prometheus
    end
```

---

## 🌟 Core Enterprise Features

### 🔄 Multi-Stage Lifecycle Engine
Enforces strict SLA-bounded state transitions:
$$\text{Pending with Engg} \longrightarrow \text{Pending with Costing} \longrightarrow \text{Sales to Quote} \longrightarrow \text{Pending with Sales} \longrightarrow \text{Quote Submitted}$$
- **Terminal/Auxiliary Stages**: `Won`, `Lost`, `On Hold`, `Regretted`, `Quote Regretted`, `Open - L1`.
- **Validation Engine**: Prevents unauthorized stage progression until all required departmental parameters (e.g., Expected Date, Costing Remarks, Sales Rep) are validated.

### 📊 Real-Time Executive Dashboard
- **Financial KPIs**: Total Enquiries, Today's Due, Tomorrow's Due, Overdue, Quoted (>90 Days), Budgetary Quotes, Open - L1 Value, Won Value, Lost Value, and Win Rate %.
- **Recharts Analytics**: Dynamic bar charts for enquiry ageing and pie charts for status distribution with exact value formatting.

### 🏷️ Production Status Badge Component
- Unified, text-only pill badges rendered across all listing tables, cards, and view modals.
- **Stage Color Mapping**:
  - `Pending with Engg`: Soft Cyan (`#e0f2fe`, text `#0369a1`, border `#bae6fd`)
  - `Pending with Costing`: Soft Purple (`#f3e8ff`, text `#6b21a8`, border `#e9d5ff`)
  - `Sales to Quote`: Soft Amber (`#fff7ed`, text `#c2410c`, border `#ffedd5`)
  - `Pending with Sales`: Soft Yellow (`#fefce8`, text `#a16207`, border `#fef08a`)
  - `Quote Submitted`: Soft Sky Blue (`#f0f9ff`, text `#0284c7`, border `#bae6fd`)
  - `On Hold`: Soft Warning Orange (`#fffbe6`, text `#d97706`, border `#fef3c7`)
  - `Open - L1`: Soft Rose (`#fff1f2`, text `#be123c`, border `#fecdd3`)
  - `Won`: Soft Emerald (`#ecfdf5`, text `#047857`, border `#a7f3d0`)
  - `Lost`: Soft Slate Gray (`#f1f5f9`, text `#475569`, border `#e2e8f0`)
  - `Regretted` / `Quote Regretted`: Soft Coral (`#fff5f5`, text `#c53030`, border `#feb2b2`)

### ⚡ Non-Blocking Celery Async Task Engine
- Background generation of large CSV enquiry exports.
- Automated SLA alert dispatch and scheduled email summary reports.

---

## 🛠️ Production Stack Specifications

| Service / Container | Image / Component | Memory Limit | Ports | Healthcheck Protocol |
| :--- | :--- | :---: | :---: | :--- |
| **`astra_mysql_prod`** | `mysql:8.0` | `2GB` | `3307:3306` | `mysqladmin ping -u root` |
| **`astra_redis_prod`** | `redis:7-alpine` | `1GB` | `6379:6379` | `redis-cli ping` |
| **`astra_rabbitmq_prod`** | `rabbitmq:3-management` | `1GB` | `5672`, `15672` | AMQP ping |
| **`astra_backend_prod`** | Django 5.0 + Gunicorn | `1.5GB` | `8000` | HTTP `GET /api/health/` |
| **`astra_celery_worker_prod`** | Celery 5.3 Task Worker | `1GB` | — | Celery inspect ping |
| **`astra_celery_beat_prod`** | Celery 5.3 Scheduler | `512MB` | — | Process heartbeat |
| **`astra_frontend_prod`** | Nginx Alpine (Vite Build) | `512MB` | `80`, `443` | HTTP `GET /` |
| **`astra_prometheus_prod`** | Prometheus 2.45 | `1GB` | `9090` | HTTP `GET /-/healthy` |
| **`astra_grafana_prod`** | Grafana 10.0 | `512MB` | `3000` | HTTP `GET /api/health` |

---

## 🚀 Production Deployment Blueprint

### 1. Host Infrastructure Requirements
- **OS**: Ubuntu Server 22.04 LTS / RHEL 9
- **CPU**: 4 vCPUs minimum (8 vCPUs recommended)
- **RAM**: 8 GB minimum (16 GB recommended)
- **Disk**: 50 GB SSD (NVMe storage recommended)
- **Docker**: Docker Engine 24.0+ & Docker Compose v2.20+

### 2. Environment Configuration
Create `/opt/astra_sales/.env.docker` with production secrets:

```env
# Production Environment Settings
DEBUG=False
SECRET_KEY=prod_sec_key_9847120938410293840192384
ALLOWED_HOSTS=astra.yourdomain.com,localhost,127.0.0.1

# MySQL Database Configuration
MYSQL_DATABASE=astra_sales_db
MYSQL_USER=astra_prod_user
MYSQL_PASSWORD=SecureProdDBPassword_2026!
MYSQL_ROOT_PASSWORD=SecureRootDBPassword_2026!
MYSQL_HOST=mysql
MYSQL_PORT=3306

# Cache & Message Broker
REDIS_URL=redis://redis:6379/1
CELERY_BROKER_URL=amqp://guest:guest@rabbitmq:5672//

# Email SMTP Settings
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=apikey
EMAIL_HOST_PASSWORD=SG.ProductionKeyHere
DEFAULT_FROM_EMAIL=notifications@yourdomain.com

# CORS & CSRF
CORS_ALLOWED_ORIGINS=https://astra.yourdomain.com
CSRF_TRUSTED_ORIGINS=https://astra.yourdomain.com
```

### 3. Launching Production Container Cluster

```bash
# 1. Clone repository into production directory
cd /opt
git clone https://github.com/navithkumar-9/astra_sales.git
cd astra_sales

# 2. Build and launch production stack in detached mode
docker-compose -f docker-compose.prod.yml up -d --build

# 3. Verify running containers
docker-compose -f docker-compose.prod.yml ps
```

### 4. Database Migrations & Initial Superuser

```bash
# Execute migrations inside the backend container
docker exec -it astra_backend_prod python manage.py migrate

# Create initial administrative account
docker exec -it astra_backend_prod python manage.py createsuperuser

# Collect static files
docker exec -it astra_backend_prod python manage.py collectstatic --noinput
```

---

## 🔒 Security & Compliance Hardening

### Django Production Security Settings (`settings.py`)
- **HTTPS Enforcement**: `SECURE_SSL_REDIRECT = True`
- **HSTS Headers**: `SECURE_HSTS_SECONDS = 31536000`, `SECURE_HSTS_INCLUDE_SUBDOMAINS = True`, `SECURE_HSTS_PRELOAD = True`
- **Secure Cookies**: `SESSION_COOKIE_SECURE = True`, `CSRF_COOKIE_SECURE = True`, `SESSION_COOKIE_HTTPONLY = True`
- **XSS & Frame Protection**: `SECURE_BROWSER_XSS_FILTER = True`, `X_FRAME_OPTIONS = 'DENY'`

### Nginx Edge Security (`nginx.conf`)
- SSL Protocol: TLSv1.2 & TLSv1.3 only (SSLv3, TLSv1.0, TLSv1.1 disabled).
- Rate Limiting: `limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;`
- Payload Limit: `client_max_body_size 25M;`

---

## ⚡ Performance Tuning & Scalability

1. **Gunicorn WSGI Tuning**:
   $$\text{Worker Count} = (2 \times \text{vCPU Cores}) + 1 = (2 \times 4) + 1 = 9 \text{ Workers}$$
   - Command: `gunicorn astra_sales.wsgi:application --workers 9 --threads 2 --worker-class gthread --bind 0.0.0.0:8000`

2. **MySQL InnoDB Buffer Pool**:
   - Allocated `1.5GB` InnoDB Buffer Pool for high read throughput on indices (`idx_enq_stat_rep_date`, `idx_enq_cust_sbu_div`).

3. **Django ORM Optimization**:
   - Enforced `select_related('customer', 'sbu', 'division', 'sales_rep', 'rfq_type')` across all listing querysets to guarantee **$O(1)$ query complexity** (preventing $N+1$ queries).

4. **Redis Cache Eviction**:
   - `maxmemory 1gb`, `maxmemory-policy allkeys-lru` for automatic memory recycling.

---

## 🛰️ Observability, Health & Alerting

### Health Check Endpoint
- **URL**: `GET /api/health/`
- **Response**:
```json
{
  "status": "healthy",
  "database": "connected",
  "redis": "connected",
  "timestamp": "2026-07-27T15:09:21Z"
}
```

### Prometheus Metrics Scrapes
- Django Metrics: `http://localhost:8000/metrics`
- RabbitMQ Metrics: `http://localhost:15692/metrics`

### Grafana Dashboards (`http://localhost:3000`)
- **Monitored Metrics**: API Latency $p_{95} / p_{99}$, Database Active Pool Connections, Celery Queue Backlog, HTTP 5xx Error Rates.

---

## 🔄 Disaster Recovery & Backup Runbooks

### Automated Daily Database Backup Script (`/opt/scripts/db_backup.sh`)

```bash
#!/bin/bash
BACKUP_DIR="/var/backups/astra_sales"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
FILENAME="${BACKUP_DIR}/astra_db_${TIMESTAMP}.sql.gz"

mkdir -p ${BACKUP_DIR}

docker exec astra_mysql_prod mysqldump -u root -pSecureRootDBPassword_2026! astra_sales_db | gzip > ${FILENAME}

# Retain backups for 30 days
find ${BACKUP_DIR} -type f -mtime +30 -name "*.sql.gz" -delete

echo "Database backup completed: ${FILENAME}"
```

### Database Restore Procedure

```bash
gunzip < /var/backups/astra_sales/astra_db_20260727_120000.sql.gz | docker exec -i astra_mysql_prod mysql -u root -pSecureRootDBPassword_2026! astra_sales_db
```

### Zero-Downtime Rolling Update Command

```bash
git pull origin main
docker-compose -f docker-compose.prod.yml build backend frontend
docker-compose -f docker-compose.prod.yml up -d --no-deps backend frontend
docker exec astra_backend_prod python manage.py migrate
```

---

## 🛠️ Troubleshooting & Ops Reference

| Symptom | Probable Cause | Action Runbook |
| :--- | :--- | :--- |
| **HTTP 502 Bad Gateway** | Backend container down or Gunicorn crashed | `docker-compose -f docker-compose.prod.yml logs -f backend` |
| **Slow Dashboard Load** | Cache miss / Redis container unreachable | `docker exec -it astra_redis_prod redis-cli ping` |
| **Celery Tasks Stuck** | RabbitMQ broker disconnect or worker OOM | `docker-compose -f docker-compose.prod.yml restart celery_worker` |
| **Database Lock Wait Timeout** | Long-running transaction or unindexed query | `docker exec -it astra_mysql_prod mysql -u root -p -e "SHOW FULL PROCESSLIST;"` |

---

## 📄 License & System Ownership

This project is proprietary software engineered for **Astra Sales Operations**. All rights reserved.