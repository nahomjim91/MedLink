// /graphql/helpers/authHelpers.js
const { AuthenticationError, ForbiddenError } = require('apollo-server-express');

/**
 * Verifies that the user is authenticated
 * @param {Object} context - GraphQL context containing user info
 * @returns {Object} - The authenticated user object
 * @throws {AuthenticationError} - If user is not authenticated
 */
const isAuthenticated = async (context) => {
  if (!context.user || !context.user.uid) {
    throw new AuthenticationError('You must be logged in to perform this action');
  }
  return context.user;
};

/**
 * Verifies that the user has one of the specified roles
 * @param {Object} context - GraphQL context containing user info
 * @param {Array<String>} roles - Array of role names the user must have at least one of
 * @returns {Object} - The authenticated user object
 * @throws {ForbiddenError} - If user doesn't have the required role
 */
const hasRole = async (context, roles) => {
  const user = await isAuthenticated(context);
  
  // If no specific roles required or user is admin, allow
  if (!roles.length || user.role === 'admin') {
    return user;
  }

  // Check if user has at least one of the required roles
  if (!user.role || !roles.includes(user.role)) {
    throw new ForbiddenError(`Access denied. Required roles: ${roles.join(', ')}`);
  }
  
  return user;
};

/**
 * Verifies that the user has importer or supplier role (or is admin)
 * @param {Object} context - GraphQL context containing user info
 * @returns {Object} - The authenticated user object
 * @throws {ForbiddenError} - If user doesn't have the required role
 */
const isImporterOrSupplier = async (context) => {
  return hasRole(context, ['importer', 'supplier', 'admin']);
};

/**
 * Verifies ownership of a resource or admin status
 * @param {Object} context - GraphQL context containing user info
 * @param {String} ownerId - ID of the resource owner
 * @returns {Object} - The authenticated user object
 * @throws {ForbiddenError} - If user isn't the owner and isn't an admin
 */
const isOwnerOrAdmin = async (context, ownerId) => {
  const user = await isAuthenticated(context);
  
  // Admin can do anything
  if (user.role === 'admin') {
    return user;
  }
  
  // Check ownership
  if (user.uid !== ownerId) {
    throw new ForbiddenError('You do not have permission to perform this action');
  }
  
  return user;
};

module.exports = {
  isAuthenticated,
  hasRole,
  isImporterOrAdmin: isImporterOrSupplier, // Alias for backward compatibility
  isImporterOrSupplier,
  isOwnerOrAdmin
};