var express = require('express') ;
var app = express() ;
var request = require('request') ;
var mysql = require('mysql') ;
var bodyParser = require('body-parser') ;

app.use(bodyParser.urlencoded({ extended :true }));
app.use(bodyParser.json({limit: '50mb'}));

var port = 4008 ;
var content = '';

var connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'root',
  password : 'map54321',
  database : 'newsproj',
  multipleStatements: true
});

connection.connect();

console.log("connection sxs") ;

app.use('/public', express.static(__dirname + '/public'));

app.get ( '/' , function(req,res){
	res.sendFile ( 'C:\\Users\\SKM\\Desktop\\final_copy\\test.html' ) ;
})

app.get ( '/summarize' , function(req,res){
	console.log ( "in summarize api") ;
	res.sendFile ( 'C:\\Users\\SKM\\Desktop\\final_copy\\sumup.html' ) ;
})

app.post ( '/addnews' , function(req,res){
	var title = req.body.title ;
	var url = req.body.url ;
	var imageUrl = req.body.imageUrl ;
	var publishedAt = req.body.publishedAt ;
	var category = req.body.category ;		

	var query = "INSERT INTO news(title,url,imageUrl,publishedAt,category) VALUES("+connection.escape(title)+","+connection.escape(url)+","+connection.escape(imageUrl)+","+connection.escape(publishedAt)+","+connection.escape(category)+")" ;

	connection.query (query , function(error,results,fields){
		if(error){
			console.log ("Error inserting news into database") ;
			res.send("error1") ;
		} 
		else{
			console.log ("done1") ;
			res.send("done1") ;
		} 
	})
});


app.post ( '/skm' , function(req,res){
	res.send ("i am here") ;
	var query = '' ;
	console.log("req.body.data.length="+req.body.data.length) ;
	for(var i = 0 ; i < req.body.data.length ; ++i){
		query += "UPDATE news SET summary = " + connection.escape(req.body.data[i].summary) + " WHERE original=" + connection.escape(req.body.data[i].original) + ";" ;
	}	
	flag = 0 ;
	connection.query( query , function(error,results,fields){
		if ( error ){
			console.log("error");
			res.send("error");
		} else {
			console.log("done");
			// res.send("done");
		}
	})
})

app.get('/getoriginalnews' , function(req,res){
	var resultNew = [] ;
	var query = "SELECT * FROM news" ;
	console.log("here1") ;
	connection.query ( 	query , function(error,results,fields){
		if(error){
			console.log ("Error fetching news from database") ;
			res.send("error2") ;
		} 
		else{
			for ( var i = 0 ; i < results.length ; ++i ){
				var test = { 'original' : results[i].original } ;
				resultNew[i] = test ;
			}
			console.log("here2") ;
			// console.log(resultNew) ;	
			res.send(resultNew) ;
		}
	})	
})

app.get('/api/:category' , function(req,res){
	var resObj = {} ;
	var category = req.params.category ;

	var query = "SELECT * FROM news WHERE category='"+category+"'" ;
	console.log ( query ) ;
	connection.query ( query , function(error,results,fields){
		if(error){
			console.log ("error4") ;
			res.send({"status" : "ERROR","result":[]}) ;
		} 
		else{
			resObj.status = "SUCCESS" ;
			resObj.result = [] ;
			resObj.result = results ;
			res.send( resObj ) ;
		}		
	})
})

app.listen( port , function(err){
	console.log("I am listening to "+port ) ;
})