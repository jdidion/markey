require('fs')

function Parser(cache) {
    var marked = require('marked')

    marked.setOptions({
        breaks: true,
        gfm: true,
        highlight: function (code) {
            return require('highlight.js').highlightAuto(code).value
        },
        tables: true,
        pedantic: false,
        sanitize: false,
        smartLists: true,
        smartypants: true
    })

    var renderer = new marked.Renderer()

    //-- Headers --//
    // Headers can be of the form # [dir1,dir2] Header
    // where dir1 and dir2 are directives. Directives
    // are translated into CSS classes.

    var headingDirRegex = /\[(.+?)\]\s+(.+)/
    
    var parseDirectives = function(s, classes) {
        s = s.split(",")
        ndirs = s.length
        classes = classes || []

        dirs = {
            classes: [],
            class_str: function() this.classes.join(" ") 
        }

        for (var i = 0; i < ndirs; i++) {
            d = s[i].split("=")
            if (d.length == 1) {
                if (d[0] in classes) {
                    dirs.classes.push(d[0])
                }
                else {
                    d = [d[0], true]
                }
            }
            if (d.length > 1) {
                dirs[d[0]] = d[1]
            }
        }
        
        return dirs
    }
    
    renderer.heading = function (text, level, raw) {
        var clsStr = ''
        var dirs = {}
        if (text.charAt(0) === '[') {
            var match = headingDirRegex.exec(text)
            dirs = parseDirectives(match[1], ["fit"])
            clsStr = ' class="' + dirs.classes + '"'
            text = match[2]
        }
        var html = '<h'
            + level
            + ' id="'
            + this.options.headerPrefix
            + raw.toLowerCase().replace(/[^\w]+/g, '-')
            + '"'
            + clsStr
            + '>'
            + text
            + '</h'
            + level
            + '>\n'
        
        if (dirs.header) {
            html = "<header>" + html + "</header>"
        }
        
        return html
    } 

    //-- Images --//
    // Fetch the image from the cache or from the source.
    // Images directives are passed as a comma-delimited
    // list in place of alt text.

    renderer.image = function(href, title, text) {
        media = cache.fetch(href)
        dirs = parseDirectives(text, []) // TODO: define valid img directives
    
        var html = '<figure>'
    
        // separate handling for image, video, and table
        if (this.options.allowImages && media.type === 'image') {
            // TODO: handle image directives
            // Do we need any file manipulation, or can we do everything with CSS?
            // Image manipulation libraries:
            // http://stackoverflow.com/questions/10692075/which-library-should-i-use-for-server-side-image-manipulation-on-node-js
        
            html += '<img id="' + media.key + '" src="' + media.path + '"'
            if (title) {
                html += ' title="' + title + '"'
            }
            if (dirs.classes) {
                html += ' class="' + dirs.class_str + '"'
            }
            html += this.options.xhtml ? '/>' : '>'
        }
        else if (this.options.allowVideo && media.type == 'video') {
            html += '<video id="' 
                + media.key 
                + '" controls><source src="' 
                + media.file 
                + '" type="' 
                + media.mime 
                + '"></video>'
        }
        else if (this.options.allowTables && media.type == 'table') {
            html += require('tables').renderHTML(media, dirs)
        }
        else {
            console.log("Unknown or disallowed media type - " +
                href, media.type)
            html = '<span id="' 
                + media.key 
                + '">[Media:' 
                + href 
                + ']</span>'
        }
        
        if (dirs.caption) {
            html += '<figcaption>' + dirs.caption + '</figcaption>'
        }
        
        html += "</figure>"
        
        return html
    }
    
    renderer.hr = function() {
        // warn the user that they're probably missing blank lines
        console.log("To create a page separator, --- must have blank lines before and after")
        return "<hr/>"
    }
    
    return {
        _parser : marked,
        _renderer : renderer,
        
        parse : function(md) {
            return _parser(md, { renderer: _renderer })
        }
    }
}

// Simple cache to fetch a media object from a URL,
// save it to local storage, and determine the MIME type.
// Returns an object with the file name and MIME type.

// TODO: filenames should be based on SHA1 has of
// the file itself, and used to verify that the
// file has not changed in the cache.

