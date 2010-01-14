/*
 * session_app - a generic javascript application for logging a user in/out
 * and tracking their session.
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

    var session_app = $.sammy(function() {
        // the element_selector puts this application in the context of the
        // session element
        element_selector = '#session';
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

        /*
         * Builds the logout form
         */
        function buildLogout(username) {
            return '<span id="session"><form method="POST" action="#/logout"> Logged in as: <strong>'+username+'</strong> <input type="submit" value="Log out"/> </form> </span>';
        }

        /**********************************************************************
         *
         * Routes
         *
         *********************************************************************/
        
        /*
         * Logout the user by null-ing the cookies that identify them
         */
        this.post('#/logout', function(context) {
            if(context.auth) {
                var COOKIE_OPTIONS = { path: '/', expires: 10};
                $.cookie(COOKIE_AUTH_TOKEN, null, COOKIE_OPTIONS);
                $.cookie(COOKIE_USERNAME, null, COOKIE_OPTIONS);
            }
            context.partial('templates/login.ms', null, function(rendered) { $('#session').replaceWith(rendered)});
        });

        /*
         * Login the user by storing away their username and the string used for
         * the basic authorization header into a couple of cookies.
         */
        this.post('#/login', function(context) {
            // extracting the username and password from the form (passed in
            // via the params dictionary).
            var name = context['params']['username'];
            var password = context['params']['password'];
            // Basic validation
            if (name.length > 0 && password.length > 0) {
                var COOKIE_OPTIONS = { path: '/', expires: 10};
                var auth = "Basic "+$.base64Encode(name+':'+password);
                $.cookie(COOKIE_AUTH_TOKEN, auth, COOKIE_OPTIONS);
                $.cookie(COOKIE_USERNAME, name, COOKIE_OPTIONS);
                $('#session').replaceWith(buildLogout(name));
                // reloading will trigger the re-set of the home-page with data
                // pulled from FluidDB - very hacky... :-/
                location.reload();
            } else {
                // oops...
                alert('You must enter a username and password');
            }
        });

        /*
         * This path will always match. Its function is to set the appropriate
         * session state indicator ("Logged in as: foo" or a login form) in the
         * menu bar of every page.
         */
        this.get(/(.*)/, function(context) {
            if (context.auth) {
                $('#session').replaceWith(buildLogout(context.username));
            } else {
                context.partial('templates/login.ms', null, function(rendered) { $('#session').replaceWith(rendered)});
            }
        });

    });

    $(function() {
        session_app.run();
    });
})(jQuery);
