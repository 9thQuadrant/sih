var app = require('http').createServer(handler);
var io = require('socket.io')(app);
var pg = require('pg');
var conString = "postgres://postgres:5698698@localhost:5432/digital";

var client = new pg.Client(conString);
client.connect();


function handler (req, res) {
  fs.readFile(__dirname + '/socket.js',
  function (err, data) {
    if (err) {
      res.writeHead(500);
      return res.end('Error loading index.html');
    }

    res.writeHead(200);
    res.end(data);
  });
}
var fs = require('fs');
app.listen(8000);
io.on('connection', function (socket) {
	console.log('connection received');
socket.emit('ready');
socket.on('data',function(data){
	console.log('receiving data');

	var query = {
		number				: data['number'],
		problem				: data['q1'],
		date					: data['date'],
		duration				: data['q3'],
		name_of_disease		: data['q4'],
		tests_and_labs			: data['q5'],
		where				: data['q6'],
		test_reports			: data['q7'],
		doctor				: data['q8'],
		medicine				: data['q10'],
		treatment_duration		: data['q9'],
		cost_of_medicine		: data['q11'],
		cost_for_transportation	: data['q12'],
		cost_for_consultation	: data['q13'],
		operation				: data['q14'],
		distance				: data['q16'],
		timings_of_facility		: data['q17'],
		behaviour_of_staff		: data['q18'],
		effectiveness			: data['q19'],
		comments				: data['q20'],
		name_of_person			: data['q21'],
		relationship_with_holder	: data['q22'],
		uploaded_on			: new Date().getFullYear()+'-'+new Date().getMonth()+'-'+Date().getDay(),
		image_data			: data['q2'],
		method				: 'mobile'
	};
	console.log(query);

	query = format('INSERT INTO table(${this~}) VALUES(${number}, ${problem} ,${date},${duration},${name_of_disease},${tests_and_labs},${where},${test_reports},${doctor},${medicine},${treatment_duration},${cost_of_medicine},${cost_for_transportation},${cost_for_consultation},${operation},${distance},${timings_of_facility},${behaviour_of_staff},${effectiveness},${comments},${name_of_person},${relationship_with_holder},${uploaded_on},${image_data},${method})', query);

	client.query(query);
	console.log('pushed data');
	});

});
console.log('running...');