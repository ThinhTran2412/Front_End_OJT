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

#### Option 1: Dùng Unified API Base URL (Khuyến nghị - Nginx Setup)

Nếu bạn đã có Nginx public URL, sử dụng cấu hình này:

```
VITE_API_BASE_URL=https://your-nginx-domain.com
```

**Ví dụ:**
```
VITE_API_BASE_URL=https://your-nginx-domain.com
```

Hoặc nếu Nginx chạy trên port khác:
```
VITE_API_BASE_URL=http://your-nginx-ip:80
```

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
- Nginx (nếu có) đã được cấu hình để expose public

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
- Kiểm tra backend services có đang chạy không
- Kiểm tra Nginx có accessible từ internet không