function UrlCache(cacheDir) {
    if (!fs.exists(cacheDir)) {
        fs.mkdirSync(cacheDir)
    }
    var stats = fs.lstatSync(cacheDir) 
    if (!stats.isDirectory()) {
        throw cacheDir + " is not a directory"
    }
    var dbFile = path.join(cacheDir, "__db.json")
    var db = require('levelup')(dbFile)
    
    var urlExt = function(mime) {
        return url.split('.').pop().split(/\#|\?/)[0]
    }
    
    // return one of the following based on mime
    // type and/or extension: image, video, table, unknown
    var classifyMIME = function(mime, ext) {
        // TODO
    }
    
    return {
        _dir : cacheDir,
        _db : db,
        _dbFile : dbFile,
        
        cacheKey : function(url) {
            var shasum = require('crypto').createHash('sha1')
            shasum.update(key)
            return shasum.digest('hex')
        },  
        
        fetch : function(url) {
            var key = this.cacheKey(url)
            
            data = db.get(key)
            
            if (data) {
                // make sure the file still exists
                if (!fs.exists(data.path)) {
                    console.log("File is missing from cache - " + data.path)
                    data = null
                    db.del(key)
                }
            }
            
            if (!data) {
                ext = urlExt(url)
                var data = { key: key, url: url, path: url, mime: require('mime').lookup(url) }
                
                // If URL points to a remote file, cache it locally
                if (url.indexOf('http') == 0) {
                    // TODO: log errors
                    file = path.join(this._dir, key + '.' + ext)
                    
                    require('https').get(url, function(response) {
                        if (response.statusCode != 200) {
                            throw new Error("Could not retrieve file from URL - " + url)
                        }
                        var cacheFileStream = fs.createWriteStream(file)
                        cacheFileStream.on("error", function(err) {
                            console.log(err)
                            this.end()
                        })
                        response.pipe(cacheFileStream)
                    })
                    
                    data["path"] = file
                    headerMIME = response.headers['Content-Type']
                    if (headerMIME) {
                        data.mime = headerMIME
                    }
                }
                else if (!fs.exists(url)) {
                    throw new Error("File not found - " + url)
                }
                
                var magic = require('mmmagic').Magic(mmm.MAGIC_MIME_TYPE)
                realMIME = magic.detectFile(data.path)
                if (realMime != data.mime) {
                    console.log("MIME type of file is wrong - " + url, data.mime, realMIME)
                    data.mime = realMIME
                }
                
                data["type"] = classifyMIME(realMIME, ext)
                
                db.put(key, data)
            }
            
            return data
        }     
    }
}

// -- main --//

function parseMarkeyFile(options) {
    markeyFile = options.markeyFile || process.stdin
    
    // load markey text
    var mk = fs.readFileSync(markeyFile, "utf8")
    
    // parser for frontmatter and footers
    var yamlParser = require('js-yaml')
    
    // split frontmatter from remainder of document
    var frontRegex = /^(-{3}(?:\n|\r)([\w\W]+?)(?:\n|\r)-{3})?([\w\W]*)*/
    var docParts = mk.match(frontRegex)
    var docOptions = {}
    if (frontYAML = docParts[2]) {
        docOptions = yamlParser.load(frontYAML)
    }
    content = docParts[3] || ''
    
    // setup cache
    var cache = require('cache').UrlCache(options.cacheDir)
    // setup markdown parser
    var parser = Parser(cache)
    
    // split into sections
    var sectionRegex = /^[\n\r]+-{3}[\n\r]+^[\n\r]+/
    var sectionContent = content.split(sectionRegex)
    
    // format each section
    var numSections = sectionContent.length
    var sections = []
    var footerRegex = /^>[\n\r]+/
    for (var i = 0; i < numSections; i++) {
        section = sectionContent[i]
        
        // split out footer and parse as yaml
        sectionParts = section.split(footerRegex)
        sectionMD = sectionParts[0]
        sectionOpts = {}
        if (sectionParts.length > 1) {
            sectionOpts = yamlParser.load(sectionParts[1])
        }
        
        // convert markdown to html
        var sectionHTML = parser.parse(sectionMD)
        
        sections.push({ html: sectionHTML, opts: sectionOpts })
    }
    
    return { docOptions: docOptions, sections: sections }
}

function getTemplate(docOptions, defaultOptions) {
    var layoutOptions = defaultOptions || {}
    if (docOptions) {
        for (var a in docOptions) {
            layoutOptions[a] = docOptions[a]
        }
    }
    var templateName = layoutOptions.template || 'default'
    var factory = require('templates/' + templateName + '.js')
    return factory.template(layoutOptions)
}

function markey(options) {
    // parse markey into sections of HTML
    var mkData = parseMarkeyFile(options)
    
    // load the template
    var template = getTemplate(mkData.docOptions.layout, options.layout)
    
    // merge sections with template
    var docHTML = template(mkData)
    
    // write HTML file
    if (options.htmlFile) {
        fs.writeFileSync(options.htmlFile, docHTML)
    }
    
    // write PDF
    if (options.pdf) {
        require('html-pdf').create(docHTML, options.pdf).toFile(function(err, res) {
            console.log(res); 
        })
    }
    
    return docHTML
}
