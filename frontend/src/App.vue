<template>
  <div id="app-root">
    <!-- Compact Header cho Image Editor -->
    <header class="app-header">
      <div class="header-left">
        <div class="app-brand">
          <span class="brand-icon">🎨</span>
          <span class="brand-name">ImageStudio</span>
        </div>
        
        <nav class="main-nav">
          <router-link to="/" class="nav-link">
            <span class="nav-icon">🏠</span>
            <span class="nav-text">Home</span>
          </router-link>
          <router-link to="/remove-bg" class="nav-link">
            <span class="nav-icon">✂️</span>
            <span class="nav-text">Remove BG</span>
          </router-link>
          <router-link to="/paint-image" class="nav-link">
            <span class="nav-icon">🖌️</span>
            <span class="nav-text">Paint</span>
          </router-link>
          <router-link to="/adjust-image" class="nav-link">
            <span class="nav-icon">⚙️</span>
            <span class="nav-text">Adjust</span>
          </router-link>
        </nav>
      </div>

      <div class="header-right">
        <button class="header-btn" title="Export">
          <span>💾</span>
        </button>
        <button class="header-btn" title="Settings">
          <span>⚙️</span>
        </button>
      </div>
    </header>

    <!-- Main Content - Full Height -->
    <main class="main-content">
      <router-view></router-view>
    </main>
  </div>
</template>

<style>
/* CSS toàn cục */
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html,
body {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
  overflow: hidden; /* Ngăn scroll toàn trang */
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 
    'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
}

#app {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background: #1e1e1e;
}

#app-root {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* Compact Header - chỉ 48px */
.app-header {
  height: 48px;
  min-height: 48px;
  background: #1a1a1a;
  border-bottom: 1px solid #2d2d2d;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  z-index: 1000;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 24px;
}

.app-brand {
  display: flex;
  align-items: center;
  gap: 8px;
  padding-right: 24px;
  border-right: 1px solid #2d2d2d;
}

.brand-icon {
  font-size: 20px;
}

.brand-name {
  font-size: 16px;
  font-weight: 700;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: -0.5px;
}

.main-nav {
  display: flex;
  gap: 4px;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 6px;
  text-decoration: none;
  color: #aaa;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.nav-link:hover {
  background: #2d2d2d;
  color: #e0e0e0;
}

.nav-link.router-link-exact-active {
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.15) 0%, rgba(118, 75, 162, 0.15) 100%);
  color: #667eea;
  font-weight: 600;
}

.nav-icon {
  font-size: 16px;
}

.nav-text {
  font-size: 13px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 6px;
}

.header-btn {
  width: 36px;
  height: 36px;
  background: transparent;
  border: 1px solid #2d2d2d;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
}

.header-btn:hover {
  background: #2d2d2d;
  border-color: #3a3a3a;
}

/* Main Content - Full Height trừ header */
.main-content {
  flex: 1;
  width: 100%;
  height: calc(100vh - 48px);
  overflow: hidden; /* Child components sẽ tự handle scroll nếu cần */
  position: relative;
}

/* Responsive cho màn hình nhỏ */
@media (max-width: 768px) {
  .brand-name {
    display: none; /* Ẩn tên brand trên mobile */
  }

  .nav-text {
    display: none; /* Chỉ hiện icon trên mobile */
  }

  .nav-link {
    padding: 6px 10px;
  }

  .app-brand {
    padding-right: 16px;
  }

  .main-nav {
    gap: 2px;
  }
}

@media (max-width: 480px) {
  .app-header {
    padding: 0 12px;
  }

  .header-left {
    gap: 12px;
  }

  .header-btn {
    width: 32px;
    height: 32px;
    font-size: 14px;
  }
}

/* Đảm bảo không bị dark mode override */
div, p, h1, h2, h3, h4, h5, h6, span, button, input {
  color: inherit;
}
</style>