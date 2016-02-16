var Auth = require('./api/auth');

exports.register = function (server, options, next) {
  // serving static files
  server.route([
    {
      // serving static files
      method: 'GET',
      path: "/public/{path*}",
      handler: {
        directory: {
          path: 'public'
        }
      }
    },
    {
      // Retrieve all users
      method: 'GET',
      path: '/',
      handler: function(request, reply) {
        Auth.authenticated(request, function (result) {
          if (result.authenticated) {
             //307 is for redirection
            reply.redirect('/doughnuts').code(307);
          } else {
            reply.view('index', {message: request.query.message}).code(200);
          }
        });
      }
    },
    {
      // Retrieve all doughnuts
      method: 'GET',
      path: '/doughnuts',
      handler: function(request, reply) {
        Auth.authenticated(request, function (result) {
          if (result.authenticated){
            reply.view('doughnuts').code(200);
          } else {
            reply.redirect('/?message=Please Log In First').code(307);
          }
        })
      }
    }
  ]);

  next();
};

exports.register.attributes = {
  name: 'static-files-api',
  version: '0.0.1'
};