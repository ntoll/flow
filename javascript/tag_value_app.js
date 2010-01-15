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
            switch(split_mime[0]){
                case "application":
                    switch(split_mime[1]){
                        case "javascript":
                        case "json":
                        case "vnd.fluiddb.value+json":
                            fluidDB.get(url, function(tag_value){edit_code(path, mime, tag_value, context)}, true, context.auth);
                            break;
                    }
                    break;
                case "text":
                    fluidDB.get(url, function(tag_value){edit_code(path, mime, tag_value, context)}, true, context.auth);
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
                    $("#edit_content").fadeIn('slow');
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
        this.post(/\#\/(.*)$/, function(context) {
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
    });

    $(function() {
        tag_value_app.run('#/');
    });
})(jQuery);
