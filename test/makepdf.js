var fs = require('fs');
var pdf = require('html-pdf');
var html = fs.readFileSync('./test.html', 'utf8')
var options = { 
    filename: './test.pdf', 
    format: 'Letter',
    width: "122cm",
    height: "122cm",
    border: "1cm",
    
};
 
pdf.create(html, options).toFile();