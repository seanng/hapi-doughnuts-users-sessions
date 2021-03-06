var Joi = require('joi');
var Auth = require('./auth');

exports.register = function (server, options, next) {
  server.route([
    {
      method: 'GET',
      path: '/api/doughnuts',
      handler: function (request, reply) {
        var db = request.server.plugins['hapi-mongodb'].db;

        db.collection('doughnuts').find().toArray(function (err, results) {
          if (err) { return reply(err); }
          reply(results);
        });
      }
    },
    {
      method: 'POST',
      path: '/api/doughnuts',
      handler: function (request, reply) {
        Auth.authenticated(request, function(result) {
          if (result.authenticated) {
            //create a post
            var db       = request.server.plugins['hapi-mongodb'].db;
            var ObjectID = request.server.plugins['hapi-mongodb'].ObjectID;
            var session  = request.yar.get('hapi_doughnuts_session');

            var doughnut = {
              user_id : ObjectID(session.user_id),
              style   : request.payload.style,
              flavor  : request.payload.flavor
            };

            db.collection('doughnuts').insert(doughnut, function (err, doc) {
              if (err) { return reply(err); }
              reply(doc.ops[0]);
            });
          } else {
            // can't create a post if you're not logged in
            reply(result).code(400);
          }
        });
      }
    },
    {
      method: 'DELETE',
      path: '/api/doughnuts/{id}',
      handler: function (request, reply) {
        Auth.authenticated(request, function(result) {
          if (result.authenticated) { // logging in
            var db       = request.server.plugins['hapi-mongodb'].db;
            var ObjectID = request.server.plugins['hapi-mongodb'].ObjectID;
            var session  = request.yar.get('hapi_doughnuts_session');

            var id       = ObjectID(request.params.id);
            var user_id  = ObjectID(session.user_id);


            //find the doughnut
            db.collection('doughnuts').findOne({"_id": id}, function (err, doughnut) {
              if (err) { return reply(err).code(400); }

              //check if doughnut exists
              if (doughnut === null) {
                return reply({message: 'There is no doughnut.'}).code(404);
              }

              //if doughnut's user_id is the same as current user, then remove doughnut
              if(doughnut.user_id.toString() === user_id.toString()) { //your doughnut
                db.collection('doughnuts').remove({"_id": id}, function (err, doc) {
                  if (err) { return reply(err).code(400); }
                  reply(doc);
                });
              } else { //not your doughnut
                reply({message: "This is not your doughnut"}).code(400);
              }
            });
          } else {
            reply(result).code(400);
          }
        })
      }
    },
    {
      method: 'PUT',
      path: '/api/doughnuts/{id}',
      handler: function (request, reply) {
        Auth.authenticated(request, function(result) {
          if (result.authenticated) {
            var db       = request.server.plugins['hapi-mongodb'].db;
            var ObjectID = request.server.plugins['hapi-mongodb'].ObjectID;
            var session  = request.yar.get('hapi_doughnuts_session');

            var id       = ObjectID(request.params.id);
            var user_id  = ObjectID(session.user_id);
            var updateDoughnut = {
              style: request.payload.style,
              flavor: request.payload.flavor
            };

            db.collection('doughnuts').findOne({"_id": id}, function (err, doughnut) {
              if (err) { return reply(err).code(400); }

              //check if doughnut exists
              if (doughnut === null) {
                return reply({message: 'There is no doughnut.'}).code(404);
              }

              //if doughnut's user_id is the same as current user, then remove doughnut
              if(doughnut.user_id.toString() === user_id.toString()) { //your doughnut
                db.collection('doughnuts').update({"_id": id}, {$set:updateDoughnut}, function (err, doughnut) {
                  if (err) { return reply(err).code(400); }
                  reply(doughnut).code(200);
                });
              } else {
                reply ({message: "This is not your doughnut."}).code(400);
              }
            });
          }
          else {
            reply(result).code(400);
          }
        })
      }
    }
  ]);

  next();
};

exports.register.attributes = {
  name: 'doughnuts-api',
  version: '0.0.1'
};