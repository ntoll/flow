/*
 * search_app - a generic search application for FluidDB 
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

    var search_app = $.sammy(function() {
        // the element_selector puts this application in the context of the
        // session element
        element_selector = '#content';
        this.use(Sammy.Mustache, 'ms');

        /**********************************************************************
         *
         * UI Helper functions
         *
         *********************************************************************/

        /*
         * Displays the results of a search of FluidDB
         */
        function search_results(data, context){
            var obj = JSON.parse(data);
            // cache the jQuery object
            var $search_results = $('#search_results');
            // empty the element
            $search_results.empty();
            // add the results
            $search_results.append('<h2>Results</h2><p>Objects with the following ids match your query:</p>');
            if (obj.ids.length>0) {
                var ol = "";
                for(o in obj.ids) {
                    var obj_id = obj.ids[o];
                    ol = ol + '<div class="result"><a href="object.html#/'+obj_id+'">'+obj_id+'</a></div>'
                }
                $search_results.append(ol);
            } else {
                $search_results.append('<div>None found. Please try again...</div>');
            }
        }

        /**********************************************************************
         *
         * Routes
         *
         *********************************************************************/
        
        /*
         * Search FluidDB using the query language described here:
         *
         * http://doc.fluidinfo.com/fluidDB/queries.html
         *
         */
        this.post('#/search', function(context) {
            var search_term = context['params']['search'];
            // Basic validation
            if (search_term.length > 0) {
                try {
                    fluidDB.get('objects?query='+escape(search_term), function(data){search_results(data, context);}, true, context.auth);
                }
                catch (err) {
                    $('#search_results').append('<h3>There was a problem with your search :-(<h3><p>Please try again...</p>');
                }
            } else {
            // oops...
                alert('You must enter something to search for...');
            }
        });

        /*
         * Search FluidDB with a GET request made using the query language
         * referenced above.
         */
        this.get(/\#\/(.*)$/, function(context) {
            var search_term = this.params["splat"][0];
                try {
                    // update the UI and get the search request from FluidDB
                    $("#search_box").val(search_term.replace("%20"," "));
                    fluidDB.get('objects?query='+search_term, function(data){search_results(data, context);}, true, context.auth);
                }
                catch (err) {
                    $('#search_results').append('<h3>There was a problem with your search :-(<h3><p>Please try again...</p>');
                }
        });
    });

    $(function() {
        search_app.run();
    });
})(jQuery);
