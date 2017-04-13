var express = require('express');
var bodyParser = require('body-parser');
var _ = require('underscore');
var db = require('./db.js');

var app = express();
var PORT = process.env.PORT || 3000;
var todos = [];
var todoNextId = 1;

app.use(bodyParser.json())

app.get('/', function(req, res) {
  res.send('To do API Root.');
});

//GET /todos?completed=true&q=house
app.get('/todos', function(req, res) {
  var query = req.query;
  var where = {};

  if(query.hasOwnProperty('completed') && query.completed === 'true') {
    where.completed = true;
  }
  else if(query.hasOwnProperty('completed') && query.completed === 'false') {
    where.completed = false;
  }

  if(query.hasOwnProperty('q') && query.q.length > 0) {
    where.description = {
      $like: '%' + query.q + '%'
    };
  }

  db.todo.findAll({where: where}).then(function(todos) {
    res.json(todos);
  }, function(e) {
    res.status(500).send();
  });

  // var filteredTodos = todos;
  //
  // if(queryParams.hasOwnProperty('completed') && queryParams.completed === 'true')
  // {
  //   filteredTodos = _.where(filteredTodos, {completed: true});
  // }
  // else if(queryParams.hasOwnProperty('completed') && queryParams.completed === 'false')
  // {
  //   filteredTodos = _.where(filteredTodos, {completed: false});
  // }
  //
  // //Add filter for q
  // if(queryParams.hasOwnProperty('q') && queryParams.q.length > 0)
  // {
  //   filteredTodos = _.filter(filteredTodos, function(todo)
  //   {
  //     return todo.description.toLowerCase().indexOf(queryParams.q.toLowerCase()) > -1
  //   });
  // }
  //
  // res.json(filteredTodos);
});

//GET /todos/:id
app.get('/todos/:id', function(req, res) {
  var todoId = parseInt(req.params.id, 10);

  db.todo.findById(todoId).then(function(todo) {
    if(!!todo) {
      res.json(todo.toJSON());
    }
    else {
      res.status(404).send();
    }
  }, function(e) {
    res.status(500).send();
  });
});

//POST /todos
app.post('/todos', function(req, res) {
  //var body = req.body; //Use _.pick to only gather completed and description
  var body = _.pick(req.body, 'completed', 'description');

  db.todo.create({
    description: req.body.description.trim(),
    completed: req.body.completed
  }).then(function(todo) {
    res.json(todo.toJSON());
  }, function(e) {
    res.status(400).json(e);
  });

});

//DELETE /todos/:id
app.delete('/todos/:id', function(req, res) {
  var todoId = parseInt(req.params.id, 10);
  var matchedToDo = _.findWhere(todos, {id: todoId});

  if(!matchedToDo)
  {
    res.status(404).send({"error": "No todo found with that id."});
  }
  else
  {
    todos = _.without(todos, matchedToDo);
    res.json(matchedToDo);
  }
});

//PUT /todos/:id
app.put('/todos/:id', function(req, res) {
  var todoId = parseInt(req.params.id, 10);
  var matchedToDo = _.findWhere(todos, {id: todoId});
  var body = _.pick(req.body, 'completed', 'description');
  var validAttributes = {};

  if(!matchedToDo)
  {
    return res.status(404).send();
  }

  if(body.hasOwnProperty('completed') && _.isBoolean(body.completed))
  {
    validAttributes.completed = body.completed;
  }
  else if (body.hasOwnProperty('completed'))
  {
    return res.status(400).send();
  }

  if(body.hasOwnProperty('description') && _.isString(body.description) && body.description.trim().length > 0)
  {
    validAttributes.description = body.description;
  }
  else if (body.hasOwnProperty('description'))
  {
    return res.status(400).send();
  }

  //If we get here, the data is good to update
  _.extend(matchedToDo, validAttributes);

  res.json(matchedToDo);
});

db.sequelize.sync().then(function() {
  app.listen(PORT, function() {
    console.log('Express listening on port ' + PORT + '!');
  });
});
