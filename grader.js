#!/usr/bin/env node
/*
Automatically grade files for the presence of specified HTML tags/attributes.
Uses commander.js and cheerio. Teaches command line application development
and basic DOM parsing.

References:

 + cheerio
   - https://github.com/MatthewMueller/cheerio
   - http://encosia.com/cheerio-faster-windows-friendly-alternative-jsdom/
   - http://maxogden.com/scraping-with-node.html

 + commander.js
   - https://github.com/visionmedia/commander.js
   - http://tjholowaychuk.com/post/9103188408/commander-js-nodejs-command-line-interfaces-made-easy

 + JSON
   - http://en.wikipedia.org/wiki/JSON
   - https://developer.mozilla.org/en-US/docs/JSON
   - https://developer.mozilla.org/en-US/docs/JSON#JSON_in_Firefox_2
*/

var fs = require('fs');
var program = require('commander');
var cheerio = require('cheerio');
var rest = require('restler');
var HTMLFILE_DEFAULT = "index.html";
var CHECKSFILE_DEFAULT = "checks.json";

var assertFileExists = function(infile) {
    var instr = infile.toString();
    if(!fs.existsSync(instr)) {
        console.log("%s does not exist. Exiting.", instr);
        process.exit(1); // http://nodejs.org/api/process.html#process_process_exit_code
    }
    return instr;
};

var parseUrl = function(infile) {
    var instr = infile.toString();
    return instr;
};

var cheerioHtmlFile = function(htmlfile) {
    return cheerio.load(fs.readFileSync(htmlfile));
};

var loadChecks = function(checksfile) {
    return JSON.parse(fs.readFileSync(checksfile));
};

var checkHtml = function(cheeriohtml, checksfile) {
    var checks = loadChecks(checksfile).sort();
    var out = {};
    for(var ii in checks) {
        var present = cheeriohtml(checks[ii]).length > 0;
        out[checks[ii]] = present;
    }
    return out;
};

var checkHtmlFile = function(htmlfile, checksfile) {
    cheeriohtml = cheerioHtmlFile(htmlfile);
    return checkHtml(cheeriohtml, checksfile);
};

var logConsole = function(checkJson) {
    var outJson = JSON.stringify(checkJson, null, 4);
    console.log(outJson);
};

var checkHtmlFileAndLog = function(htmlfile, checksfile) {
    var checkJson = checkHtmlFile(htmlfile, checksfile);
    logConsole(checkJson);
};

var builfHtmlUrlResponse = function(checksfile) {
    var responseFunction = function(result, response) {
        if (result instanceof Error) {
            console.error('Error: ' + util.format(response.message));
        } else {
            var cheerioHtmlUrl = cheerio.load(result);
            var checkJson = checkHtml(cheerioHtmlUrl, checksfile);
            logConsole(checkJson);
        }
    };
    return responseFunction;
};

var checkHtmlUrlAndLog = function(htmlurl, checksfile) {
    var responseFunction = builfHtmlUrlResponse(checksfile);
    rest.get(htmlurl).on('complete', responseFunction);

}

if(require.main == module) {
    program
        .option('-c, --checks [checks_file]', 'Path to checks.json', assertFileExists, CHECKSFILE_DEFAULT)
        .option('-f, --file [html_file]', 'Path to index.html', assertFileExists)
        .option('-u, --url <html_url>', 'Url to index.html', parseUrl)
        .parse(process.argv);
    console.error(program.file + ' ' + program.checks + ' ' + program.url)
    if (program.file) {
        checkHtmlFileAndLog(program.file, program.checks);
    } else if (program.url) {
        checkHtmlUrlAndLog(program.url, program.checks);
    } else {
        checkHtmlFileAndLog(HTMLFILE_DEFAULT, program.checks);
    }
} else {
    exports.checkHtmlFile = checkHtmlFile;
}
