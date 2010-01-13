/*

Based upon work by ecarnevale and ardsrk

See http://github.com/ecarnevale/jsFluidDB

*/ 

fluidDB = new Object();

fluidDB.instance = {
    main : "http://fluiddb.fluidinfo.com/",
    sandbox : "http://sandbox.fluidinfo.com/"
}


fluidDB.choose = function(type){
    //add error handling
    fluidDB.baseURL = fluidDB.instance[type];
}

fluidDB.choose('sandbox');

fluidDB.ajax = function(type, url, payload, callback, async_req, auth_token, mime){
    if(auth_token != undefined) {
      var authenticate = true;
    }

    if(mime == undefined) {
        mime = "application/json";
    }
    
    if(async_req == undefined){
      async_req = true;
    }
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
          success: callback
    });
}

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
    fluidDB.ajax("HEAD", fluidDB.baseURL+url, null, callback, async_req, auth_token);
}

fluidDB.del = function(url, callback, async_req, auth_token){
    fluidDB.ajax("DELETE", fluidDB.baseURL+url, null, callback, async_req, auth_token);
}
