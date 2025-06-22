
// utils/api.js - API utility for backend calls
import { getAuthToken } from './auth';

const API_BASE_URL = process.env.NEXT_PUBLIC_TELEHEALTH_API_URL || 'http://localhost:4002';

export const apiRequest = async (endpoint, options = {}) => {
  try {
    const token = await getAuthToken();
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
};
