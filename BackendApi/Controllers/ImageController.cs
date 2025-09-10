using Microsoft.AspNetCore.Mvc;
using System.Diagnostics;
using System.Text.Json.Serialization;

namespace BackendApi.Controllers
{
    // Class để nhận response từ Python API
    public class ImageApiResponse
    {
        [JsonPropertyName("base64_image")]
        public string? Base64Image { get; set; }
        [JsonPropertyName("message")]
        public string? Message { get; set; }
    }
    
    public class FileUploadModel
    {
        public IFormFile? File { get; set; }
    }

    [ApiController]
    [Route("api/[controller]")]
    public class ImageController : ControllerBase
    {
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly IWebHostEnvironment _env;
        // Cập nhật Base URL để trỏ đúng đến API Python đang chạy trên cổng 8000
        private const string PythonApiBaseUrl = "http://localhost:8000/";

        public ImageController(IHttpClientFactory httpClientFactory, IWebHostEnvironment env)
        {
            _httpClientFactory = httpClientFactory;
            _env = env;
        }

        [HttpPost("remove-bg")]
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> RemoveBackground([FromForm] FileUploadModel model)
        {
            var file = model.File;
            if (file == null || file.Length == 0)
                return BadRequest(new { message = "No file uploaded." });

            var client = _httpClientFactory.CreateClient();
            // Thiết lập BaseAddress cho client từ hằng số đã định nghĩa
            client.BaseAddress = new Uri(PythonApiBaseUrl);

            // Gửi file trực tiếp đến API Python
            using var formData = new MultipartFormDataContent();
            var fileContent = new StreamContent(file.OpenReadStream());
            formData.Add(fileContent, "file", file.FileName);

            try
            {
                // Gửi yêu cầu HTTP POST đến endpoint của Python API
                var response = await client.PostAsync("remove_background", formData);

                // Kiểm tra HTTP status code
                if (!response.IsSuccessStatusCode)
                {
                    var errorContent = await response.Content.ReadAsStringAsync();
                    return StatusCode((int)response.StatusCode, new { message = $"Python API failed: {errorContent}" });
                }

                // Đọc và deserialize JSON response
                var apiResponse = await response.Content.ReadFromJsonAsync<ImageApiResponse>();
                
                if (string.IsNullOrEmpty(apiResponse?.Base64Image))
                {
                    return StatusCode(500, new { message = "Invalid response from Python API." });
                }

                return Ok(new { image = apiResponse.Base64Image });
            }
            catch (HttpRequestException ex)
            {
                // Xử lý lỗi khi không thể kết nối đến API Python
                return StatusCode(500, new { message = $"Failed to connect to Python API. Make sure it is running at {PythonApiBaseUrl}. Error: {ex.Message}" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = $"An unexpected error occurred: {ex.Message}" });
            }
        }

        [HttpPost("upload")]
        [Consumes("multipart/form-data")]
        [RequestSizeLimit(100_000_000)] // 100MB
        public async Task<IActionResult> Upload([FromForm] FileUploadModel model)
        {
            var file = model.File;
            if (file == null || file.Length == 0)
                return BadRequest(new { message = "No file uploaded." });

            var uploads = Path.Combine(_env.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot"), "uploads");
            if (!Directory.Exists(uploads)) Directory.CreateDirectory(uploads);

            // đặt tên an toàn
            var safeName = Path.GetFileName(file.FileName);
            var fileName = $"{Path.GetFileNameWithoutExtension(safeName)}_{Guid.NewGuid():N}{Path.GetExtension(safeName)}";
            var filePath = Path.Combine(uploads, fileName);

            using (var stream = new FileStream(filePath, FileMode.Create))
                await file.CopyToAsync(stream);

            var url = $"/uploads/{fileName}";
            return Ok(new { url });
        }

        public class SaveImageRequest { public string? Image { get; set; } }

        // ===== SAVE ảnh từ dataURL (base64) =====
        [HttpPost("save")]
        [DisableRequestSizeLimit] // tránh 413 nếu ảnh to
        public async Task<IActionResult> Save([FromBody] SaveImageRequest request)
        {
            if (string.IsNullOrWhiteSpace(request?.Image))
                return BadRequest(new { message = "No image data." });

            string dataUrl = request.Image;
            var commaIdx = dataUrl.IndexOf(',');
            if (commaIdx < 0) return BadRequest(new { message = "Invalid data URL." });

            var meta = dataUrl.Substring(0, commaIdx); // ví dụ: data:image/png;base64
            var base64 = dataUrl.Substring(commaIdx + 1);

            byte[] bytes;
            try { bytes = Convert.FromBase64String(base64); }
            catch { return BadRequest(new { message = "Invalid base64 content." }); }

            var ext = meta.Contains("image/jpeg") ? ".jpg" : ".png";
            var edits = Path.Combine(_env.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot"), "edits");
            if (!Directory.Exists(edits)) Directory.CreateDirectory(edits);

            var fileName = $"edit_{Guid.NewGuid():N}{ext}";
            var filePath = Path.Combine(edits, fileName);
            await System.IO.File.WriteAllBytesAsync(filePath, bytes);

            var url = $"/edits/{fileName}";
            return Ok(new { url });
        }
    }
}

