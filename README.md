## ⬇️ Getting Started

### 1. Clone & Install
```bash
git clone https://github.com/<your-username>/vn-image-studio.git
cd vn-image-studio
```
### 2. Run Services in 3 Terminal Tabs

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

**Terminal 3: Python Scripts (removebg FastAPI)**
```bash
cd BackendApi/PythonScripts
pip install -r requirements.txt
uvicorn remove_bg:app --host 0.0.0.0 --port 8000
```

Sau khi khởi động xong, truy cập app qua địa chỉ frontend (thường là `http://localhost:5173` hoặc địa chỉ bạn config).

---

**Lưu ý:**  
- Đảm bảo đã cài .NET SDK, NodeJS, Python đúng version trước khi chạy.
- Nếu dùng Windows, đường dẫn có thể là `BackendApi\PythonScripts`; trên macOS/Linux là `BackendApi/PythonScripts`.
- Các service phải chạy đồng thời để frontend gọi được API và Python script.

---

Bạn chỉ cần copy phần này vào README là bất kỳ ai cũng biết cách khởi động dự án!  
Nếu muốn mình gợi ý thêm phần kiểm tra môi trường, hoặc hướng dẫn chi tiết hơn, cứ nói nhé.