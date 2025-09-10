import axios from "axios";

const api = axios.create({
  baseURL: "https://localhost:7012" // hoặc http://localhost:5279
});

export default api;
