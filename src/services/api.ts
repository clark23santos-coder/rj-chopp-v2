import axios from 'axios';

export const api = axios.create({
  baseURL: 'https://rjchopp-backend-production.up.railway.app',
  timeout: 15000,
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!navigator.onLine) {
      return Promise.reject({
        ...error,
        isOffline: true,
        message: 'Sem conexão com a internet.',
      });
    }

    return Promise.reject(error);
  }
);
