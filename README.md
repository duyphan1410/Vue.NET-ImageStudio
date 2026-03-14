# Vue.NET ImageStudio

![License](https://img.shields.io/badge/license-MIT-blue.svg?style=flat-square)
![Vue](https://img.shields.io/badge/Vue.js-3.x-green.svg?style=flat-square)
![.NET](https://img.shields.io/badge/.NET-8.0-purple.svg?style=flat-square)
![Python](https://img.shields.io/badge/Python-3.10+-blue.svg?style=flat-square)
![Fabric.js](https://img.shields.io/badge/Fabric.js-Canvas-yellow.svg?style=flat-square)

**Vue.NET ImageStudio** is a web-based image editing application that combines **Vue 3** (frontend), **.NET 8** (backend), and **Python AI** (image processing).

The project focuses on in-browser editing with layers, tools, export, and AI background removal.

---

## Key Features

### Current Features
* **Workspace navigation:** Editor, Remove BG, Paint, and Adjust pages.
* **Export:** Export PNG/WebP from Editor and Remove BG workspaces.
* **Editor - Layers:** Add, duplicate, reorder (front/back), show/hide, delete, clear content, and view layer thumbnails.
* **Editor - Tools:** Select, brush, eraser, rectangle, circle, and add image to canvas.
* **Editor - History:** Undo/Redo (buttons and shortcuts: Ctrl+Z, Ctrl+Shift+Z, Ctrl+Y).
* **Editor - Properties (Transform):** Position/size, lock/unlock, aspect ratio, rotation, flip, opacity.
* **Editor - Properties (Shape):** Fill, stroke color/width/style, corner radius.
* **Editor - Properties (Image):** Border, brightness/contrast/saturation (Fabric filters), opacity.
* **Editor - Properties (Text):** Font family, size, bold/italic, alignment, line height, color, opacity (when a text object exists).
* **Smart Eraser:** Intelligent erasing (non-destructive for editable objects, destructive for raster images).
* **Drag & Drop:** Drop images directly into the editor canvas.
* **Remove BG (AI):** Upload JPG/PNG/WebP (max 10MB), process via API, compare original vs result.
* **Refine Edges:** Brush/Eraser editor for fine-tuning, with Undo/Redo, Save/Cancel.
* **Paint (Konva):** Brush/eraser on image, size/color, Undo/Redo, save to backend.
* **Adjust Image:** Brightness/contrast/saturation, quick filters (Bright/Dark/Vivid/B&W), draw tools, rotate/flip, reset, download.
* **Backend API (.NET 8):** Image upload/save and proxy to Python AI service.
* **Python AI Service:** FastAPI + `rembg` background removal.

### API & Services
* **.NET API:** `POST /api/image/remove-bg` - forwards image to Python API and returns base64.
* **.NET API:** `POST /api/image/upload` - saves image to `wwwroot/uploads`.
* **.NET API:** `POST /api/image/save` - saves base64 image to `wwwroot/edits`.
* **Python API:** `POST /remove_background` - returns base64 background-removed image.

### Configuration
* `BackendApi/appsettings.json`: `ExternalServices:PythonApiUrl` (default `http://localhost:8000`)
* `BackendApi/appsettings.json`: `ExternalServices:FrontendUrl` (default `http://localhost:5173`)
* `frontend/src/services/api.js`: `baseURL` (default `https://localhost:7012`)

### Roadmap (Upcoming Features)
* [ ] **Save Project** (UI placeholder exists).
* [ ] **User Authentication** (login/signup).
* [ ] **Cloud Integration** (Google Drive).
* [ ] **Project Management** (save workspace, layers, history).

---

## Tech Stack

| Component | Technology |
| :--- | :--- |
| **Frontend** | Vue 3, Vite, Pinia, Vue Router, Fabric.js, Konva |
| **Backend** | .NET 8.0 Web API |
| **AI Service** | Python, FastAPI, rembg, Uvicorn |
| **Tooling** | Concurrently (for unified execution) |

---

## Getting Started

Follow these steps to set up and run the project locally.

### 1. Prerequisites
Ensure you have the following installed:
* **Node.js** (Latest LTS)
* **.NET SDK 8.0** or higher
* **Python 3.10** or higher

### 2. Installation

Clone the repository and install dependencies:

```bash
# Clone the project
git clone https://github.com/duyphan1410/Vue.NET-ImageStudio.git
cd Vue.NET-ImageStudio

# Root deps (concurrently)
npm install

# Frontend deps
cd frontend
npm install
cd ..

# Python deps
cd BackendApi/PythonScripts
pip install -r requirements.txt
cd ../..

```
Note: .NET dependencies will be restored automatically upon build.

## 3. Running the Application
I have configured Concurrently to run the Frontend, Backend, and AI Service with a single command. No need to open multiple terminals!

Simply run:
```bash
npm run dev
```
This command will launch:
- Vue Frontend: http://localhost:5173
- .NET Backend: (Port configured in launchSettings)
- Python AI Service: http://0.0.0.0:8000

---

## Notes

- **Windows Users**: Ensure your path separators (`\` or `/`) are handled correctly if you encounter issues.
- **Python Path**: Make sure `python` or `pip` is added to your system's Environment Variables.

---

## License
Distributed under the MIT License. See [LICENSE](LICENSE) for more information.

---

## Credits
- [Vue.js](https://vuejs.org/)
- [Fabric.js](https://fabricjs.com/)
- [.NET](https://dotnet.microsoft.com/)
- [rembg](https://github.com/danielgatis/rembg) for the amazing background removal library.
