/*

Based upon work by ecarnevale and ardsrk

See http://github.com/ecarnevale/jsFluidDB

Header handling inspired by http://plugins.jquery.com/project/jqHead

*/ 

fluidDB = new Object();

fluidDB.instance = {
    main : "http://fluiddb.fluidinfo.com/",
    sandbox : "http://sandbox.fluidinfo.com/"
}


fluidDB.choose = function(type){
    //i ToDo: add error handling
    fluidDB.baseURL = fluidDB.instance[type];
}

fluidDB.choose('main');

/*
 * Function to make the call to FluidDB
 *
 * ToDo: Make this more robust. What about gracefully handling errors..?
 *
 * type - a valid HTTP verb (PUT, POST, HEAD, DELETE, GET are used by FluidDB)
 * url - the URL to call
 * payload - payload to deliver (if required)
 * callback - a function called upon success of request
 * async_req - indicates if the request is asyncronous
 * auth_token - used to validate the request with FluidDB
 * mime - the mime-type for the payload
 * header_callback - a function called to handle processing of the response's
 * headers
 */
fluidDB.ajax = function(type, url, payload, callback, async_req, auth_token, mime, header_callback){
    // Some simple validation / set-up
    if(auth_token != undefined) {
      var authenticate = true;
    }
    if(mime == undefined) {
        mime = "application/json";
    }
    if(async_req == undefined){
      async_req = true;
    }

    // Just a standard jQuery ajax call...
    $.ajax({
          async: async_req,
          beforeSend: function(xhrObj){
              if(authenticate){
                  xhrObj.setRequestHeader("Authorization", auth_token);
              };
              xhrObj.setRequestHeader("Accept","*/*");
          },
          contentType: mime,
          type: type,
          url: url,
          data: payload,
          processData: false,
          success: callback,
          complete: function (XMLHttpRequest, textStatus) {
              var headers = XMLHttpRequest.getAllResponseHeaders().split("\n");
              var new_headers = {};
              var l = headers.length;
              for (var key=0;key<l;key++) {
                  if (headers[key].length != 0) {
                      header = headers[key].split(": ");
                      new_headers[header[0]] = header[1];
                  }
              }
              if ($.isFunction(header_callback)) {
                  header_callback(new_headers);
              }
          }
    });
}

/*
 * Some helper functions to abstract things a bit
 */

fluidDB.get = function(url, callback, async_req, auth_token){
    fluidDB.ajax("GET", fluidDB.baseURL+url, null, callback, async_req, auth_token);
}

fluidDB.post = function(url, payload, callback, async_req, auth_token){
    fluidDB.ajax("POST", fluidDB.baseURL+url, payload, callback, async_req, auth_token);
}

fluidDB.put = function(url, payload, callback, async_req, auth_token, mime){
    fluidDB.ajax("PUT", fluidDB.baseURL+url, payload, callback, async_req, auth_token, mime);
}

fluidDB.head = function(url, callback, async_req, auth_token){
    fluidDB.ajax("HEAD", fluidDB.baseURL+url, null, null, async_req, auth_token, null, callback);
}

fluidDB.del = function(url, callback, async_req, auth_token){
    fluidDB.ajax("DELETE", fluidDB.baseURL+url, null, callback, async_req, auth_token);
}
