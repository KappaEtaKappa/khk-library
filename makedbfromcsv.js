var sqlite3 = require('sqlite3').verbose();
var csv_parse = require('csv-parse');
var isbn = require('node-isbn');

var fs = require("fs");
var file = "library.sqlite";
var exists = fs.existsSync(file);

var db = new sqlite3.Database(file);

var spin = require('term-spinner');
var spinner = spin.new("◐◓◑◒");
function khkOrGoogleOrNull(khk, google, encode){
	if(encode == undefined) encode = false;
	
	s = google;
	if(google == undefined || google == "")
		s = khk;
	if(s.length == 0)
		return "NULL"
	if(encode)
		return "'" + escape(encodeURI(s)) + "'";
	else
		return "'" + escape(s) + "'";
}
function khkOrGoogleOrNaN(khk, google){
	i = google;
	if(google == null)
		i = khk;
	if(isNaN(i))
		return "NULL";
	return i;
}

db.serialize(function() {
	if(exists)
		db.run("DROP TABLE library;");

	db.run("CREATE TABLE library (khk_id INTEGER,"+
								 "isbn_10 TEXT,"+
								 "isbn_13 TEXT,"+
								 "sbn TEXT,"+
								 "title TEXT,"+
								 "author TEXT,"+
								 "publisher TEXT,"+
								 "published_date TEXT,"+
								 "description TEXT,"+
								 "industry_identifiers TEXT,"+
								 "page_count INTEGER,"+
								 "categories TEXT,"+
								 "average_rating INTEGER,"+
								 "ratings_count INTEGER,"+
								 "content_version TEXT,"+
								 "thumbnail TEXT,"+
								 "small_thumbnail TEXT,"+
								 "language TEXT,"+
								 "preview_link TEXT,"+
								 "info_link TEXT,"+
								 "canonical_volume_link TEXT,"+
								 "notes TEXT);");

	fs.readFile("library_db.csv", "utf8", function(err, data){
		if(err){ console.log(err); process.exit(1);}
		
		csv_parse(data, function(err, data){
			if(err){ console.log(err); process.exit(1);}

			var spinnerInv = setInterval(function () {
				spinner.next();
				process.stdout.clearLine();
				process.stdout.cursorTo(0);
				process.stdout.write([spinner.current, "Processing..."].join(" "));
			}, 100);
			var doneCount = 1;
			db.serialize(function(){	
				for(var i=0; i<data.length-1; i++){
					var bookIsbn = data[i][3];
					if(data[i][1].length > 1) bookIsbn = data[i][1];
					if(data[i][2].length > 1) bookIsbn = data[i][2];

					isbn.resolve(bookIsbn,function(err, book){
						if(err){ console.log(err); book={imageLinks:{}}; }

						if(book.imageLinks == undefined)
							book.imageLinks = {};

						try{
						  	var insert =	"INSERT INTO library (" +
											"khk_id, " +
											"isbn_10, " +
											"isbn_13, " +
											"sbn, " +
											"title, " +
											"author, " +
											"notes, " +
											"publisher,"+
											"published_date,"+
											"description,"+
											"industry_identifiers,"+
											"page_count,"+
											"categories,"+
											"average_rating,"+
											"ratings_count,"+
											"content_version,"+
											"thumbnail,"+
											"small_thumbnail,"+
											"language,"+
											"preview_link,"+
											"info_link,"+
											"canonical_volume_link"+										
										  ") VALUES (" +
											khkOrGoogleOrNaN(parseInt(data[i][0]),null) + "," +
											khkOrGoogleOrNull(data[i][1],undefined) + "," +
											khkOrGoogleOrNull(data[i][2],undefined) + "," +
											khkOrGoogleOrNull(data[i][3],undefined) + "," +
											khkOrGoogleOrNull(data[i][4],book.title) + "," +
											khkOrGoogleOrNull(data[i][5],book.author) + "," +
											khkOrGoogleOrNull(data[i][6],undefined) + "," +
											khkOrGoogleOrNull("",book.publisher) + "," +
											khkOrGoogleOrNull("",book.publishedDate) + "," +
											khkOrGoogleOrNull("",book.description) + "," +
											khkOrGoogleOrNull("",JSON.stringify(book.industryIdentifiers)) + "," +
											khkOrGoogleOrNaN(null,book.pageCount) + "," +
											khkOrGoogleOrNull("",escape(JSON.stringify(book.categories))) + "," +
											khkOrGoogleOrNaN(null,book.averageRating) + "," +
											khkOrGoogleOrNaN(null,book.ratingCount) + "," +
											khkOrGoogleOrNull("",book.contentVersion) + "," +
											khkOrGoogleOrNull("",book.imageLinks.thumbnail, true)  + "," +
											khkOrGoogleOrNull("",book.imageLinks.smallThumbnail, true)  + "," +
											khkOrGoogleOrNull("",book.language)  + "," +
											khkOrGoogleOrNull("",book.previewLink, true)  + "," +
											khkOrGoogleOrNull("",book.infoLink, true)  + "," +
											khkOrGoogleOrNull("",book.canonicalVolumeLink, true) + ");";
										}catch(e){
											console.log("Error on item " + i);
											console.log("Data: ", data[i])
											console.log("Google Data: ", book);
											console.log("Error ", e);
											process.exit(1);
										}
						db.run(insert, function(err){
							if(err){ console.log(insert, err); process.exit(1);

								console.log("Error on item " + i);
								console.log("Data: ", data[i], book);
								console.log(e);
								process.exit(1);
							}
							doneCount++;
							if(doneCount == data.length){
								clearInterval(spinnerInv);
								console.log("Done!");
								console.log(doneCount + " books shelved.");
								process.exit(0);
							}
						});	
					});
				}
			});
		});
	});
});


