# Conceptos

# Código

## async.parallel

Nos permite hacer varias operaciones en simultanea, una vez hayan terminado todas las operaciones, entonces se guardarán el resultado según **el tipo de estructura de datos** que hayamos utilizado. Por ejemplo en el siguiente código:

``` js
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
```
Guarda los resultados en un objeto. Estos resultados son **book y bookInstance**. Los cuales serán almacenados en el segundo argumento de la función que sucede al objeto de **async.parallel**.
```js
function(err, results){
    // ...
}
```

## debug module

Este es un módulo que nos permite mejorar u optimizar el uso de los console.log(), los cuales se acostumbran a usar frecuentemente durante el desarrollo. Este módulo activa o desactiva el registro de los avisos, a conveniencia. Para ello, al momento de ejecutar la aplicación, activamos o no la variable de entorno **set DEBUD = \<variable-asignada>**. Miremos un ejemplo

```js
// importamos y asiganamos la variable author con la cual se activará o no los console.
var debug = require('debug')('author');

//...
function(err, result){
        debug('Este es el resultado: ', result.author);
        console.log('console.log: Este es el resultado: ', result.author);
        if (err) return next(err);
```

En el ejemplo anterior vemos como, en lugar de utilizar el console.log() utilizamos la variable que hemos creado con su respectiva clave **author**.

Para activar o desactivar el rastreo de estos avisos, utilizamos en la línea de comandos

```cmd
set DEBUG=author & npm run devStart
```

En el cual, activamos las claves que vamos a rastrear, en este caso solo author. En el caso de que sean varias variables que vamos a utilizar, separamos por comas, por ejemplo:

```cmd
set DEBUG=author,book, var1, varN & npm run devStart
```
