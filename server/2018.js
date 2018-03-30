var app = require('http').createServer( (req,res)=>{
  console.log('browser');
  res.writeHead(200);
  res.end('data');
});
var io = require('socket.io')(app);
var MongoClient = require('mongodb').MongoClient,mongoDb;
// var PeerServer = require('peer').PeerServer;
var server = require('peer').PeerServer({port: 9000});
server.on('connection', (id) => {
  console.log(id);
});

MongoClient.connect('mongodb://localhost:27017/', function(err, client) {
  mongoDb = client.db('telemedicine');
  console.log("Connected successfully mongodb");
  app.listen(3333);
});

var rmpClient = [];
var docClient = [];
/****************************************************/
function insert(table,json,callback) {
  var collection = mongoDb.collection(table);
  var authCollection = mongoDb.collection('authCounter');
  authCollection.find({}).toArray((err, lastRecord) => {

  	json.id = parseInt(lastRecord[0].id);
  	authCollection.updateOne({ id : json.id }, { $set: { id : json.id+1 } }, (err, result) => {
  		collection.insertOne(json, (err, result) => {
  			callback(err,result.ops);
  		});
  	});

  });
}

function insertMessage(json,callback){
	var collection = mongoDb.collection('conversations');
	collection.insertOne(json, (err, result) => {
  			callback(err,result.ops);
  		});
}

function find(table,json,callback){
	var collection = mongoDb.collection(table);
	collection.find(json).toArray( (err,record) => {callback(err, record)});
}


function getUnreadMessages(id,callback){
	var collection = mongoDb.collection('conversations');
	console.log(id);
	collection.find({to : id , unread : true }).toArray( (err,record) => {
		collection.updateMany({to : id, unread: true},{"$set":{unread:true}},{});
		callback(err,record);
	});

}
/*****************************************************/

var reg = io.of('/reg').on('connection', function (socket) {

		socket.on('newReg', (data) => {
			insert('auth',data,(e,data)=>{
				socket.emit('newRegResp',data);
			});
		});

   });
/*****************************************************/
var rmp = io.of('/rmp').on('connection', function (socket) {
  

	rmpClient[socket.handshake.query.namespace] = socket.id;
	console.log("rmp connection with id: ",rmpClient.indexOf(socket.id));
    socket.on('checkAadhar', (data) =>{
    	console.log(data);
    	find('patient', {aadhar : data.aadhar} , (e,data) =>{
    		socket.emit('checkAadhar',data);
    	}); 
    });

    socket.on('sendMessage', (data) => {
    	console.log(data);
    	insertMessage(data,(e,result)=>{
    		io.of('/doc').to(docClient[data.to]).emit('receiveMessage',data);
    	});
    });

    socket.on('sendStream', (data) =>{
    	console.log(data);
    	io.of('/doc').to(docClient[data.to]).emit('audioStream',data);
    });

    socket.on('callInit' , (data) => {
    	console.log(data);
    	io.of('/doc').to(docClient[data.to]).emit('callInit',data);
    });

    socket.on('callEnd' , (data) => {
    	console.log(data , "callEnd");
    	io.of('/doc').to(docClient[data.to]).emit('callEnd',data);
    });


    // socket.on('emergencyCall' , (data) => {
    // 	console.log(data , "emergencyCall");
    // 	io.socket.broadcast.emit('emergencyCall',data);
    // });


});
/*****************************************************/
var doc = io.of('/doc').on('connection', function (socket) {
	docClient[socket.handshake.query.namespace] = socket.id;
	console.log("doc connection with id: ",docClient.indexOf(socket.id));
	socket.on('checkForUnread', (data) => {
		getUnreadMessages(data.id, (e,data) => {
			socket.emit('unreadMessages',data);
		});
	});

    socket.on('sendMessage', (data) => {
    	console.log(data);
    	insertMessage(data,(e,result)=>{
    		io.of('/rmp').to(rmpClient[data.to]).emit('receiveMessage',data);
    	});
    });

    socket.on('sendStream', (data) =>{
    	console.log(data);
    	io.of('/rmp').to(rmpClient[data.id]).emit('audioStream',data);
    });

    socket.on('callInit' , (data) => {
    	console.log(data);
    	io.of('/rmp').to(rmpClient[data.to]).emit('callInit',data);
    });

    socket.on('callEnd' , (data) => {
    	console.log(data , "callEnd");
    	io.of('/rmp').to(rmpClient[data.to]).emit('callEnd',data);
    });

    
    // socket.on('emergencyCall' , (data) => {
    // 	console.log(data , "emergencyCall");
    // 	io.socket.broadcast.emit('emergencyCall',data);
    // });
	
});