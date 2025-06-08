# Galaxy Viewer Backend API

Backend API cho dự án Galaxy Viewer - một ứng dụng tạo thiên hà thông điệp lãng mạn.

## ✨ Tính năng

- 🌌 Tạo và quản lý các thiên hà thông điệp
- 💝 Upload hình ảnh và nhạc nền
- ❤️ Hiệu ứng trái tim lãng mạn
- 📱 Tối ưu cho mobile và desktop
- 🔄 API RESTful đầy đủ
- 📁 Quản lý file upload
- 💾 Lưu trữ dữ liệu JSON (có thể mở rộng với database)

## 🚀 Cài đặt

### Yêu cầu hệ thống
- Node.js >= 14.0.0
- npm >= 6.0.0

### Bước 1: Clone repository
```bash
git clone <repository-url>
cd galaxy-viewer-backend
```

### Bước 2: Cài đặt dependencies
```bash
npm install
```

### Bước 3: Cấu hình môi trường
```bash
cp .env.example .env
```
Chỉnh sửa file `.env` theo cấu hình của bạn.

### Bước 4: Chạy server
```bash
# Development mode với nodemon
npm run dev

# Production mode
npm start
```

Server sẽ chạy tại `http://localhost:3000`

## 📚 API Documentation

### Base URL
```
http://localhost:3000/api
```

### Endpoints

#### 1. Health Check
```http
GET /health
```
Kiểm tra trạng thái server.

#### 2. Lấy danh sách galaxies
```http
GET /api/galaxies
```
Trả về danh sách tất cả galaxies với thông tin cơ bản.

#### 3. Lấy galaxy theo ID
```http
GET /api/galaxies/:id
```
Lấy thông tin chi tiết của một galaxy.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "messages": ["Tin nhắn 1", "Tin nhắn 2"],
    "icons": ["♥", "💖", "❤️"],
    "colors": "#ff6b9d",
    "images": ["url1", "url2"],
    "song": "song_url",
    "textHeart": "Tên người yêu",
    "isHeart": true,
    "isSave": true,
    "createdAt": "2025-01-01T00:00:00.000Z"
  }
}
```

#### 4. Tạo galaxy mới
```http
POST /api/galaxies
```

**Form Data:**
- `messages`: JSON array của các tin nhắn
- `icons`: JSON array của các icon (optional)
- `colors`: Màu chủ đạo (optional, default: #ff6b9d)
- `textHeart`: Tên hiển thị trên trái tim
- `isHeart`: Boolean - có hiển thị hiệu ứng trái tim không
- `song`: File nhạc nền (optional)
- `images`: File hình ảnh (tối đa 10 files)

**Example cURL:**
```bash
curl -X POST http://localhost:3000/api/galaxies \
  -F 'messages=["Anh yêu em", "Em là tất cả với anh"]' \
  -F 'icons=["♥", "💖"]' \
  -F 'colors=#ff6b9d' \
  -F 'textHeart=My Love' \
  -F 'isHeart=true' \
  -F 'song=@path/to/song.mp3' \
  -F 'images=@path/to/image1.jpg' \
  -F 'images=@path/to/image2.jpg'
```

#### 5. Cập nhật galaxy
```http
PUT /api/galaxies/:id
```
Cùng format với POST, nhưng cập nhật galaxy có sẵn.

#### 6. Xóa galaxy
```http
DELETE /api/galaxies/:id
```

#### 7. Thống kê
```http
GET /api/stats
```
Trả về thống kê tổng quan về hệ thống.

## 📁 Cấu trúc thư mục

```
galaxy-viewer-backend/
├── server.js              # Main server file
├── package.json           # Dependencies và scripts
├── .env.example          # Environment configuration example
├── README.md             # Documentation
├── data/                 # JSON data storage
│   └── galaxies.json     # Galaxy data
├── uploads/              # Uploaded images
├── songs/               # Uploaded songs
└── logs/                # Application logs (if implemented)
```

## 🔧 Cấu hình

### File Upload
- Kích thước tối đa: 50MB per file
- Định dạng hình ảnh: jpg, jpeg, png, gif, webp
- Định dạng âm thanh: mp3, wav, ogg, m4a

### CORS
Server hỗ trợ CORS cho phép frontend truy cập từ các domain khác nhau.

## 🛠️ Development

### Scripts có sẵn
```bash
npm run dev     # Chạy với nodemon (auto-reload)
npm start       # Chạy production mode
npm test        # Chạy tests (nếu có)
npm run lint    # Check code style
```

### Thêm tính năng mới
1. Tạo route mới trong `server.js`
2. Thêm validation cần thiết
3. Cập nhật documentation
4. Test API endpoints

## 🚀 Deployment

### Heroku
```bash
# Tạo Heroku app
heroku create galaxy-viewer-api

# Set environment variables
heroku config:set NODE_ENV=production

# Deploy
git push heroku main
```

### Railway/Render
1. Connect repository
2. Set environment variables
3. Deploy automatically

### VPS/Server
```bash
# Với PM2
npm install -g pm2
pm2 start server.js --name galaxy-api
pm2 startup
pm2 save
```

## 📊 Monitoring

### Health Check
Server cung cấp endpoint `/health` để monitor:
```json
{
  "status": "OK",
  "timestamp": "2025-01-01T00:00:00.000Z"
}
```

## 🔐 Security Notes

- Validate tất cả input từ client
- Giới hạn kích thước file upload
- Rate limiting cho production
- HTTPS cho production
- Environment variables cho sensitive data

## 🤝 Contributing

1. Fork repository
2. Tạo feature branch
3. Commit changes
4. Push to branch
5. Create Pull Request

## 📄 License

MIT License - see LICENSE file for details.

## 📞 Support

Nếu có vấn đề hoặc câu hỏi:
- Tạo issue trên GitHub
- Email: support@vu2005.com

---

Made with ❤️ for love messages in the galaxy! 🌌