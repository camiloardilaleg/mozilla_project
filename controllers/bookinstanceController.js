var BookInstance = require('../models/bookinstance');
var Book = require('../models/book');
var async = require('async')
const { DateTime } = require('luxon');
const { body, validationResult } = require('express-validator');

// Display list of all BookInstances.
exports.bookinstance_list = function(req, res, next) {

    BookInstance.find()
      .populate('book')
      .exec(function (err, list_bookinstances) {
        if (err) { return next(err); }
        // Successful, so render
        res.render('bookinstance_list', { title: 'Book Instance List', bookinstance_list: list_bookinstances });
      });
  
};

// Display detail page for a specific BookInstance.
exports.bookinstance_detail = function(req, res, next) {

    BookInstance.findById(req.params.id)
    .populate('book')
    .exec(function (err, bookinstance) {
      if (err) { return next(err); }
      if (bookinstance==null) { // No results.
          var err = new Error('Book copy not found');
          err.status = 404;
          return next(err);
        }
      // Successful, so render.
      res.render('bookinstance_detail', { title: 'Copy: '+bookinstance.book.title, bookinstance:  bookinstance});
    })

};

// Display BookInstance create form on GET.
exports.bookinstance_create_get = function(req, res, next) {
    
    Book.find({}, 'title')
    .exec(function(err, books) { 
        if (err) { return next(err);}
        //books es un arreglo
        //succes
        res.render('bookinstance_form', {title: 'Create Bookinstance', book_list: books});
    })

};

// Handle BookInstance create on POST.
exports.bookinstance_create_post = [

    // Validate and sanitise fields.
    body('book', 'Book must be specified').trim().isLength({ min: 1 }).escape(),
    body('imprint', 'Imprint must be specified').trim().isLength({ min: 1 }).escape(),
    body('status').escape(),
    body('due_back', 'Invalid date').optional({ checkFalsy: true }).isISO8601().toDate(),

    // Process request after validation and sanitization.
    (req, res, next) => {

        // Extract the validation errors from a request.
        const errors = validationResult(req);

        // Create a BookInstance object with escaped and trimmed data.
        var bookinstance = new BookInstance(
          { book: req.body.book,
            imprint: req.body.imprint,
            status: req.body.status,
            due_back: req.body.due_back
           });

        if (!errors.isEmpty()) {
            // There are errors. Render form again with sanitized values and error messages.
            Book.find({},'title')
                .exec(function (err, books) {
                    if (err) { return next(err); }
                    // Successful, so render.
                    res.render('bookinstance_form', { title: 'Create BookInstance', book_list: books, selected_book: bookinstance.book._id , errors: errors.array(), bookinstance: bookinstance });
            });
            return;
        }
        else {
            // Data from form is valid.
            bookinstance.save(function (err) {
                if (err) { return next(err); }
                   // Successful - redirect to new record.
                   res.redirect(bookinstance.url);
                });
        }
    }
];

// Display BookInstance delete form on GET.
exports.bookinstance_delete_get = function(req, res, next) {
    
    async.parallel(
        {
        book_instance: function(callback){
            BookInstance.findById(req.params.id).exec(callback);
            }
        },
        function(err, results){
            // console.log(results.book_instance);
            if (err){return next(err);};
            if (results.book_instance == null){ // no bookinstance
                res.redirect('/catalog/bookinstances');
            } else {
                // renderiza la pagina con la copia que se debe eliminar
                res.render('bookinstance_delete', {Title: 'Delete BookInstance', bookinstance: results.book_instance});
            }
        }

    )
};

// Handle BookInstance delete on POST.
exports.bookinstance_delete_post = function(req, res, next) {
    async.parallel(
        {
            book_instance: function(callback){
                BookInstance.findById(req.body.authorid).exec(callback);
            }
        }, 
        function(err, result){
            if (err){return next(err);}
            if (result.book_instance == null){
                res.redirect('/catalog/bookinstances');
            } else {
                BookInstance.findByIdAndRemove(req.body.authorid).exec(
                    function(err){
                        if (err) {return next(err);}
                    res.redirect('/catalog/bookinstances')
                    }
                )
            }
        }
    )
};

// Display BookInstance update form on GET.
exports.bookinstance_update_get = function(req, res, next) {
    // obtiene valores para renderizar pagina.
    async.parallel(
        {
            books: function(callback){
                Book.find({}, 'title').exec(callback);
            },
            bookinstance: function(callback){
                BookInstance.findById(req.params.id).exec(callback)
            }
        }, function(err, results){
            if (err) return next(err);
            //  Renderiza la página con los resultados.
            res.render('bookinstance_form', {title: 'Update bookinstance', bookinstance: results.bookinstance, book_list: results.books})
        }
    );
    
};

// Handle bookinstance update on POST.
exports.bookinstance_update_post = [

    //sanitiza los valores de entrada.
    body('book', 'Book must be specified').trim()
    .isLength({min: 3}).escape(),
    body('imprint', 'Imprint must be specified').trim()
    .isLength({ min: 1 }).escape(),
    body('status').escape(),
    body('due_back', 'Invalid date')
    .optional({ checkFalsy: true }).isISO8601().toDate(),

    // comprueba errores y actualizar valores
    (req, res, next) => {
        
        // capture errors
        const errors = validationResult(req);
        
        //check if errors are presents.
        if (!errors.isEmpty()){
            Book.find({}, 'title', function(err, books){
                if (err) return next(err);
                // crea el atributo due_back_formatted
                req.body.due_back_formatted = DateTime.fromJSDate(req.body.due_back).toFormat('yyyy-MM-dd');
                res.render('bookinstance_form', {title: 'Update Book Instance', book_list: books, bookinstance: req.body, errors: errors.array()});
            })
        } else {
            // crea un nuevo objeto
            let bookinstance = new BookInstance({
                book: req.body.book,
                imprint: req.body.imprint,
                status: req.body.status,
                due_back: req.body.due_back,
                _id: req.params.id
            });
            BookInstance.findByIdAndUpdate(
                req.params.id,
                bookinstance,
                function(err, the_bookinstance){
                    if (err) return next(err);
                    res.redirect(the_bookinstance.url);
                }
            )
        }
    }
];