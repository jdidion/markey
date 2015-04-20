var fs = require('fs');
var pdf = require('html-pdf');
var html = fs.readFileSync('./test.html', 'utf8')
var options = { 
    filename: './test.pdf', 
    format: 'Letter',
    width: "122cm",
    height: "122cm",
    border: "1cm",
    phantomPath: "/usr/local/bin/phantomjs"
};
 
pdf.create(html, options).toFile(function(err, res) {
  if (err) return console.log(err);
  console.log(res); 
});