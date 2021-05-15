let express = require('express');
let router = express.Router()

router.get('/', function(req, res) {
    res.send('Wiki home page');
});

router.get('/wiki', function(req, res){
    res.send('About this wiki');
});

router.get('/:nombre/:date/:age', function(req, res){
    console.log(req.params.nombre);
    res.send(req.params);
});

module.exports = router;