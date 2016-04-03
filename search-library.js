var fs = require("fs");
var sqlite3 = require("sqlite3").verbose();
var file = __dirname + "/library.sqlite";
if (!fs.existsSync(file)) {
  console.log("DB has not been built. Please run 'node makedbfromcsv.js'");
  process.exit(1)
}
var db = new sqlite3.Database(file);


var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var library = express();

// view engine setup
library.set('views', path.join(__dirname, 'views'));
library.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//library.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
library.use(bodyParser.json());
library.use(bodyParser.urlencoded({ extended: false }));
library.use(cookieParser());
library.use(express.static(path.join(__dirname, 'public')));

/////////START ROUTES\\\\\\\\\\

library.get('/', function(req, res){
  res.render('index', {message:"fuck you ethan"})
});



module.exports = library;

library.listen(7000)