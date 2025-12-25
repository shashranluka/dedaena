import axios from 'axios';


const apiUrl = process.env.REACT_APP_API_URL;

const api = axios.create({
  baseURL: apiUrl,
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request Interceptor: ავტომატურად დაამატე JWT token
// api.interceptors.request.use(
//   (config) => {
//     const token = localStorage.getItem('access_token');
//     if (token) {
//       config.headers.Authorization = `Bearer ${token}`;
//     }
//     return config;
//   },
//   (error) => Promise.reject(error)
// );

// // Response Interceptor: Handle errors globally
// api.interceptors.response.use(
//   (response) => response,
//   (error) => {
//     // 401 Unauthorized → Logout
//     if (error.response?.status === 401) {
//       localStorage.removeItem('access_token');
//       localStorage.removeItem('user');
//       window.location.href = '/login';
//     }
    
//     // 403 Forbidden
//     if (error.response?.status === 403) {
//       console.error('Access denied');
//     }
    
//     return Promise.reject(error);
//   }
// );

export default api;