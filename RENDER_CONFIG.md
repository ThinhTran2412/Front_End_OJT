# Cấu hình Environment Variables cho Render

## Hướng dẫn cấu hình Frontend trên Render

### Bước 1: Tạo Web Service trên Render

1. Vào [Render Dashboard](https://dashboard.render.com)
2. Click **New +** → **Web Service**
3. Connect repository: `https://github.com/ThinhTran2412/Front_End_OJT.git`
4. Điền thông tin:
   - **Name**: `front-end-ojt` (hoặc tên bạn muốn)
   - **Region**: Chọn region gần nhất
   - **Branch**: `main`
   - **Root Directory**: `OJT_Laboratory_Project/Front_End` (hoặc `Front_End` nếu repo chỉ có frontend)
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run preview` (hoặc `npm run dev` nếu muốn dev mode)

### Bước 2: Cấu hình Environment Variables

Vào **Environment** tab và thêm các biến sau:

#### Option 1: Dùng Unified API Base URL qua Ngrok (Khuyến nghị)

Ngrok đang expose Nginx qua URL: `https://indoor-amiyah-auditorily.ngrok-free.dev`

Cấu hình trên Render:

```
VITE_API_BASE_URL=https://indoor-amiyah-auditorily.ngrok-free.dev/api
```

**Lưu ý quan trọng:** URL phải có suffix `/api` vì frontend sẽ thêm `/api` prefix vào các endpoint. Nếu không có `/api` trong baseURL, request sẽ trỏ sai.

**Lưu ý:**
- Ngrok URL sẽ thay đổi mỗi khi restart ngrok (nếu dùng free plan)
- Nếu muốn giữ URL cố định, cần upgrade ngrok plan hoặc cấu hình domain tùy chỉnh
- Đảm bảo ngrok đang chạy và forward đúng đến `http://localhost:80` (Nginx)

#### Option 2: Dùng Service URLs riêng (Legacy Mode)

Nếu không dùng Nginx, bạn có thể cấu hình service URLs riêng:

```
VITE_IAM_SERVICE_URL=https://iam-service-fz3h.onrender.com
VITE_LABORATORY_SERVICE_URL=https://laboratory-service.onrender.com
```

### Bước 3: Thông tin cấu hình

**Frontend URL sau khi deploy:**
```
https://front-end-ojt.onrender.com
```

**Đảm bảo:**
- Backend services đã được cấu hình CORS để cho phép `https://front-end-ojt.onrender.com`
- Ngrok đang chạy và forward đúng đến `http://localhost:80` (Nginx)
- Nginx đang chạy và accessible trên port 80

**Ngrok URL hiện tại:**
```
https://indoor-amiyah-auditorily.ngrok-free.dev
```

**Kiểm tra ngrok:**
- Mở ngrok Web Interface: http://127.0.0.1:4040
- Kiểm tra forwarding: `https://indoor-amiyah-auditorily.ngrok-free.dev -> http://localhost:80`

### Lưu ý quan trọng

1. **CORS**: Đảm bảo tất cả backend services đã được cấu hình CORS để cho phép origin `https://front-end-ojt.onrender.com`
2. **Environment Variables**: Tất cả biến bắt đầu với `VITE_` sẽ được embed vào code khi build
3. **Rebuild**: Sau khi thay đổi environment variables, bạn cần rebuild service trên Render

### Kiểm tra

Sau khi deploy:
1. Mở `https://front-end-ojt.onrender.com`
2. Mở Developer Tools → Network tab
3. Thử login hoặc gọi API
4. Kiểm tra request URL - phải trỏ về Nginx hoặc service URLs đã config

### Troubleshooting

**Lỗi CORS:**
- Kiểm tra backend services có cho phép origin `https://front-end-ojt.onrender.com` trong CORS config
- Kiểm tra `appsettings.Production.json` của tất cả services

**Lỗi 404:**
- Kiểm tra `VITE_API_BASE_URL` có đúng không
- Kiểm tra Nginx routing có đúng không

**Lỗi Network:**
- Kiểm tra backend services có đang chạy không: `docker-compose ps`
- Kiểm tra Nginx có accessible từ internet không
- Kiểm tra ngrok có đang chạy không: mở http://127.0.0.1:4040
- Kiểm tra ngrok forwarding có đúng không: `https://indoor-amiyah-auditorily.ngrok-free.dev -> http://localhost:80`

**Lưu ý về Ngrok:**
- Ngrok URL sẽ thay đổi nếu restart ngrok (free plan)
- Nếu URL thay đổi, cần cập nhật `VITE_API_BASE_URL` trên Render và rebuild
- Để giữ URL cố định, cần upgrade ngrok plan hoặc config domain tùy chỉnh

