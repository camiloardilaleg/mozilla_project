var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

// creating a new route
router.get('/cool', function (req, res) {
  res.send("You're  so cool, couse you're programming your own page")
});


module.exports = router;
