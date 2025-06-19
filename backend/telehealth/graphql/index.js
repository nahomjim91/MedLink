// /graphql/index.js
const { ApolloServer } = require('apollo-server-express');
const typeDefs = require('./schemas');
const resolvers = require('./resolvers');
const { createContext } = require('../middleware/auth');

/**
 * Create and configure Apollo Server
 * @param {Object} app - Express application
 */
const setupApolloServer = async (app) => {
  // Create Apollo Server
  const server = new ApolloServer({
    typeDefs,
    resolvers,
    context: createContext,
    formatError: (error) => {
      console.error('GraphQL Error:', error);
      
      // Return sanitized error message in production
      if (process.env.NODE_ENV === 'production') {
        if (error.extensions.code === 'INTERNAL_SERVER_ERROR') {
          return {
            message: 'Internal server error',
            extensions: { code: 'INTERNAL_SERVER_ERROR' }
          };
        }
      }
      
      return error;
    },
    plugins: [
      {
        // Basic logging plugin
        requestDidStart(requestContext) {
          console.log(`Request started: ${requestContext.request.operationName}`);
          
          return {
            didEncounterErrors(context) {
              console.error('Apollo Server encountered errors:', context.errors);
            },
            willSendResponse(context) {
              console.log(`Request completed: ${requestContext.request.operationName}`);
            }
          };
        }
      }
    ]
  });

  // Start the server
  await server.start();
  
  // Apply middleware to Express app
  server.applyMiddleware({ app, path: '/graphql' });
  
  console.log(`Apollo Server ready at http://localhost:${process.env.TELEHEALTH_SERVER_PORT||4002}${server.graphqlPath}`);
  
  return server;
};

module.exports = setupApolloServer;
