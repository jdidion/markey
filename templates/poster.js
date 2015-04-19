var template = function(options) {
    hb = require('handlebarsjs')
    
    var left = options.sizes[0]
    var middle = left + options.sizes[1]
    var right = middle + options.sizes[2]
    
    return function(data) {
        var context = {
            style: options.style || 'poster.styl',
            left: data.sections.slice(0, left),
            middle: data.sections.slice(left, middle),
            right: data.sections.slice(middle, right)
        }
        
        var hbOptions = {
            strict: true
        }
        
        var template = hb.templates['poster.html']
        return template(context, hbOptions)
    }
}
