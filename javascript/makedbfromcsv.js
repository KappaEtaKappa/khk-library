var sqlite3 = require('sqlite3').verbose();
var csv_parse = require('csv-parse');

var fs = require("fs");
var file = "library.sqlite";
var exists = fs.existsSync(file);

var db = new sqlite3.Database(file);

var spin = require('term-spinner');
var spinner = spin.new("◐◓◑◒");
function orNull(s){
	if(s.length == 0)
		return "NULL"
	return "'" + escape(s) + "'";
}
function orNaN(i){
	if(isNaN(i))
		return "NULL";
	return i;
}

db.serialize(function() {
	if(exists)
		db.run("DROP TABLE library;");

	db.run("CREATE TABLE library (ID INTEGER );");
});

fs.readFile("khk_library_csv.csv", "utf8", function(err, data){
	if(err){ console.log(err); process.exit(1);}
	
	csv_parse(data, function(err, data){
		if(err){ console.log(err); process.exit(1);}
		
		console.log(data[0]);
		db.serialize(function(){
			for(var i=1; i<data[0].length; i++){
				var columnNtype = data[0][i].split("/");
				db.run("ALTER TABLE library ADD COLUMN " + columnNtype[0] + " " + columnNtype[1] + ";", function(err){
					if(err){ console.log(err); process.exit(1);}
				});
			}
		});
		var spinnerInv = setInterval(function () {
			spinner.next();
			process.stdout.clearLine();
			process.stdout.cursorTo(0);
			process.stdout.write([spinner.current, "Processing..."].join(" "));
		}, 1000);
		var doneCount = 1;
		db.serialize(function(){	
			for(var i=1; i<data.length; i++){
                              var insert =    "INSERT INTO library (" +
                                                "KHKID, " +
                                                "ISBN-10, " +
                                                "ISBN-13, " +
                                                "SBN, " +
                                                "Title, " +
                                                "Author, " +
                                                "Notes, " +
                                              ") VALUES (" +
                                                orNaN(parseInt(data[i][0])) + "," +
                                                orNaN(parseInt(data[i][1])) + "," +
                                                orNull(data[i][2]) + "," +
                                                orNaN(parseInt(data[i][3])) + "," +
                                                orNull(data[i][4]) + "," +
                                                orNull(data[i][5]) + "," +
                                                orNull(data[i][6]) + "," +
                                                orNull(data[i][7]) + "," +
                                                orNull(data[i][8]) + "," +
                                                orNull(data[i][9]) + "," +
                                                orNull(data[i][10]) + "," +
                                              ");";
				db.run(insert, function(err){
					if(err){ console.log(insert, err); process.exit(1);}
					doneCount++;
					if(doneCount == data.length){
						clearInterval(spinnerInv);
						console.log("Done!");
						console.log(doneCount + "entries inserted");
					}
				});	
			}
		});
	});
});
