var makeExecutableSchema    = require('graphql-tools').makeExecutableSchema

module.exports = function (app) {
  return makeExecutableSchema({
    typeDefs:   require('./typedefs'),
    resolvers:  require('./resolvers')(app.models)
  })
}