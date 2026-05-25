import axios from 'axios';

const hostname = window.location.hostname;

export const api = axios.create({
  baseURL: `http://${hostname}:3333`,
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
