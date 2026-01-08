# Vue.NET ImageStudio

![License](https://img.shields.io/badge/license-MIT-blue.svg?style=flat-square)
![Vue](https://img.shields.io/badge/Vue.js-3.x-green.svg?style=flat-square)
![.NET](https://img.shields.io/badge/.NET-8.0-purple.svg?style=flat-square)
![Python](https://img.shields.io/badge/Python-3.10+-blue.svg?style=flat-square)
![Fabric.js](https://img.shields.io/badge/Fabric.js-Canvas-yellow.svg?style=flat-square)

**Vue.NET ImageStudio** is a modern, web-based image editing application that combines the interactivity of **Vue 3**, the performance of **.NET 8**, and the power of **Python AI**.

The project aims to provide a seamless editing experience directly in the browser, featuring AI-powered background removal and essential canvas tools, with plans for cloud integration and advanced image adjustments.

---

## Key Features

### Current Features
* **AI Background Removal:** Automatically remove image backgrounds with high precision using Python (`rembg`) integrated via API.
* **Paint & Canvas Tools:**
    * **Draw & Erase:** Freehand drawing and erasing capabilities on the canvas.
    * **Layering:** Import multiple images, stack them, and manipulate specific layers.
    * **Export:** Save your creative work instantly to your local device.
* **Drag & Drop:** Intuitive interface supporting drag-and-drop for image uploads (PNG/JPG).

### Roadmap (Upcoming Features)
* [ ] **Advanced Image Adjustments:** Modify Hue, Contrast, Brightness, and Saturation for specific object layers.
* [ ] **User Authentication:** Secure login/signup system.
* [ ] **Cloud Integration:** Save and load project files directly to **Google Drive**.
* [ ] **Project Management:** Save current workspace state (layers, history) to continue editing later.

---

## Tech Stack

| Component | Technology |
| :--- | :--- |
| **Frontend** | Vue 3, Vite, TailwindCSS |
| **Backend** | .NET 8.0 Web API |
| **AI Service** | Python, rembg, Uvicorn |
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

# Install Frontend dependencies (Root/Frontend)
npm install

# Install Python dependencies
cd BackendApi/PythonScripts
pip install -r requirements.txt
cd ../..

```
Note: .NET dependencies will be restored automatically upon build

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
