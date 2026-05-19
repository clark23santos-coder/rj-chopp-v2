import axios from 'axios';

const hostname = window.location.hostname;

export const api = axios.create({
  baseURL: `http://${hostname}:3333`,
});