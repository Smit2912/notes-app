import axios from 'axios';

const API = axios.create({
  baseURL: process.env.NEXT_PUBLIC_SUPABASE_FUNCTIONS_URL,
});

// attach token dynamically later
export const setAuthToken = (token: string) => {
  API.defaults.headers.common['Authorization'] = `Bearer ${token}`;
};

export default API;