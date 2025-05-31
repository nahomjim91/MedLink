// utils/auth.js - Firebase auth utility
import { setContext } from '@apollo/client/link/context';
import { auth } from '../api/firebase/config';

export const authLink = setContext(async (_, { headers }) => {
  let token = '';
  
  try {
    // Get token from current user if available
    const currentUser = auth.currentUser;
    if (currentUser) {
      token = await currentUser.getIdToken();
      localStorage.setItem('token', token);
    } else if (typeof window !== 'undefined') {
      // Fallback to localStorage
      const storedToken = localStorage.getItem('ms_token');
      if (storedToken) {
        token = storedToken;
      }
    }
  } catch (error) {
    console.error('Error getting auth token:', error);
  }
  
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
    }
  };
});

export const getAuthToken = async () => {
  let token = '';
  
  try {
    // Get token from current user if available
    const currentUser = auth.currentUser;
    if (currentUser) {
      token = await currentUser.getIdToken();
      localStorage.setItem('token', token);
    } else if (typeof window !== 'undefined') {
      // Fallback to localStorage
      const storedToken = localStorage.getItem('ms_token');
      if (storedToken) {
        token = storedToken;
      }
    }
  } catch (error) {
    console.error('Error getting auth token:', error);
  }
  
  return token;
};