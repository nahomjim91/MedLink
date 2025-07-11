Apollo Server encountered errors: [
  Error: Cannot return null for non-nullable field Query.productRatings.     
      at completeValue (C:\Users\Selihom\Desktop\SeniorProject\Testing Env\MEDLINK\backend\node_modules\graphql\execution\execute.js:613:13)
      at executeField (C:\Users\Selihom\Desktop\SeniorProject\Testing Env\MEDLINK\backend\node_modules\graphql\execution\execute.js:508:19)
      at executeFields (C:\Users\Selihom\Desktop\SeniorProject\Testing Env\MEDLINK\backend\node_modules\graphql\execution\execute.js:422:22)
      at executeOperation (C:\Users\Selihom\Desktop\SeniorProject\Testing Env\MEDLINK\backend\node_modules\graphql\execution\execute.js:352:14)
      at execute (C:\Users\Selihom\Desktop\SeniorProject\Testing Env\MEDLINK\backend\node_modules\graphql\execution\execute.js:136:20)
      at execute (C:\Users\Selihom\Desktop\SeniorProject\Testing Env\MEDLINK\backend\node_modules\apollo-server-core\dist\requestPipeline.js:207:48)      
      at processGraphQLRequest (C:\Users\Selihom\Desktop\SeniorProject\Testing Env\MEDLINK\backend\node_modules\apollo-server-core\dist\requestPipeline.js:150:34)
      at process.processTicksAndRejections (node:internal/process/task_queues:105:5)
      at async processHTTPRequest (C:\Users\Selihom\Desktop\SeniorProject\Testing Env\MEDLINK\backend\node_modules\apollo-server-core\dist\runHttpQuery.js:222:30) {
    path: [ 'productRatings' ],
    locations: [ [Object] ],
    extensions: [Object: null prototype] {}
  }
]
GraphQL Error: [GraphQLError: Cannot return null for non-nullable field Query.productRatings.] {
  locations: [ { line: 2, column: 3 } ],
  path: [ 'productRatings' ],
  extensions: { code: 'INTERNAL_SERVER_ERROR', exception: { stacktrace: [Array] } }
}
Request completed: GetProductRatings
Request started: GetProductRatingStats
Apollo Server encountered errors: [
  Error: Cannot return null for non-nullable field Query.productRatingStats. 
      at completeValue (C:\Users\Selihom\Desktop\SeniorProject\Testing Env\MEDLINK\backend\node_modules\graphql\execution\execute.js:613:13)
      at executeField (C:\Users\Selihom\Desktop\SeniorProject\Testing Env\MEDLINK\backend\node_modules\graphql\execution\execute.js:508:19)
      at executeFields (C:\Users\Selihom\Desktop\SeniorProject\Testing Env\MEDLINK\backend\node_modules\graphql\execution\execute.js:422:22)
      at executeOperation (C:\Users\Selihom\Desktop\SeniorProject\Testing Env\MEDLINK\backend\node_modules\graphql\execution\execute.js:352:14)
      at execute (C:\Users\Selihom\Desktop\SeniorProject\Testing Env\MEDLINK\backend\node_modules\graphql\execution\execute.js:136:20)
      at execute (C:\Users\Selihom\Desktop\SeniorProject\Testing Env\MEDLINK\backend\node_modules\apollo-server-core\dist\requestPipeline.js:207:48)      
      at processGraphQLRequest (C:\Users\Selihom\Desktop\SeniorProject\Testing Env\MEDLINK\backend\node_modules\apollo-server-core\dist\requestPipeline.js:150:34)
      at process.processTicksAndRejections (node:internal/process/task_queues:105:5)
      at async processHTTPRequest (C:\Users\Selihom\Desktop\SeniorProject\Testing Env\MEDLINK\backend\node_modules\apollo-server-core\dist\runHttpQuery.js:222:30) {
    path: [ 'productRatingStats' ],
    locations: [ [Object] ],
    extensions: [Object: null prototype] {}
  }
]
GraphQL Error: [GraphQLError: Cannot return null for non-nullable field Query.productRatingStats.] {
  locations: [ { line: 2, column: 3 } ],
  path: [ 'productRatingStats' ],
  extensions: { code: 'INTERNAL_SERVER_ERROR', exception: { stacktrace: [Array] } }
}
Request completed: GetProductRatingStats
Request started: GetMyRatings
Apollo Server encountered errors: [
  Error: Cannot return null for non-nullable field Query.myRatings.
      at completeValue (C:\Users\Selihom\Desktop\SeniorProject\Testing Env\MEDLINK\backend\node_modules\graphql\execution\execute.js:613:13)
      at executeField (C:\Users\Selihom\Desktop\SeniorProject\Testing Env\MEDLINK\backend\node_modules\graphql\execution\execute.js:508:19)
      at executeFields (C:\Users\Selihom\Desktop\SeniorProject\Testing Env\MEDLINK\backend\node_modules\graphql\execution\execute.js:422:22)
      at executeOperation (C:\Users\Selihom\Desktop\SeniorProject\Testing Env\MEDLINK\backend\node_modules\graphql\execution\execute.js:352:14)
      at execute (C:\Users\Selihom\Desktop\SeniorProject\Testing Env\MEDLINK\backend\node_modules\graphql\execution\execute.js:136:20)
      at execute (C:\Users\Selihom\Desktop\SeniorProject\Testing Env\MEDLINK\backend\node_modules\apollo-server-core\dist\requestPipeline.js:207:48)      
      at processGraphQLRequest (C:\Users\Selihom\Desktop\SeniorProject\Testing Env\MEDLINK\backend\node_modules\apollo-server-core\dist\requestPipeline.js:150:34)
      at process.processTicksAndRejections (node:internal/process/task_queues:105:5)
      at async processHTTPRequest (C:\Users\Selihom\Desktop\SeniorProject\Testing Env\MEDLINK\backend\node_modules\apollo-server-core\dist\runHttpQuery.js:222:30) {
    path: [ 'myRatings' ],
    locations: [ [Object] ],
    extensions: [Object: null prototype] {}
  }
]
GraphQL Error: [GraphQLError: Cannot return null for non-nullable field Query.myRatings.] {
  locations: [ { line: 2, column: 3 } ],
  path: [ 'myRatings' ],
  extensions: { code: 'INTERNAL_SERVER_ERROR', exception: { stacktrace: [Array] } }
}