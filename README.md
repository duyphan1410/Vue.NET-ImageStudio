![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Vue](https://img.shields.io/badge/Vue-3-green.svg)
![.NET](https://img.shields.io/badge/.NET-8.0-purple.svg)
![rembg](https://img.shields.io/badge/rembg-python-blue.svg)

# Vue.NET ImageStudio

**Vue.NET ImageStudio** là dự án web chỉnh sửa ảnh đơn giản, gồm 2 chức năng nổi bật:
- **RemoveBG**: Xóa nền ảnh tự động bằng AI.
- **Paint**: Vẽ, xóa, nhập ảnh, xuất ảnh dễ dàng trên canvas.

Không yêu cầu đăng nhập. Giao diện trực quan, thao tác nhanh chóng.

---

## 🚀 Chức năng chính

### 1. RemoveBG
- **Upload ảnh**: Kéo/thả hoặc chọn file ảnh (PNG/JPG).
- **Xóa nền AI**: Gửi ảnh tới backend Python (rembg) qua API, trả về ảnh đã xóa nền.
- **Xem trước & tải về**: Hiển thị kết quả, cho phép tải về ảnh đã xóa nền.

### 2. Paint Tool
- **Vẽ/xóa**: Tùy ý vẽ hoặc tẩy trên canvas.
- **Nhập ảnh**: Thêm ảnh vào canvas, chỉnh sửa, vẽ/xóa lớp trên ảnh.
- **Xuất ảnh**: Lưu file ảnh đã chỉnh sửa về máy.

---

## ⚙️ Công nghệ sử dụng

| Thành phần    | Công nghệ                  |
|---------------|---------------------------|
| **Frontend**  | Vue 3, Vite, TailwindCSS  |
| **Backend**   | .NET 8.0 WebAPI, Python   |
| **Image AI**  | rembg (Python)            |

---

## ⬇️ Hướng dẫn khởi động dự án

### 1. Clone & Cài đặt
```bash
git clone https://github.com/duyphan1410/Vue.NET-ImageStudio.git
cd Vue.NET-ImageStudio
```

### 2. Chạy đồng thời 3 terminal

**Terminal 1: Frontend**
```bash
cd frontend
npm install
npm run dev
```

**Terminal 2: Backend API (.NET)**
```bash
cd BackendApi
dotnet restore
dotnet run
```

**Terminal 3: Python Scripts (rembg)**
```bash
cd BackendApi/PythonScripts
pip install -r requirements.txt
uvicorn remove_bg:app --host 0.0.0.0 --port 8000
```

Sau đó truy cập frontend qua địa chỉ: [http://localhost:5173](http://localhost:5173)

---

## 💡 Lưu ý

- Yêu cầu đã cài đặt: NodeJS, .NET SDK 8+, Python 3.10+.
- Nếu dùng Windows, kiểm tra đường dẫn phân cách (`\` hoặc `/`).
- Các service cần chạy song song để frontend kết nối được các API.

---

## 📝 License
MIT License. Xem chi tiết tại [LICENSE](LICENSE).

---

## 📢 Credits
- [Vue.js](https://vuejs.org/)
- [.NET](https://dotnet.microsoft.com/)
- [rembg](https://github.com/danielgatis/rembg)

---

## 🙋‍♂️ Tác giả
**Phan Duy**  
GitHub: [@duyphan1410](https://github.com/duyphan1410)
