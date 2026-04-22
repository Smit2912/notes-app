import axios from 'axios';

const API = axios.create({
  baseURL: process.env.NEXT_PUBLIC_SUPABASE_FUNCTIONS_URL,
  headers: {
    'Content-Type': 'application/json',
    // THIS IS THE MISSING PIECE:
    'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, 
  }
});

export const setAuthToken = (token: string) => {
  API.defaults.headers.common['Authorization'] = `Bearer ${token}`;
};

export default API;