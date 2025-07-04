// app/medical-supplies/api/graphql/client.js
import { ApolloClient, InMemoryCache, createHttpLink, from, HttpLink } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';
import { auth } from '../firebase/config';
import { authLink } from '../../utils/auth';

// Use HttpLink instead of createHttpLink to ensure compatibility
const httpLink = new HttpLink({
  uri: process.env.NEXT_PUBLIC_MEDICAL_SUPPLIES_GRAPHQL_API_URL,
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

