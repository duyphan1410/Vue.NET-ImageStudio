var builder = WebApplication.CreateBuilder(args);
var frontendUrl = builder.Configuration.GetValue<string>("ExternalServices:FrontendUrl") 
                  ?? "http://localhost:5173";

// Thêm CORS cho frontend Vue
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend",
        policy => policy.WithOrigins(frontendUrl) // địa chỉ Vue dev
                        .AllowAnyHeader()
                        .AllowAnyMethod()
                        .AllowCredentials());
});

// Đăng ký controller + swagger
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddHttpClient("PythonApiClient", client =>
{
    var url = builder.Configuration.GetValue<string>("ExternalServices:PythonApiUrl") 
              ?? throw new Exception("Missing PythonApiUrl");
    client.BaseAddress = new Uri(url);
    client.DefaultRequestHeaders.Add("Accept", "application/json");
});
var app = builder.Build();

// Dùng CORS
app.UseCors("AllowFrontend");

// Swagger chỉ bật ở môi trường Development
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseAuthorization();
app.UseStaticFiles();
// Map controller routes
app.MapControllers();

app.Run();
