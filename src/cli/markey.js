#!/usr/bin/env node

var fs = require('fs')
var program = require('commander')
var mk = require('publisher')

program
    .option('-c --cache-dir <dir>', 'Cache directory')
    .option('-h --html', 'Write HTML')
    .option('-o --options <json file>')
    .option('-p --pdf', 'Write PDF')
    .option('-i, --input <MD file>', 'Input markdown file')
    .option('-o, --output <file prefix>', 'Output file')
    .parse(process.argv)

var options = {
    markeyFile: program.input,
    cacheDir: path.normalize(program.cache_dir || path.join(util.homeDir(), ".markey", "cache"))
}
if (program.options) {
    options = JSON.parse(program.options)
}
var outputPrefix = options.output || path.basename(options.input) || "out"
if (program.html) {
    options.htmlFile = path.normalize(outPrefix + ".html")
}
if (program.pdf) {
    options.pdfFile = path.normalize(outPrefix + ".pdf")
}

mk.publish(options)