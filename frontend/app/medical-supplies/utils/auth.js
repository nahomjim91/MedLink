// utils/auth.js - Firebase auth utility
import { auth } from '../api/firebase/config';

export const getAuthToken = async () => {
  try {
    const currentUser = auth.currentUser;
    if (currentUser) {
      const token = await currentUser.getIdToken(true); // Force refresh
      return token;
    }
    
    // Fallback to localStorage if user not immediately available
    if (typeof window !== 'undefined') {
      const storedToken = localStorage.getItem('ms_token');
      return storedToken;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
};