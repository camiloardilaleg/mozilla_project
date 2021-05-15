var createError = require('http-errors');
//compresion y vulnerabilidades
var compression = require('compression');
var helmet = require('helmet');
// express
var express = require('express');

//Set up mongoose connection
var mongoose = require('mongoose');
var mongoDB = 'mongodb+srv://camiloardilaleg:pin.2002@cluster0.wp8oh.mongodb.net/local_library?retryWrites=true&w=majority';
mongoose.connect(mongoDB, { useNewUrlParser: true , useUnifiedTopology: true});
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

var app = express();
// comprime la respuesta del servidor al cliente.
app.use(compression())
app.use(helmet())

var path = require('path'); 
var cookieParser = require('cookie-parser');
var logger = require('morgan');


var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var catalogRouter = require('./routes/catalog');


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
// app.use(require('./database'))


app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/catalog', catalogRouter); 

// catch 404 and forward to error handler
app.use(function(req, res, next) { //este es un middleware añade un metodo de manejador de errores
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {}; //one line if statement

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
