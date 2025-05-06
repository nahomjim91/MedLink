// app/telehealth/api/apolloProvider.js
'use client';

import { ApolloProvider } from '@apollo/client';
import client from './graphql/client';

export function ApolloWrapper({ children }) {
  return (
    <ApolloProvider client={client}>
      {children}
    </ApolloProvider>
  );
}