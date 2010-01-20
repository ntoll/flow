/*
 * tag_value_app - a generic javascript application for updating the value of a
 * tag associated with a specific object. Handles simple code related cases such
 * as javascript, html, css, xml and so on.
 *
 * (c) 2009 Nicholas H.Tollervey (http://ntoll.org/contact)
 *
 * Based upon the Sammy javascript framework: http://code.quirkey.com/sammy/
 *
 * and
 *
 * jsFluidDB: http://github.com/ecarnevale/jsFluidDB
 */
(function($) {

    var COOKIE_AUTH_TOKEN = 'fluiddb_auth';
    var COOKIE_USERNAME = 'fluiddb_username';
    var COOKIE_OPTIONS = { path: '/', expires: 10};
    var EDITOR = null;
    // the mother of all mime-type hacks... :-/
    var MIME_TYPES = {
                        "lsf": "video/x-la-asf", 
                        "mny": "application/x-msmoney", 
                        "cdf": "application/x-cdf", 
                        "rtf": "application/rtf", 
                        "nws": "message/rfc822", 
                        "scd": "application/x-msschedule", 
                        "aiff": "audio/x-aiff", 
                        "gz": "application/x-gzip", 
                        "png": "image/png", 
                        "jpeg": "image/jpeg", 
                        "aifc": "audio/x-aiff", 
                        "mp4": "video/mp4", 
                        "mp2": "video/mpeg", 
                        "mp3": "audio/mpeg", 
                        "bcpio": "application/x-bcpio", 
                        "sct": "text/scriptlet", 
                        "pko": "application/ynd.ms-pkipko", 
                        "lsx": "video/x-la-asf", 
                        "sv4cpio": "application/x-sv4cpio", 
                        "clj": "text/plain", 
                        "wrl": "x-world/x-vrml", 
                        "tr": "application/x-troff", 
                        "wri": "application/x-mswrite", 
                        "rgb": "image/x-rgb", 
                        "fif": "application/fractals", 
                        "tsv": "text/tab-separated-values", 
                        "clp": "application/x-msclip", 
                        "wmf": "application/x-msmetafile", 
                        "ief": "image/ief", 
                        "bin": "application/octet-stream", 
                        "mpg": "video/mpeg", 
                        "mpe": "video/mpeg", 
                        "rb": "text/plain", 
                        "mpa": "video/mpeg", 
                        "sst": "application/vnd.ms-pkicertstore", 
                        "mov": "video/quicktime", 
                        "p10": "application/pkcs10", 
                        "lzh": "application/octet-stream", 
                        "p12": "application/x-pkcs12", 
                        "cer": "application/x-x509-ca-cert", 
                        "mpp": "application/vnd.ms-project", 
                        "ustar": "application/x-ustar", 
                        "qt": "video/quicktime", 
                        "hqx": "application/mac-binhex40", 
                        "xlm": "application/vnd.ms-excel", 
                        "trm": "application/x-msterminal", 
                        "bas": "text/plain", 
                        "crt": "application/x-x509-ca-cert", 
                        "h": "text/plain", 
                        "xlc": "application/vnd.ms-excel", 
                        "tcl": "application/x-tcl", 
                        "xla": "application/vnd.ms-excel", 
                        "evy": "application/envoy", 
                        "t": "application/x-troff", 
                        "crd": "application/x-mscardfile", 
                        "cmx": "image/x-cmx", 
                        "pbm": "image/x-portable-bitmap", 
                        "texi": "application/x-texinfo", 
                        "mht": "message/rfc822", 
                        "xlt": "application/vnd.ms-excel", 
                        "xls": "application/vnd.ms-excel", 
                        "dir": "application/x-director", 
                        "jfif": "image/pipeg", 
                        "pmw": "application/x-perfmon", 
                        "htc": "text/x-component", 
                        "hta": "application/hta", 
                        "mdb": "application/x-msaccess", 
                        "htm": "text/html", 
                        "hlp": "application/winhlp", 
                        "gtar": "application/x-gtar", 
                        "htt": "text/webviewhtml", 
                        "pma": "application/x-perfmon", 
                        "pmc": "application/x-perfmon", 
                        "pml": "application/x-perfmon", 
                        "oda": "application/oda", 
                        "rmi": "audio/mid", 
                        "uls": "text/iuls", 
                        "mpeg": "video/mpeg", 
                        "ico": "image/x-icon", 
                        "vcf": "text/x-vcard", 
                        "movie": "video/x-sgi-movie", 
                        "spl": "application/futuresplash", 
                        "dll": "application/x-msdownload", 
                        "xof": "x-world/x-vrml", 
                        "ra": "audio/x-pn-realaudio", 
                        "wps": "application/vnd.ms-works", 
                        "mhtml": "message/rfc822", 
                        "asr": "video/x-ms-asf", 
                        "ras": "image/x-cmu-raster", 
                        "asx": "video/x-ms-asf", 
                        "pub": "application/x-mspublisher", 
                        "js": "application/x-javascript", 
                        "xlw": "application/vnd.ms-excel", 
                        "asf": "video/x-ms-asf", 
                        "sv4crc": "application/x-sv4crc", 
                        "dcr": "application/x-director", 
                        "src": "application/x-wais-source", 
                        "c": "text/plain", 
                        "z": "application/x-compress", 
                        "zip": "application/zip", 
                        "midi": "audio/midi", 
                        "m3u": "audio/x-mpegurl", 
                        "isp": "application/x-internet-signup", 
                        "mvb": "application/x-msmediaview", 
                        "cod": "image/cis-cod", 
                        "pdf": "application/pdf", 
                        "acx": "application/internet-property-stream", 
                        "roff": "application/x-troff", 
                        "tgz": "application/x-compressed", 
                        "tiff": "image/tiff", 
                        "pot": "application/vnd.ms-powerpoint", 
                        "pgm": "image/x-portable-graymap", 
                        "rtx": "text/richtext", 
                        "ppm": "image/x-portable-pixmap", 
                        "pps": "application/vnd.ms-powerpoint", 
                        "m13": "application/x-msmediaview", 
                        "m14": "application/x-msmediaview", 
                        "ppt": "application/vnd.ms-powerpoint", 
                        "cs": "text/plain", 
                        "txt": "text/plain", 
                        "ps": "application/postscript", 
                        "java": "text/plain", 
                        "pmr": "application/x-perfmon", 
                        "xpm": "image/x-xpixmap", 
                        "py": "text/plain", 
                        "setpay": "application/set-payment-initiation", 
                        "swf": "application/x-shockwave-flash", 
                        "gif": "image/gif", 
                        "json": "application/x-javascript", 
                        "setreg": "application/set-registration-initiation", 
                        "wav": "audio/x-wav", 
                        "xaf": "x-world/x-vrml", 
                        "axs": "application/olescript", 
                        "wdb": "application/vnd.ms-works", 
                        "bmp": "image/bmp", 
                        "pnm": "image/x-portable-anymap", 
                        "pfx": "application/x-pkcs12", 
                        "mpv2": "video/mpeg", 
                        "iii": "application/x-iphone", 
                        "me": "application/x-troff-me", 
                        "tex": "application/x-tex", 
                        "stl": "application/vnd.ms-pkistl", 
                        "stm": "text/html", 
                        "der": "application/x-x509-ca-cert", 
                        "flr": "x-world/x-vrml", 
                        "crl": "application/pkix-crl", 
                        "cat": "application/vnd.ms-pkiseccat", 
                        "hdf": "application/x-hdf", 
                        "dms": "application/octet-stream", 
                        "pl": "text/plain", 
                        "ms": "application/x-troff-ms", 
                        "svg": "image/svg+xml", 
                        "p7b": "application/x-pkcs7-certificates", 
                        "xwd": "image/x-xwindowdump", 
                        "aif": "audio/x-aiff", 
                        "etx": "text/x-setext", 
                        "p7c": "application/x-pkcs7-mime", 
                        "prf": "application/pics-rules", 
                        "p7r": "application/x-pkcs7-certreqresp", 
                        "p7s": "application/x-pkcs7-signature", 
                        "tar": "application/x-tar", 
                        "ics": "text/calendar",
                        "ifb": "text/calendar",
                        "ai": "application/postscript", 
                        "ram": "audio/x-pn-realaudio", 
                        "jpe": "image/jpeg", 
                        "dxr": "application/x-director", 
                        "jpg": "image/jpeg", 
                        "ins": "application/x-internet-signup", 
                        "au": "audio/basic", 
                        "avi": "video/x-msvideo", 
                        "wks": "application/vnd.ms-works", 
                        "p7m": "application/x-pkcs7-mime", 
                        "texinfo": "application/x-texinfo", 
                        "wrz": "x-world/x-vrml", 
                        "shar": "application/x-shar", 
                        "spc": "application/x-pkcs7-certificates", 
                        "csh": "application/x-csh", 
                        "sit": "application/x-stuffit", 
                        "mid": "audio/midi", 
                        "323": "text/h323", 
                        "html": "text/html", 
                        "tif": "image/tiff", 
                        "wcm": "application/vnd.ms-works", 
                        "css": "text/css", 
                        "vrml": "x-world/x-vrml", 
                        "snd": "audio/basic", 
                        "cpio": "application/x-cpio", 
                        "class": "application/octet-stream", 
                        "man": "application/x-troff-man", 
                        "latex": "application/x-latex", 
                        "exe": "application/octet-stream", 
                        "dvi": "application/x-dvi", 
                        "lha": "application/octet-stream", 
                        "doc": "application/msword", 
                        "eps": "application/postscript", 
                        "xbm": "image/x-xbitmap", 
                        "sh": "application/x-sh", 
                        "cpp": "text/plain", 
                        "dot": "application/msword"
    };

    var tag_value_app = $.sammy(function() {
        this.use(Sammy.Mustache, 'ms');

        // Always called before handling post/get etc... Like Django middleware
        this.before(function() {
            // sort out the cookie
            var auth = $.cookie(COOKIE_AUTH_TOKEN);
            var username = $.cookie(COOKIE_USERNAME);
            var context = this;
            context.auth = auth;
            context.username = username
        });

        /**********************************************************************
         *
         * UI Helper functions
         *
         *********************************************************************/

        /*
         * Given the header information held in the "data" argument, this
         * function pulls the actual value of the tag from FluidDB and makes
         * sure the most appropriate callback is called
         */
        function process_tag(path, url, data, context) {
            $("#status_info").html("Getting tag value from FluidDB...");
            // We have the mime type from the content-type header, so lets work
            // out the most appropriate action...
            var mime = data['Content-Type'].toLowerCase().trim();
            var split_mime = mime.split("/");
            // some of the following functionality is Mozilla > 3.0 only, best
            // check if we're in such a browser...
            var isMoz = false;
            $.each(jQuery.browser, function(i, val) {
                if(i=="mozilla" && jQuery.browser.version.substr(0,3)=="1.9"){
                    isMoz=true;
                }
            });
            switch(split_mime[0]){
                case "application":
                    switch(split_mime[1]){
                        case "javascript":
                        case "json":
                        case "vnd.fluiddb.value+json":
                            fluidDB.get(url, function(tag_value){edit_code(path, mime, tag_value, context)}, true, context.auth);
                            break;
                        case "vnd.ms-powerpoint":
                        case "pdf":
                            if(isMoz) {
                                // Mozilla > 3 so display the form
                                $("#status_info").html("Processing content ("+mime+")...");
                                // Populate some of the items
                                $('#tag_path').html(path);
                                $('#tag_doc_path_hidden').val(path);
                                // Process the path to be able to set a couple of hrefs
                                var split_path = path.split("/");
                                var obj_id = split_path[0];
                                // get rid of the tag
                                split_path.pop();
                                // build the parent namespace path
                                var namespace_path = "tags.html#/namespaces/"+split_path.slice(1).join("/");
                                $('#view_object').attr("href", "object.html#/"+obj_id);
                                $('#view_tag').attr("href", namespace_path);
                                $('.mime_type').html(mime);
                                $('#doc_viewer').attr("src", "http://docs.google.com/viewer?url="+fluidDB.baseURL+url+"&embedded=true");
                                $('#loading').hide();
                                $('#edit_doc_content').fadeIn('slow');
                            } else {
                                unsupported_tag(path, mime, context);
                            }
                            break;
                        default:
                            unsupported_tag(path, mime, context);
                    }
                    break;
                case "text":
                    fluidDB.get(url, function(tag_value){edit_code(path, mime, tag_value, context)}, true, context.auth);
                    break;
                case "image":
                    // Working with binary file uploads etc only works with
                    // Firefox > 3
                    if(isMoz) {
                        // Mozilla > 3 so display the form
                        $("#status_info").html("Processing content ("+mime+")...");
                        // Populate some of the items
                        $('#tag_path').html(path);
                        $('#tag_image_path_hidden').val(path);
                        $('#tag_image_mime').val(mime);
                        // Process the path to be able to set a couple of hrefs
                        var split_path = path.split("/");
                        var obj_id = split_path[0];
                        // get rid of the tag
                        split_path.pop();
                        // build the parent namespace path
                        var namespace_path = "tags.html#/namespaces/"+split_path.slice(1).join("/");
                        $('#view_object').attr("href", "object.html#/"+obj_id);
                        $('#view_tag').attr("href", namespace_path);
                        $('.mime_type').html(mime);
                        $('#image_value').attr('src', '/'+url);
                        $('#loading').hide();
                        $('#edit_image_content').fadeIn('slow');
                    } else {
                        // browser doesn't support getAsBinary() so we can't
                        // process it... :-(
                        unsupported_tag(path, mime, context);
                    }
                    break;

                /* Missing IANA directories of content types:
                 *
                 * audio
                 * example
                 * image
                 * message
                 * model
                 * video
                 *
                 * See: http://www.iana.org/assignments/media-types/ for more
                 * information
                 *
                 * These *might* be supported in the future via file upload.
                 */
                default:
                    unsupported_tag(path, mime, context);
            }
        }

        /*
         * So it looks like the tag value is some sort of source code. This
         * function initialises the "source code" editor.
         *
         * I'm using the excellent CodeMirror in-browser code editor.
         *
         * See: http://marijn.haverbeke.nl/codemirror/ for more information on
         * this.
         *
         * Currently the following languages are supported for syntax
         * highlighting:
         *
         * XML/HTML
         * CSS
         * Javascript/JSON
         *
         * The following will be supported soon...
         *
         * Python
         * Lua
         * Ruby
         *
         * Any other type of language will still work but without the syntax
         * highlighting.
         *
         * But c'mon... you *really shouldn't* be editing code in your browser.
         * I'm just doing this for convenience... ;-)
         */
        function edit_code(path, mime, data, context){
            $("#status_info").html("Processing content ("+mime+")...");
            // Populate some of the items
            $('#tag_path').html(path);
            $('textarea#code').val(data);
            $('#tag_path_hidden').val(path);
            $('#tag_mime').val(mime);
            $('.mime_type').html(mime);
            // Process the path to be able to set a couple of hrefs
            var split_path = path.split("/");
            var obj_id = split_path[0];
            // get rid of the tag
            split_path.pop();
            // build the parent namespace path
            var namespace_path = "tags.html#/namespaces/"+split_path.slice(1).join("/");
            $('#view_object').attr("href", "object.html#/"+obj_id);
            $('#view_tag').attr("href", namespace_path);
            // Set up the editor for syntax highlighting
            var split_mime = mime.split("/");
            // Some safe defaults...
            var parser = "parsedummy.js"; // to hold the name[s] of the parser file
            var style = "docs.css"; // to hold the name of the css file
            var lines = false;
            if(split_mime[0] == 'application') {
                parser = ['tokenizejavascript.js', 'parsejavascript.js'];
                style = 'jscolors.css';
                lines = true;
            } else {
                switch(split_mime[1]) {
                    case 'css':
                        parser = 'parsecss.js';
                        style = 'csscolors.css';
                        lines = true;
                        break;
                    case 'html':
                    case 'xml':
                        parser = 'parsexml.js';
                        style = 'xmlcolors.css';
                        lines = true;
                        break;
                }
            }

            $("#status_info").html("Initialising code editor...");
            EDITOR = CodeMirror.fromTextArea('code', {
                height: "350px",
                parserfile: parser,
                stylesheet: "stylesheets/"+style,
                path: "javascript/codemirror/",
                continuousScanning: 500,
                lineNumbers: lines,
                initCallback: function(e) {
                    $("#loading").hide();
                    $("#edit_text_content").fadeIn('slow');
                    $("#status_info").html("Initialising...");
                    }
            });
        }

        /*
         * Displays a nice message explaining why you can't edit tag-values with
         * un-supported mime-types in Flow.
         */
        function unsupported_tag(path, mime, context){
            $("#status_info").html("Processing content ("+mime+")...");
            // Populate some of the items
            $('#tag_path').html(path);
            $('.mime_type').html(mime);
            // Process the path to be able to set a couple of hrefs
            var split_path = path.split("/");
            var obj_id = split_path[0];
            // get rid of the tag
            split_path.pop();
            // build the parent namespace path
            var namespace_path = "tags.html#/namespaces/"+split_path.slice(1).join("/");
            $('#view_object').attr("href", "object.html#/"+obj_id);
            $('#view_tag').attr("href", namespace_path);
            $("#loading").hide();
            $("#unsupported_content").fadeIn('slow');
        }

        /*
         * Takes an element that is an input type="file" and PUTs the file
         * referenced therein into a tag_value at the specified URL.
         *
         * This will only work on Mozilla > 3.0 at the moment so there is a
         * check in place to fail gracefully.
         */
        function upload_to_mozilla(url, upload_element, context, callback) {
            // Check for Mozilla
            var isMoz = false;
            $.each(jQuery.browser, function(i, val) {
                if(i=="mozilla" && jQuery.browser.version.substr(0,3)=="1.9"){
                    isMoz=true;
                }
            });
            // The following *ONLY* works with Mozilla
            if(isMoz) {
                // We need the auth token to make PUT changes to FluidDB
                if (context.auth) {
                    try {
                        // Some simple MIME type guessing
                        var mime_type = getTypeFromExtension(upload_element.files[0].fileName);
                        // a freshly hand-crafted XMLHttpRequest...
                        var req = new XMLHttpRequest();
                        req.open("PUT", url, true);
                        req.setRequestHeader("Content-Length", upload_element.files[0].fileSize);
                        req.setRequestHeader('Content-Type', mime_type); 
                        req.setRequestHeader('Authorization', context.auth);
                        req.onreadystatechange = function (aEvt) {  
                            if (req.readyState == 4) {  
                                if(req.status == 204)  
                                    alert("Saved...");
                                else  
                                    alert("Error... "+req.status+" "+req.responseText);
                            }  
                        };
                        req.sendAsBinary(upload_element.files[0].getAsBinary());
                    } catch (err) {
                        alert('There was a problem updating the tag value. :-(');
                    }
                } else {
                    alert("You must be logged in!");
                }
            } else {
                // Didn't you read the bloomin' comments..? ;-)
                alert("This action is only supported in Firefox version 3.0 and above");
            }
        }

        /*
         * Given a filename will attempt to guess the mime-type of the file. In
         * no way, shape or form is this reliable but it's the best one can do
         * quickly and in javascript.
         *
         * If unknown will return "application/octet-stream"
         */
        function getTypeFromExtension(filename) {
            // match it to the mime-type
            extension = getExtension(filename);
            result = MIME_TYPES[extension];
            if(result == undefined) {
                result = "application/octet-stream";
            }
            return result;
        }

        function getExtension(filename) {
            // work out the file extension...
            var ext = /^.+\.([^.]+)$/.exec(filename);
            return ext == null ? "" : ext[1];
        }

        /**********************************************************************
         *
         * Routes
         *
         *********************************************************************/

        /*
         * Using regex and 'splat' to get the full path of the tag we need
         * to edit / display
         */
        this.get(/\#\/(.*)$/, function(context) {
            $("#status_info").html("Getting mime information from FluidDB...");
            var path = this.params["splat"][0];
            var url = 'objects/'+path;
            fluidDB.head(url, function(data){process_tag(path, url, data, context)}, true, context.auth);
        });

        /*
         * POSTing here will update the appropriate tag value. Why no
         * security checks? FluidDB does that for us. We'll just fail. 
         *
         * ToDo: Fail nicely and inform the user... it'll do for now though
         */
        this.post('#/edit_text', function(context) {
            if (context.auth) {
                // The textarea element won't contain the updated value because
                // sammy.js seems to override the onsubmit event set by
                // codemirror that only calls the getCode() function anyway.
                var new_value = EDITOR.getCode(); 
                var tag_path = context['params']['path']; 
                var mime_type = context['params']['mime'];
                var url = 'objects/'+tag_path 
                try {
                    fluidDB.put(url, new_value, function(data){alert("Saved...")}, true, context.auth, mime_type);
                }
                catch (err) {
                    alert('There was a problem updating the tag value. :-(');
                }
            } else {
                alert("You must be logged in!");
            }
        });

        /*
         * POSTing here will attempt to upload a binary file to a FluidDB tag
         * value using PUT. Will only work with Mozilla > 3.0. This is just a
         * wrapper around the "magic" function "upload_to_mozilla"
         */
        this.post('#/edit_image', function(context) {
            var tag_path = context['params']['path'];
            var url = '/objects/'+tag_path 
            var upload_element = context.params.$form.context.image;
            upload_to_mozilla(url, upload_element, context);
        });
    });

    $(function() {
        tag_value_app.run('#/');
    });
})(jQuery);
