/*
 * object_app - a generic javascript application for discovering what tags are
 * associated with a particular object within FluidDB. 
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

    var COOKIE_AUTH_TOKEN = 'pocket_fluiddb_auth';
    var COOKIE_USERNAME = 'pocket_fluiddb_username';
    var COOKIE_OPTIONS = { path: '/', expires: 10};

    var object_app = $.sammy(function() {

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
         * Given the result of a GET against an object, this function displays
         * the about value and a list of all tags associated with it that the
         * current user is allowed to see..
         *
         * object_id: the UUID for the object we're displaying
         * data: the results from FluidDB containing the tag list and about for
         * the object
         * context: the Sammy context
         */
        function update_tags(object_id, data, context){
            var obj = JSON.parse(data); 
            // Fill the object id and about elements of the UI 
            $('#uuid').html(object_id);
            $('#about').html(obj.about);
            // cache the jQuery objects
            $tag_list = $('#tag_list');
            // empty it 
            $tag_list.empty();
            $tag_list.append("<h2>Tags Associated with this Object</h2>");
            $tag_list.append("<p>(Click on the tag to view its value.)</p>");
            // sort
            obj.tagPaths.sort();
            // build tag list
            var tl = "";
            for(t in obj.tagPaths) {
                var tag_name = obj.tagPaths[t];
                tl = tl + '<div class="tag_instance"> <img src="images/tag.png" alt="'+tag_name+'" /> <a href="/objects/'+object_id+'/'+tag_name+'">'+tag_name+'</a> <span class="tag_actions"> (<a href="tag_value.html#/'+object_id+'/'+tag_name+'">Edit</a> / <a href="#/'+object_id+'/'+tag_name+'/delete" class="delete" onclick="return(confirm("Are you sure? (This step cannot be undone)"));">Delete</a>) </span> </div>';
            }
            // add to the dom
            $tag_list.append(tl);
            // add tags
        }

        /**********************************************************************
         *
         * Routes
         *
         *********************************************************************/

        this.get(/\#\/(.*)\/delete$/, function(context) {
            if (context.auth) {
                var tag_path = this.params["splat"];
                var url = 'objects/'+tag_path
                // a tad hacky, but reloading the page ensures we get the
                // correct state from FluidDB 
                var object_id = tag_path[0].split("/")[0];
                var object_url = 'objects/'+object_id+'?showAbout=True';
                fluidDB.del(url, function(data){fluidDB.get(object_url, function(data){update_tags(object_id, data, context)}, true, context.auth)}, true, context.auth);
            } else {
                alert("You must be logged in!");
            }
        });

        /*
         * Using regex and 'splat' to get the full path of the namespace we need
         * to display
         */
        this.get(/\#\/(.*)$/, function(context) {
            if (this.params["splat"][0].length > 0) {
                var object_id = this.params["splat"][0];
            } else {
                var uri = document.location.href;
                var object_id = uri.split("/")[4];
            }
            var url = 'objects/'+object_id+'?showAbout=True';
            fluidDB.get(url, function(data){update_tags(object_id, data, context)}, true, context.auth);
        });
    });

    $(function() {
        object_app.run();
    });
})(jQuery);
