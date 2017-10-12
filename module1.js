var http = require('http');
var fs = require('fs');

var hostname = '127.0.0.1';
var port = 3000;

fs.readFile('index.html', (err, html) => {
  if(err) {
    throw err;
  }
  var server = http.createServer(function(req, res) {
    res.statusCode = 200;
    res.setHeader('Content-type', 'text/html');
    console.info('server started on port: ' +port+ ' and hostname: ' +hostname);
    res.write(html);
    res.end();
  });
  server.listen(port, hostname);

});

// fs.readFile('index.html');
