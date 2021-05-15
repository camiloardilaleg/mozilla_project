var Book = require('../models/book');
var Author = require('../models/author');
var Genre = require('../models/genre');
var BookInstance = require('../models/bookinstance');
const { body, validationResult } = require('express-validator');

var async = require('async');
const bookinstance = require('../models/bookinstance');

exports.index = function(req, res) {

    //CONTAMOS LOS DOCUMENTOS EN UNA PETICIÓN ASINCRONA DE LOS MODELOS
    async.parallel({
        book_count: function(callback) {
            Book.countDocuments({}, callback); // Pass an empty object as match condition to find all documents of this collection
        },
        book_instance_count: function(callback) {
            BookInstance.countDocuments({}, callback);
        },
        book_instance_available_count: function(callback) {
            BookInstance.countDocuments({status:'Available'}, callback);
        },
        author_count: function(callback) {
            Author.countDocuments({}, callback);
        },
        genre_count: function(callback) {
            Genre.countDocuments({}, callback);
        }
    }, //LOS RESULTAMOS DE LAS PETICIONES SON ALMACENADAS EN RESULTS
        function(err, results) {
        // console.log(results)
        res.render('index', { title: 'Local Library Home', error: err, data: results });
    });
};

// Display list of all books.
// Display list of all Books.
exports.book_list = function(req, res, next) {

    Book.find({}, 'title author')
      .populate('author') //completa la información del autor
      .exec(function (err, list_books) {
        if (err) { return next(err); }
        //Successful, so render
        res.render('book_list', { title: 'Book List', book_list: list_books });
      });
  
  };


// Display detail page for a specific book.
exports.book_detail = function(req, res, next) {

    async.parallel({
        book: function(callback) {

            Book.findById(req.params.id)
              .populate('author')
              .populate('genre')
              .exec(callback);
        },
        book_instance: function(callback) {

          BookInstance.find({ 'book': req.params.id })
          .exec(callback);
        },
    }, function(err, results) {
        if (err) { return next(err); }
        if (results.book==null) { // No results.
            var err = new Error('Book not found');
            err.status = 404;
            return next(err); //pasa el error al siguiente middleware
        }
        // Successful, so render.
        res.render('book_detail', { title: results.book.title, book: results.book, book_instances: results.book_instance } );
    });

};

// Display book create form on GET.
exports.book_create_get = function(req, res, next) {

    // Get all authors and genres, which we can use for adding to our book.
    async.parallel({
        authors: function(callback) {
            Author.find(callback);
        },
        genres: function(callback) {
            Genre.find(callback);
        },
    }, function(err, results) {
        if (err) { return next(err); }
        res.render('book_form', { title: 'Create Book', authors: results.authors, genres: results.genres });
    });

};

// Handle book create on POST.
exports.book_create_post = [
    // Convert the genre to an array.
    (req, res, next) => {
        if(!(req.body.genre instanceof Array)){
            if(typeof req.body.genre ==='undefined')
            req.body.genre = [];
            else
            req.body.genre = new Array(req.body.genre);
        }
        next();
    },

    // Validate and sanitise fields.
    //  trim hace los escapes de HTML
    body('title', 'Title must not be empty.').trim().isLength({ min: 1 }).escape(),
    body('author', 'Author must not be empty.').trim().isLength({ min: 1 }).escape(),
    body('summary', 'Summary must not be empty.').trim().isLength({ min: 1 }).escape(),
    body('isbn', 'ISBN must not be empty').trim().isLength({ min: 1 }).escape(),
    body('genre.*').escape(),
    //sanitiza cada unos de los elmentos de genre

    // Process request after validation and sanitization.
    (req, res, next) => {

        // Extract the validation errors from a request.
        const errors = validationResult(req);

        // Create a Book object with escaped and trimmed data.
        var book = new Book(
          { title: req.body.title,
            author: req.body.author,
            summary: req.body.summary,
            isbn: req.body.isbn,
            genre: req.body.genre
           }); //al final req.body.algo toma el valor del nombre de la etiqueta

        if (!errors.isEmpty()) {
            // There are errors. Render form again with sanitized values/error messages.

            // Get all authors and genres for form.
            async.parallel({
                authors: function(callback) {
                    Author.find(callback);
                },
                genres: function(callback) {
                    Genre.find(callback);
                },
            }, function(err, results) {
                if (err) { return next(err); }

                // Mark our selected genres as checked.
                // console.log(`Estos son los libros en book.genre ${book.genre} y este son los de results ${results.genres}`)
                for (let i = 0; i < results.genres.length; i++) {
                    if (book.genre.indexOf(results.genres[i]._id) > -1) {
                        // indexOf examina si el argumento, está en el arreglo
                        results.genres[i].checked='true';
                    }
                }
                res.render('book_form', { title: 'Create Book',authors:results.authors, genres:results.genres, book: book, errors: errors.array() });
            });
            return;
        }
        else {
            // Data from form is valid. Save book.
            book.save(function (err) {
                if (err) { return next(err); }
                   //successful - redirect to new book record.
                   res.redirect(book.url);
                });
        }
    }
];

