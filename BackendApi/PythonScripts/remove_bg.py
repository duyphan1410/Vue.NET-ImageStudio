import base64
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import JSONResponse
from rembg import remove
import io
import uvicorn

# Khởi tạo ứng dụng FastAPI
# Việc khởi tạo và tải mô hình rembg chỉ diễn ra một lần duy nhất
# khi server bắt đầu, giúp tối ưu hiệu suất đáng kể.
app = FastAPI(title="Image Processing API")

@app.get("/")
def read_root():
    return {"message": "Image Processing API is running"}

@app.post("/remove_background")
async def remove_background_api(file: UploadFile = File(...)):
    """
    Xử lý file ảnh được gửi qua HTTP POST, 
    sử dụng thư viện rembg để xóa nền và trả về ảnh đã xử lý dưới dạng Base64.
    """
    try:
        # Đọc dữ liệu ảnh từ luồng
        input_data = await file.read()
        
        # Kiểm tra nếu file trống
        if not input_data:
            raise HTTPException(status_code=400, detail="No image data received.")
        
        # Xử lý xóa nền bằng rembg
        processed_data = remove(input_data)
        
        # Chuyển đổi dữ liệu ảnh đã xử lý thành base64
        base64_image = base64.b64encode(processed_data).decode('utf-8')
        
        # Trả về kết quả dưới dạng JSON
        return JSONResponse(content={"base64_image": base64_image})
        
    except Exception as e:
        # Xử lý các lỗi xảy ra trong quá trình xử lý
        return JSONResponse(
            status_code=500,
            content={"message": f"An error occurred: {str(e)}"}
        )

# Để chạy server này
# cần cd đến thư mục chứa file này: cd BackendApi\PythonScripts
# Sau đó, chạy lệnh sau trong terminal:
# uvicorn remove_bg:app --host 0.0.0.0 --port 8000
if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
