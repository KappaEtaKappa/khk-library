/*
Name: search-library.js

Programmers:
Joe Dailey
Ethan Erdmann

Date/Semester: March 1st, 2016/Spring 2016 Semester

Description:
The main express app written in Javascript for the KHK Library Search Engine
on the Kappa Server at the address of 10.0.0.12:6000.
*/

// Require all components to be used in the app
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
library.use(express.static(__dirname + '/public'));
library.set('views', path.join(__dirname, 'views'));
library.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//library.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
library.use(bodyParser.json());
library.use(bodyParser.urlencoded({ extended: false }));
library.use(cookieParser());
library.use(express.static(path.join(__dirname, 'public')));


global.ssa = {};
try {
  global.ssa = require("../khk-ssa/khk-access/index.js")();
} catch(e) {
  console.log("Failed to contact khk-ssa, please clone it from the repo adjacent to this folder.");
}
library.use(ssa.navbar("Catalog"));


/////////START ROUTES\\\\\\\\\\

library.get('/', function(req, res){
  res.render('index', {message:"fuck you ethan"})
});

// Search function to query shelved books within these categories
library.get('/search-catalog', function(req, res){
    console.log(req.query.searchString);
    var query = "SELECT * FROM library WHERE authors LIKE ? "
                                  + "OR title LIKE ? "
                                  + "OR description LIKE ? "
                                  + "OR categories LIKE ? "
                                  + "OR publisher LIKE ? "
                                  + "OR notes LIKE ? "
                                  + "OR industry_identifiers LIKE ? "
                                  + "OR published_date LIKE ? "
                                  + ";";

// Reason for the multiple search variables in the db.all? Need to ask Joe about this

    console.log(query);
    var search = '%'+req.query.searchString+'%';
    db.all(query, search, search, search, search, search, search, search, search, function(error, data){
        if (error){
            console.log(error);
        }
        console.log(data)
        /*for(var i=0; i<data.length; i++)
            if(data[i].authors)
	    try{
		JSON.parse(data[i].authors).forEach(function(author){
                	console.log(author);
		});
	    } catch(e) {
		data[i].authors = [data[i].authors.replace(/\]/g,"").replace(/\[/g,"")];
	    }*/
        var ret = {books:data}
        //console.log(ret);
        res.render('results', ret);
    });
});

// Port the server is working on and the console message if running
module.exports = library;

library.listen(6000);
console.log("Server working");
