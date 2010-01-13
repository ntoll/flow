/*
 * tag_app - a generic javascript application for navigating namespaces, tags
 * and other related tasks within FluidDB 
 *
 * (c) 2010 Nicholas H.Tollervey (http://ntoll.org/contact)
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

    var tag_app = $.sammy(function() {
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
         * Given the result of a GET against a namespace, this function displays
         * any child namespaces and tags.
         *
         * path: the path of the namespace that is currently being displayed
         * data: the results from FluidDB containing the contents of the
         * namespace
         * context: the Sammy context
         */
        function update_tags(path, data, context){
            var obj = JSON.parse(data); 
            if (path.length>0) {
                if(path.match('^namespaces')) {
                    var full_path = path;
                } else {
                    var full_path = ['namespaces', path].join("/");
                }
            } else {
                var full_path = 'namespaces';
            }
            var split_path = full_path.split("/");
            var namespace_name = split_path.pop();
            var parent_namespace_url = split_path.join('/');
            if(parent_namespace_url.length>0) {
                var parent_namespace_text = parent_namespace_url+'/';
            } else {
                var parent_namespace_text = '';
            }
            // Populate some of the items
            $('textarea#namespace_description_textarea').val(obj.description);
            $('#namespace_description').html(obj.description);
            $('#path').html('<a href="#/'+parent_namespace_url+'">'+parent_namespace_text+'</a>'+namespace_name);
            $('#namespace_path').val(full_path);
            $('#namespace_parent').val(full_path);
            $('#tag_parent').val(full_path);
            if(obj.namespaceNames.length==0 && obj.tagNames.length==0) {
                // This is an empty namespace so we can delete it if needs be.
                // So display the deletion link
                $('#delete_namespace').show();
            } else {
                // we make sure this element is hidden as it needs to be re-set
                // after a child namespace has been deleted.
                $('#delete_namespace').hide();
            }
            // cache the two jQuery objects to hold the namespace and tag lists
            $namespace_list = $('#namespace_list');
            $tag_list = $('#tag_list');
            // empty them
            $namespace_list.empty();
            $tag_list.empty();
            // sort
            obj.tagNames.sort();
            obj.namespaceNames.sort();
            // build namespace list
            var nl = "";
            for(n in obj.namespaceNames) {
                var namespace = obj.namespaceNames[n];
                nl = nl + '<div class="namespace_instance"> <img src="images/folder.png" alt="'+namespace+'" /> <a href="#/'+full_path+'/'+namespace+'">'+namespace+'</a> </div>'
            }
            // build tag list
            var tl = "";
            for(t in obj.tagNames) {
                var tag_name = obj.tagNames[t];
                var clean_tag_name = tag_name.replace(".", "DOT");
                tl = tl + '<div class="tag_instance"> <img src="images/tag.png" alt="A tag called '+tag_name+'" /> <a href="search.html#/has%20'+path+'/'+tag_name+'">'+tag_name+'</a> <span class="tag_actions"> (<a href="#/get_description/'+path+'/'+tag_name+'" class="tag_more">More</a> / <a href="#/tag/'+path+'/'+tag_name+'/delete" class="delete" onclick="return(confirm(\'Are you sure? (This step cannot be undone)\'));">Delete</a>) </span></div>';
            }
            // add a secret hidden throbber to show when deleting something...
            $namespace_list.append('<img src="images/loader.gif" alt="Working..." id="list_loader" style="display: none;"/>');
            // add to the dom
            $namespace_list.append(nl);
            $tag_list.append(tl);
        }

        /*
         * Show the updated namespace description value
         */
        function update_namespace_description(description) {
            $('textarea#namespace_description_textarea').val(description);
            $('#namespace_description').html(description);
            $('#namespace_edit').hide();
            $('#namespace_actions').fadeIn('slow');
        }

        /*
         * Show the description form with the tag's current description
         */
        function update_tag_description(data, tag_path) {
            var tag_name = tag_path.split("/").pop(); 
            var obj = JSON.parse(data); 
            $('#tag_path').html(tag_path);
            $('#tab_description_read_only').html(obj.description);
            $('textarea#tag_description_textarea').val(obj.description);
            $('#full_tag_path').val(tag_path);
            if(obj.indexed) {
                $('#tag_indexed').html('<img src="images/tick.png" alt="Yes"/>');
            } else {
                $('#tag_indexed').html('<img src="images/cross.png" alt="No"/>');
            }
            $('#info_waiting').hide();
            $('#tag_info_area').fadeIn('slow');
        }

        /**********************************************************************
         *
         * Routes
         *
         *********************************************************************/

        /* 
         * Grab a tag's description and other information
         */
        this.get(/\#\/get_description\/(.*)$/, function(context) {
            $("#tag_info").jqmShow();
            $('#tag_description').show();
            $('#edit_tag_description').hide();
            $('#tag_update_working').hide();
            $('#tag_info_area').hide();
            $('#info_waiting').show();
            var tag_path = this.params["splat"][0];
            fluidDB.get('tags/'+tag_path+'?returnDescription=True', function(data){update_tag_description(data, tag_path)}, true, context.auth);
        });

        /*
         * Update a tag's description
         */
        this.post('#/tag/edit', function(context) {
            if (context.auth){
                $('#tag_update_working').show();
                var tag_path = context['params']['full_tag_path'];
                var tag_name = tag_path.split("/").pop();
                var description = context['params']['tag_description_text'];
                var payload = { "description": description };
                try {
                    fluidDB.put('tags/'+tag_path, JSON.stringify(payload), function(data){$('#tag_info').jqmHide(); $('#tag_update_working').hide(); alert('Successfully updated');}, true, context.auth);
                } catch (err) {
                    alert('There was a problem updating the tag. :-(');
                }
            } else {
                alert("You must be logged in!");
            }
        });

        /*
         * Delete a tag
         */
        this.get(/\#\/tag\/(.*)\/delete$/, function(context) {
            if (context.auth) {
                $('#list_loader').show();
                var fluid_path = this.params["splat"][0];
                var url = 'tags/'+fluid_path
                // a tad hacky, but reloading the page ensures we get the
                // correct state from FluidDB 
                var split_path = fluid_path.split("/");
                split_path.pop();
                var namespace_url = 'namespaces/'+split_path.join('/');
                var namespace_query  = namespace_url+'?returnDescription=True&returnNamespaces=True&returnTags=True';
                fluidDB.del(url, function(data){fluidDB.get(namespace_query, function(data){update_tags(namespace_url, data, context); alert('Deleted');}, true, context.auth)}, true, context.auth);
            } else {
                alert("You must be logged in!");
            }
        });

        /*
         * Delete a namespace
         */
        this.get('#/delete', function(context) {
            if (context.auth) {
                $('#list_loader').show();
                var url = $('#path')[0].innerText
                // a tad hacky, but reloading the page ensures we get the
                // correct state from FluidDB 
                var split_path = url.split("/");
                split_path.pop();
                var parent_namespace = split_path.join('/')
                var namespace_url = parent_namespace+'?returnDescription=True&returnNamespaces=True&returnTags=True';
                fluidDB.del(url, function(data){fluidDB.get(namespace_url, function(data){update_tags(parent_namespace, data, context); alert('Deleted');}, true, context.auth)}, true, context.auth);
            } else {
                alert("You must be logged in!");
            }
        });

        /*
         * New Namespace
         */
        this.post('#/namespace/new', function(context) {
            if (context.auth) {
                $('#namespace_working').show();
                var name = context['params']['namespace_name'];
                var description = context['params']['namespace_description'];
                var parent_path = context['params']['namespace_parent']; 
                if (name.length > 0 && parent_path.length > 0) {
                    var payload = { "description": description, "name": name };
                    try {
                        var namespace_url = parent_path+'?returnDescription=True&returnNamespaces=True&returnTags=True';
                        fluidDB.post(parent_path, JSON.stringify(payload), function(data){fluidDB.get(namespace_url, function(ns_data){update_tags(parent_path, ns_data, context); $('#namespace_working').hide();$('#add_namespace').jqmHide(); alert('Successfully created');}, true, context.auth)}, true, context.auth);
                    } catch (err) {
                        alert('There was a problem creating the namespace. :-(');
                    }
                } else {
                    alert("You must supply a name for the new namespace");
                }
            } else {
                alert("You must be logged in!");
            }
        });

        /*
         * New Tag
         */
        this.post('#/tag/new', function(context) {
            if (context.auth) {
                $('#tag_working').show();
                var name = context['params']['tag_name'];
                var description = context['params']['tag_description'];
                var indexed = context['params']['tag_indexed'];
                var parent_path = context['params']['tag_parent']; 
                if (indexed == undefined) {
                    indexed = false;
                } else {
                    indexed = true;
                }
                if (name.length > 0 && parent_path.length > 0) {
                    var payload = { "description": description, "name": name, "indexed": indexed };
                    var split_path = parent_path.split('/');
                    var new_tag_parent = split_path.slice(1).join('/');
                    try {
                        var namespace_url = parent_path+'?returnDescription=True&returnNamespaces=True&returnTags=True';
                        fluidDB.post("tags/"+new_tag_parent, JSON.stringify(payload), function(data){fluidDB.get(namespace_url, function(ns_data){update_tags(new_tag_parent, ns_data, context); $('#tag_working').hide(); $('#add_tag').jqmHide(); alert('Successfully created');}, true, context.auth)}, true, context.auth);
                    } catch (err) {
                        alert('There was a problem creating the tag. :-(');
                    }
                } else {
                    alert("You must supply a name for the new tag");
                }
            } else {
                alert("You must be logged in!");
            }
        });

        /*
         * Using regex and 'splat' to get the full path of the namespace we need
         * to display
         */
        this.get(/\#\/namespaces\/(.*)$/, function(context) {
            var fluid_path = this.params["splat"][0];
            var url = 'namespaces/'+fluid_path+'?returnDescription=True&returnNamespaces=True&returnTags=True';
            fluidDB.get(url, function(data){update_tags(fluid_path, data, context)}, true, context.auth);
        });

        /*
         * A special case for displaying the root namespace. I'll have to add a
         * means of making sure we don't return too many records at a later
         * date...
         */
        this.get('#/namespaces', function(context) {
            var url = 'namespaces?returnDescription=True&returnNamespaces=True&returnTags=True';
            fluidDB.get(url, function(data){update_tags('namespaces', data, context)}, true, context.auth);
        });

        /*
         * "Homepage" of the application. Sets the starting state according to
         * the context of the request (logged in or not)
         */
        this.get('#/', function(context) {
            if (context.auth) {
                var fluid_path = context.username;
                var url = 'namespaces/'+fluid_path+'?returnDescription=True&returnNamespaces=True&returnTags=True';
                fluidDB.get(url, function(data){update_tags(fluid_path, data, context)}, true, context.auth);
            } else {
                alert("You must be logged in!"); 
            }
        });

        /*
         * POSTing here will update the description of the namespace. Why no
         * security checks? FluidDB does that for us. We'll just fail. 
         *
         * ToDo: Fail nicely and inform the user... it'll do for now though
         */
        this.post('#/namespace/edit', function(context) {
            if (context.auth) {
                var description = context['params']['description'];
                var fluid_path = context['params']['path']; 
                var url = fluid_path+'?returnDescription=True&returnNamespaces=True&returnTags=True';
                var payload = { "description": description };
                try {
                    fluidDB.put(fluid_path, JSON.stringify(payload), function(data){update_namespace_description(description)}, true, context.auth);
                }
                catch (err) {
                    alert('There was a problem updating the namespace. :-(');
                }
            } else {
                alert("You must be logged in!");
            }
        });
    });

    $(function() {
        tag_app.run('#/');
    });
})(jQuery);
