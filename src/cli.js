var home = process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE
var cacheDir = path.normalize(path.join(home, ".markey", "cache"))

fs.mkdir(cacheDir, function(err) {
    if (err) {
        if (err.code == 'EEXIST') cb(null) // ignore the error if the folder already exists
        else cb(err) // something else went wrong
    }
    else {
      cb(null) // successfully created folder
    }
})

var program = require('commander')
program
    .option('-i, --input <file>', 'Input markdown file')
    .option('-o, --output <file>', 'Output markdown file')
    .parse(process.argv)