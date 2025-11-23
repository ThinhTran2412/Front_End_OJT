# Hướng Dẫn API Routing trong Frontend

## Tổng Quan

Frontend sử dụng **Nginx** làm reverse proxy để route các API requests đến đúng backend service. Frontend chỉ cần gọi API với path tương đối, Nginx sẽ tự động route đến service tương ứng.

## Cách Hoạt Động

### 1. Nginx Routing Rules (nginx/conf.d/default.conf)

Nginx đã được cấu hình để route dựa trên path pattern:

| API Path Pattern | Backend Service | Ví dụ |
|-----------------|-----------------|-------|
| `/api/Auth`, `/api/User`, `/api/Role`, `/api/EventLog`, `/api/PatientInfo`, `/api/Registers`, `/api/Privileges`, `/api/AuditLog` | **IAM Service** | `/api/Auth/login` |
| `/api/Patient`, `/api/TestOrder`, `/api/TestResult`, `/api/MedicalRecord`, `/api/ai-review` | **Laboratory Service** | `/api/Patient/all` |
| `/api/Monitoring` | **Monitoring Service** | `/api/Monitoring/health` |
| `/api/Simulator` | **Simulator Service** | `/api/Simulator/query` |

### 2. Frontend Configuration (src/services/api.js)

Frontend được cấu hình để:

- **Local Development**: Sử dụng `http://localhost/api` (Nginx chạy trên port 80)
- **Production**: Có thể dùng `VITE_API_BASE_URL` hoặc route trực tiếp đến từng service

### 3. Cách Gọi API trong Frontend

#### Ví dụ 1: Login (IAM Service)

```javascript
// File: src/pages/General/Login.jsx
import api from '../../services/api';

// Gọi API - chỉ cần path tương đối
const response = await api.post('/Auth/login', formData);

// Request thực tế:
// POST http://localhost/api/Auth/login
// → Nginx route đến: iam-service:8080/api/Auth/login
```

#### Ví dụ 2: Get All Patients (Laboratory Service)

```javascript
// File: src/services/PatientService.js
import api from './api';

// Gọi API
const response = await api.get('/Patient/all');

// Request thực tế:
// GET http://localhost/api/Patient/all
// → Nginx route đến: laboratory-service:8080/api/Patient/all
```

#### Ví dụ 3: Register (IAM Service)

```javascript
// File: src/pages/General/Register.jsx
import api from '../../services/api';

// Gọi API
const response = await api.post('/Registers', userData);

// Request thực tế:
// POST http://localhost/api/Registers
// → Nginx route đến: iam-service:8080/api/Registers
```

## Luồng Request

```
┌─────────────┐
│   Browser   │
│  (Frontend) │
└──────┬──────┘
       │
       │ GET /api/Patient/all
       ▼
┌─────────────┐
│   Nginx     │  ← Port 80 (localhost)
│  (Proxy)    │
└──────┬──────┘
       │
       │ Route dựa trên path pattern
       │ /api/Patient/* → Laboratory Service
       ▼
┌─────────────────────┐
│ Laboratory Service  │
│   (Port 8080)       │
└─────────────────────┘
```

## Các Trường Hợp Sử Dụng

### ✅ Đúng - Sử dụng path tương đối

```javascript
// ✅ ĐÚNG - Path tương đối, interceptor tự động thêm /api prefix
api.get('/Patient/all')
api.post('/Auth/login', data)
api.put('/TestOrder/123', data)
api.delete('/Patient/456')
```

### ❌ Sai - Không cần full URL

```javascript
// ❌ SAI - Không cần full URL khi dùng Nginx
api.get('http://localhost/api/Patient/all')
api.get('http://iam-service:8080/api/Auth/login')
```

### ✅ Đúng - Với query parameters

```javascript
// ✅ ĐÚNG - Query parameters vẫn hoạt động bình thường
api.get('/Patient/search?query=john')
api.get('/TestOrder?pageNumber=1&pageSize=10')
```

## Environment Variables

### Local Development

Không cần set biến môi trường, frontend tự động dùng:
- `baseURL = "http://localhost/api"` (Nginx trên port 80)

### Production

Có thể set trong `.env`:

```env
# Option 1: Unified API (qua Nginx)
VITE_API_BASE_URL=http://your-domain.com/api

# Option 2: Direct service URLs (legacy)
VITE_IAM_SERVICE_URL=https://iam-service.onrender.com
VITE_LABORATORY_SERVICE_URL=https://laboratory-service.onrender.com
```

## Lưu Ý Quan Trọng

1. **Luôn dùng path tương đối**: Frontend chỉ cần gọi `/Auth/login`, không cần full URL
2. **Interceptor tự động thêm `/api` prefix**: Không cần thêm thủ công
3. **Authorization header tự động**: Interceptor tự động thêm token từ localStorage
4. **Nginx route tự động**: Dựa trên path pattern, không cần config thêm ở frontend

## Kiểm Tra Routing

Để kiểm tra routing có đúng không, mở **Browser DevTools → Network tab**:

1. Request URL sẽ là: `http://localhost/api/Patient/all`
2. Response sẽ đến từ service tương ứng
3. Nếu lỗi 502/503, kiểm tra service có đang chạy không

## Troubleshooting

### Lỗi 404 Not Found
- Kiểm tra path có đúng pattern trong nginx config không
- Kiểm tra service có endpoint tương ứng không

### Lỗi 502 Bad Gateway
- Service backend chưa chạy hoặc chưa healthy
- Kiểm tra docker-compose: `docker-compose ps`

### Lỗi CORS
- Nginx không cần xử lý CORS, backend services tự xử lý
- Kiểm tra CORS config trong backend services

