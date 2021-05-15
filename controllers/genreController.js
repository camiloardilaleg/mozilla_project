var Book = require('../models/book');
var async = require('async');
var Genre = require('../models/genre');
const { body, validationResult } = require('express-validator');

// Display list of all Genre.
exports.genre_list = function (req, res, next) {
  Genre.find()
    .sort([['name', 'ascending']]) //oredenamos de manera ascendente
    .exec(function (err, list_genre) {
      if (err) { return next(err); }
      res.render('genre_list', { title: 'Genre List', genre_list: list_genre })
    });
};

// Display detail page for a specific Genre.
exports.genre_detail = function (req, res, next) {

  async.parallel({
    genre: function (callback) {
      Genre.findById(req.params.id)
        .exec(callback);
    },

    genre_books: function (callback) {
      Book.find({ 'genre': req.params.id })
        .exec(callback);
    },

  }, function (err, results) {
    if (err) { return next(err); }
    if (results.genre == null) { // No results.
      var err = new Error('Genre not found');
      err.status = 404;
      return next(err);
    }
    // Successful, so render
    res.render('genre_detail', { title: 'Genre Detail', genre: results.genre, genre_books: results.genre_books });
  });

};

// Display Genre create form on GET.
exports.genre_create_get = function (req, res, next) {
  res.render('genre_form', { title: 'Create Genre' });
};

// Handle Genre create on POST.
// Handle Genre create on POST.
exports.genre_create_post = [

  // Validate and santize the name field.
  body('name', 'Genre name required').trim().isLength({ min: 1 }).escape(),

  // Process request after validation and sanitization.
  (req, res, next) => {

    // Extract the validation errors from a request.
    const errors = validationResult(req);
    // console.log(errors.isEmpty());

    // Create a genre object with escaped and trimmed data.
    var genre = new Genre(
      { name: req.body.name }
    );

    if (!errors.isEmpty()) { //.isEmpty() si está vacio True, es porque todo está bien
      // There are errors. Render the form again with sanitized values/error messages.
      res.render('genre_form', { title: 'Create Genre', genre: genre, errors: errors.array() });
      return;
    }
    else {
      // Data from form is valid.
      // Check if Genre with same name already exists.
      Genre.findOne({ 'name': req.body.name })
        .exec(function (err, found_genre) {
          if (err) { return next(err); }

          if (found_genre) {
            // Genre exists, redirect to its detail page.
            res.redirect(found_genre.url);
          }
          else {

            genre.save(function (err) {
              if (err) { return next(err); }
              // Genre saved. Redirect to genre detail page.
              res.redirect(genre.url);
            });

          }

        });
    }
  }
];

// Display Genre delete form on GET.
exports.genre_delete_get = function (req, res, next) {
  // obtiene el genero con el Id; y los libros pertenecientes al genero.
  async.parallel({

    genre: function (callback) {
      Genre.findById(req.params.id).exec(callback);
    },
    genre_books: function (callback) {
      Book.find({ 'genre': req.params.id }).exec(callback)
    }
  }, function (err, results) { // error si existe, caso contario los almacena en resultados
    if (err) { return next(err); }
    if (results.genre == null) {
      res.redirect('/catalog/genres')
    }

    // renderiza pagina con los resultados obtenidos.
    res.render('genre_delete', { title: 'Delete Genre', genre: results.genre, genre_books: results.genre_books });
  });
};

// Handle Genre delete on POST.
exports.genre_delete_post = function (req, res, next) {

  async.parallel({
    genre: function (callback) {
      Genre.findById(req.body.authorid).exec(callback);
    },
    genre_books: function (callback) {
      Book.find({ 'genre': req.body.authorid }).exec(callback)
    }
  }, function (err, results) {
    if (err) { return next(err); }
    if (results.genre_books.length > 0) {
      //itene todavia libros
      res.render('genre_delete', { title: 'Delete Genre', genre: results.genre, genre_books: results.genre_books });
      return;
    } else {
      Genre.findByIdAndRemove(req.body.authorid, function deleteGenre(err) {
        if (err) { return next(err); }
        res.redirect('/catalog/genres')
      })
    }
  })
};

// Display Genre update form on GET.
exports.genre_update_get = function (req, res) {
  async.parallel(
    {
      genre: function (callback) { Genre.findById(req.params.id).exec(callback); }
    }, function (err, result) {
      if (err) { return next(err) };
      res.render('genre_form', { genre: result.genre });
    }
  )
};

// Handle Genre update on POST.
exports.genre_update_post = [
  // sanitiza valores entrantes
  body('name', 'Name is not usefull').trim().isLength({ min: 3 }).escape(),

  // capturamos errores
  (req, res, next) => {
    errors = validationResult(req);

    if (!errors.isEmpty()) {
      //hay errores
      res.render('genre_form', { genre: req.body, errors: errors.array() })
    } else {
      // crea una instancia de genre
      let genre = new Genre(
        { name: req.body.name,
        _id: req.params.id }
      );
      // valida si ya existe
      Genre.findOne({ 'name': req.body.name })
        .exec(function (err, found_genre) {
          if (err) { return next(err); }

          if (found_genre) {
            // Genre exists, redirect to its detail page.
            res.redirect(found_genre.url);
          }
          else {

            Genre.findByIdAndUpdate(req.params.id, genre, function (err) {
              if (err) { return next(err); }
              // Genre saved. Redirect to genre detail page.
              res.redirect(genre.url);
            });

          }

        });
    }
  }
];