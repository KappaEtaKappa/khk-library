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
		return null;
	if(encode)
		return escape(s);
	else
		return  s;
}
function khkOrGoogleOrNaN(khk, google){
	i = google;
	if(google == null)
		i = khk;
	if(isNaN(i))
		return null;
	return i;
}

global.running = 0;
global.max = 40;

db.serialize(function() {
	if(exists)
		db.run("DROP TABLE library;");

	db.run("CREATE TABLE library (khk_id INTEGER,"+
								 "isbn_10 TEXT,"+
								 "isbn_13 TEXT,"+
								 "sbn TEXT,"+
								 "title TEXT,"+
								 "authors TEXT,"+
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
								 "notes TEXT,"+
								 "api TEXT);");

	fs.readFile("library_db.csv", "utf8", function(err, data){
		if(err){ console.log(err); process.exit(1);}

		csv_parse(data, function(err, data){
			if(err){ console.log(err); process.exit(1);}

			// var spinnerInv = setInterval(function () {
			// 	spinner.next();
			// 	process.stdout.clearLine();
			// 	process.stdout.cursorTo(0);
			// 	process.stdout.write([spinner.current, "("+doneCount+"/"+188+")"+" Processing..."].join(" "));
			// }, 100);
			var doneCount = 1;
			db.serialize(function(){

				data.forEach(function(val, index, arr){
					var go4it = function(val, index, arr){
						running++;
						var bookIsbn = val[3];
						if(val[1].length > 1) bookIsbn = val[1];
						if(val[2].length > 1) bookIsbn = val[2];

						isbn.resolve(bookIsbn,function(err, book, api){
							if(err){ console.log(err); book={imageLinks:{}}; }
							else console.log('\n#'+val[0]+' "'+book.title+'" shelved.')

							if(book.imageLinks == undefined)
								book.imageLinks = {};


							try{
							  	var insert =	"INSERT INTO library (" +
												"khk_id, " +
												"isbn_10, " +
												"isbn_13, " +
												"sbn, " +
												"title, " +
												"authors, " +
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
												"canonical_volume_link,"+
												"api"+
											  ") VALUES ( ?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,? );"
											}catch(e){
												console.log("Error on item " + i);
												console.log("Data: ", val)
												console.log("Google Data: ", book);
												console.log("Error ", e);
												process.exit(1);
											}
							db.run(insert,
											khkOrGoogleOrNaN(parseInt(val[0]),null),
											khkOrGoogleOrNull(val[1],undefined),
											khkOrGoogleOrNull(val[2],undefined),
											khkOrGoogleOrNull(val[3],undefined),
											khkOrGoogleOrNull(val[4],book.title),
											khkOrGoogleOrNull(JSON.stringify([val[5]]),JSON.stringify(book.authors), false),
											khkOrGoogleOrNull(val[6],undefined),
											khkOrGoogleOrNull("",book.publisher),
											khkOrGoogleOrNull("",book.publishedDate),
											khkOrGoogleOrNull("",book.description),
											khkOrGoogleOrNull("",JSON.stringify(book.industryIdentifiers)),
											khkOrGoogleOrNaN(null,book.pageCount),
											khkOrGoogleOrNull("",escape(JSON.stringify(book.categories))),
											khkOrGoogleOrNaN(null,book.averageRating),
											khkOrGoogleOrNaN(null,book.ratingCount),
											khkOrGoogleOrNull("",book.contentVersion),
											khkOrGoogleOrNull("",book.imageLinks.thumbnail, true),
											khkOrGoogleOrNull("",book.imageLinks.smallThumbnail, true),
											khkOrGoogleOrNull("",book.language),
											khkOrGoogleOrNull("",book.previewLink, true),
											khkOrGoogleOrNull("",book.infoLink, true),
											khkOrGoogleOrNull("",book.canonicalVolumeLink, true),
											api,
								 function(err){
								if(err){ console.log(insert, err); process.exit(1);}
								running--;
								doneCount++;
								if(doneCount == data.length){
									// clearInterval(spinnerInv);
									console.log("Done!");
									console.log(doneCount + " books shelved.");
									process.exit(0);
								}
							});
						});
					};

					var check = function(val, index, arr){
						if(running < max)
							go4it(val,index,arr);
						else
							setTimeout(function(){
								check(val,index,arr);
							}, Math.random()*500);
					}
					check(val, index, arr);
				});
			});
		});
	});
});
