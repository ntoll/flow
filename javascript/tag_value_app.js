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

        function edit_code_tag(path, mime, data, context){
            $("#status_info").html("Processing content...");
            // Populate some of the items
            $('#tag_path').html(path);
            $('textarea#code').val(data);
            $('#tag_path_hidden').val(path);
            $('#tag_mime').val(mime);
            // Process the path to be able to get create a couple of hrefs
            var split_path = path.split("/");
            var obj_id = split_path[0];
            // get rid of the tag
            split_path.pop();
            // build the parent namespace path
            var namespace_path = "tags.html#/namespaces/"+split_path.slice(1).join("/");
            $('#view_object').attr("href", "object.html#/"+obj_id);
            $('#view_tag').attr("href", namespace_path);
            var parser = 'parsexml.js';
            var style = 'xmlcolors.css';
            if(mime=='text/css') {
                parser = 'parsecss.js';
                style = 'csscolors.css';
            } else if (mime=='application/javascript') {
                parser = ['tokenizejavascript.js', 'parsejavascript.js'];
                style = 'jscolors.css';
            }

            $("#status_info").html("Initialising code editor...");
            EDITOR = CodeMirror.fromTextArea('code', {
                height: "350px",
                parserfile: parser,
                stylesheet: "stylesheets/"+style,
                path: "javascript/codemirror/",
                continuousScanning: 500,
                lineNumbers: true,
                initCallback: function(e) {
                    $("#loading").hide();
                    $("#edit_content").fadeIn('slow');
                    $("#status_info").html("Initialising...");
                    }
            });
        }

        /* 
         * A very hacky function that attempts to guess the mime type of the
         * data contained within the value of the tag from the tag's
         * "extension".
         *
         * ToDo: This pongs - needs to be fixed.
         */
        function get_mime(path, context) {
            if(path.match(/.js$/)) {
                return "application/javascript";
            } else if (path.match(/.html$/) || path.match(/.ms$/)) {
                return 'text/html';
            } else if (path.match(/.css$/)) {
                return 'text/css';
            } else {
                return '';
            }
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
            $("#status_info").html("Getting content from FluidDB...");
            var path = this.params["splat"][0];
            var mime = get_mime(path, context);
            if(mime.length > 0) {
                // we have a tag with a mime-type we can derive from its name that can be user with the editor
                var url = 'objects/'+path;
                fluidDB.get(url, function(data){edit_code_tag(path, mime, data, context)}, true, context.auth);
            } else {
                // not sure what to make of the tag value so display a form to
                // allow them to upload something... :-/
                // ToDo: Finish this
            }
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
