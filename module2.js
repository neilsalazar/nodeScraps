/*jshint esversion: 6*/

var http = require('http');
var fs = require('fs');
var nodeMon = require('nodemon');

var hostname = '127.0.0.1';
var port = 7000;

var backTickExample = `This is written
ES6 backticks, so does this work?
That is an excellent question.`;

fs.readFile('index.html', (err, html) => {
  if(err) {
    throw err;
  }
  var server = http.createServer(function(req, res) {
    res.statusCode = 200;
    res.setHeader('Content-type', 'text/html');
    console.info('server started on port: ' +port+ ' and hostname: ' +hostname);
    res.write(backTickExample);
    res.end();

    let testFunction = greeting => console.info(greeting);


    testFunction('yo what up world');
  });
  server.listen(port, hostname);

});

// fs.readFile('index.html');
