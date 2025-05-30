// app/telehealth/api/graphql/client.js
import { ApolloClient, InMemoryCache, createHttpLink, from, HttpLink } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';
import { auth } from '../firebase/config';

// Use HttpLink instead of createHttpLink to ensure compatibility
const httpLink = new HttpLink({
  uri: process.env.NEXT_PUBLIC_TELEHEALTH_GRAPHQL_API_URL || 'http://localhost:4002/graphql',
});

// Simplified error link
const errorLink = onError(({ graphQLErrors, networkError }) => {
  if (graphQLErrors) {
    graphQLErrors.forEach(({ message, locations, path }) => {
      console.error(`[GraphQL error]: Message: ${message}, Location: ${JSON.stringify(locations)}, Path: ${path}`);
    });
  }
  
  if (networkError) {
    console.error(`[Network error]:`, networkError);
  }
});

// Simplified auth link
const authLink = setContext(async (_, { headers }) => {
  let token = '';
  
  try {
    // Get token from current user if available
    const currentUser = auth.currentUser;
    if (currentUser) {
      token = await currentUser.getIdToken();
      localStorage.setItem('ms_token', token);
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

// Create a new Apollo Client instance with simpler configuration
const client = new ApolloClient({
  link: from([errorLink, authLink, httpLink]),
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'network-only',
    },
    query: {
      fetchPolicy: 'network-only',
    },
  },
});

export default client;

