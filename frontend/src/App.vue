<template>

    <nav class="navbar">
      <div class="nav-container">
        <router-link to="/">Trang chủ</router-link>
        <router-link to="/Hello">Hello</router-link>
        <router-link to="/remove-bg">RemoveBG</router-link>
        <router-link to="/paint-image">Paint Image</router-link>
      </div>
    </nav>
    <main class="main-content">
      <router-view></router-view>
    </main>

</template>

<style>
/* CSS toàn cục, không cần 'scoped' */
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html, body {
  margin: 0;
  padding: 0;
  background-color: white !important;
  color: black !important;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  width: 100%;
  overflow-x: hidden;
}

#app {
  width: 100vw;                    /* ← Dùng viewport width */
  height: 100vh;
  background-color: white !important;
  color: black !important;
  overflow-x: hidden;
}

/* Đảm bảo các element không bị dark mode */
div, p, h1, h2, h3, h4, h5, h6, span, button, input {
  color: inherit;
}

.navbar {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 60px;
  z-index: 1000;
  background-color: #f0f0f0;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  display: flex;
  align-items: center;
}

.nav-container {
  width: 100%;
  max-width: 1600px;
  margin: 0 auto;
  padding: 0 20px;
  display: flex;
  gap: 20px;
  align-items: center;
}

.navbar a {
  text-decoration: none;
  font-weight: bold;
  color: #333;
  padding: 10px 16px;
  border-radius: 5px;
  transition: background-color 0.3s ease;
  white-space: nowrap;
}

.navbar a:hover {
  background-color: #e0e0e0;
}

.navbar a.router-link-exact-active {
  color: #007bff;
  background-color: #e0f0ff;
}

.main-content {
  padding-top: 80px;
  width: 100%;
  min-height: calc(100vh - 80px);
  margin: 0 auto;
  display: flex;
  justify-content: center;
  align-items: flex-start;
}

/* Responsive design */
@media (max-width: 768px) {
  .nav-container {
    padding: 0 15px;
    gap: 15px;
  }
  
  .navbar a {
    padding: 8px 12px;
    font-size: 14px;
  }
  
  .main-content {
    padding-left: 15px;
    padding-right: 15px;
  }
}

@media (max-width: 480px) {
  .nav-container {
    gap: 10px;
  }
  
  .navbar a {
    padding: 6px 10px;
    font-size: 13px;
  }
}
</style>