// Display book delete form on GET.
exports.book_delete_get = function(req, res, next) {
    
    async.parallel({
        book: function(callback){
            Book.findById(req.params.id).exec(callback);
        },
        bookinstances_book: function(callback){
            BookInstance.find({'book': req.params.id}).exec(callback);
        }
    }, function(err, results){
        if (err){return next(err);}
        if (results.book==null){
            res.redirect('/catalog/books');
        } else {
            res.render('book_delete', {title: 'Delete Book', book: results.book, bookinstances: results.bookinstances_book})
        }
    })

};

// Handle book delete on POST.
exports.book_delete_post = function(req, res, next) {
    async.parallel({
        book: function(callback){
            Book.findById(req.body.authorid).exec(callback);
        },
        bookinstances_book: function(callback){
            BookInstance.find({'book': req.body.authorid}).exec(callback)
        }
    }, function(err, results){
        if (err){return next(err);}
        if (results.bookinstances_book.length > 0){ //hay libros aun
            res.render('book_delete', {title: 'Delete Book', book: results.book, bookinstances: results.bookinstances_book})
        } else { //no hay libros
            // Book.findByIdAndRemove(req.body.authorid, function(err){
            //     if (err){return next(err);}
            //     res.redirect('/catalog/books')
            
            // SON DOS MANERA DE HACER EL CALLBACK
            Book.findByIdAndRemove(req.body.authorid).exec(function(err) {
                if (err){return next(err);}
                res.redirect('/catalog/books')});
            
        }
    });
};

// Display book update form on GET.
exports.book_update_get = function(req, res, next) {

    // Get book, authors and genres for form.
    async.parallel({
        book: function(callback) {
            // retorna el libro seleccionado
            Book.findById(req.params.id).populate('author').populate('genre').exec(callback);
        },
        authors: function(callback) {
            // retorna TODOS los autores de la BD.
            Author.find(callback);
        },
        genres: function(callback) {
            // retorn los generos en la base de datos.
            Genre.find(callback);
        },
        }, function(err, results) {
            if (err) { return next(err); }
            if (results.book==null) { // No results.
                var err = new Error('Book not found');
                err.status = 404;
                return next(err);
            }
            // Success.
            // Mark our selected genres as checked.
                // itera sobre todos los géneros de la BD.
            for (let all_g_iter = 0; all_g_iter < results.genres.length; all_g_iter++) {
                // itera sobre todos los generos del libro.
                for (let book_g_iter = 0; book_g_iter < results.book.genre.length; book_g_iter++) {
                    // compara si un genero del TOTAL está dentro de los generos del libro.
                    if (results.genres[all_g_iter]._id.toString()===results.book.genre[book_g_iter]._id.toString()) {
                        // crea un atributo para los generos seleccionados.
                        results.genres[all_g_iter].checked='true';
                    }
                }
            }
            res.render('book_form', { title: 'Update Book', authors: results.authors, genres: results.genres, book: results.book });
        });

};

// Handle book update on POST.
exports.book_update_post = [

    // Convert the genre to an array
    (req, res, next) => {
        // si NO es una instancia de array
        if(!(req.body.genre instanceof Array)){
            // si es infefinido (vacio), devuelve un array vacio
            if(typeof req.body.genre==='undefined')
            req.body.genre=[];
            // crea un array
            else
            req.body.genre=new Array(req.body.genre);
        }
        next();
    },

    // Validate and sanitise fields.
    body('title', 'Title must not be empty.').trim().isLength({ min: 1 }).escape(),
    body('author', 'Author must not be empty.').trim().isLength({ min: 1 }).escape(),
    body('summary', 'Summary must not be empty.').trim().isLength({ min: 1 }).escape(),
    body('isbn', 'ISBN must not be empty').trim().isLength({ min: 1 }).escape(),
    body('genre.*').escape(),

    // Process request after validation and sanitization.
    (req, res, next) => {

        // Extract the validation errors from a request.
        const errors = validationResult(req);

        // Create a Book object with escaped/trimmed data and old id.
        var book = new Book(
          { title: req.body.title,
            author: req.body.author,
            summary: req.body.summary,
            isbn: req.body.isbn,
            genre: (typeof req.body.genre==='undefined') ? [] : req.body.genre,
            _id:req.params.id //This is required, or a new ID will be assigned!
           });

        if (!errors.isEmpty()) {
            // There are errors. Render form again with sanitized values/error messages.

            // Get all authors and genres for form.
            async.parallel({
                authors: function(callback) {
                    Author.find(callback);
                },
                genres: function(callback) {
                    Genre.find(callback);
                },
            }, function(err, results) {
                if (err) { return next(err); }

                // Mark our selected genres as checked.
                for (let i = 0; i < results.genres.length; i++) {
                    if (book.genre.indexOf(results.genres[i]._id) > -1) {
                        results.genres[i].checked='true';
                    }
                }
                res.render('book_form', { title: 'Update Book',authors: results.authors, genres: results.genres, book: book, errors: errors.array() });
            });
            return;
        }
        else {
            // Data from form is valid. Update the record.
            Book.findByIdAndUpdate(req.params.id, book, {}, function (err,thebook) {
                if (err) { return next(err); }
                   // Successful - redirect to book detail page.
                   res.redirect(thebook.url);
                });
        }
    }
];