"""
Extracted and modified from FluidFS by Sanghyeon Seo

See: http://bitbucket.org/sanxiyn/fluidfs/
"""
import sys

import httplib2
import urllib

if sys.version_info < (2, 6):
    import simplejson as json
else:
    import json

MAIN = 'http://fluiddb.fluidinfo.com'
SANDBOX = 'http://sandbox.fluidinfo.com'
prefix = SANDBOX 

global_headers = {
    'Accept': '*/*',
}

def login(username, password):
    userpass = username + ':' + password
    auth = 'Basic ' + userpass.encode('base64').strip()
    global_headers['Authorization'] = auth

def logout():
    del global_headers['Authorization']

def call(method, path, body=None, mime='text/plain', **kw):
    http = httplib2.Http()
    url = prefix + urllib.quote(path)
    if kw:
        url = url + '?' + urllib.urlencode(kw)
    headers = global_headers.copy()
    if isinstance(body, dict):
        headers['content-type'] = 'application/json'
        body = json.dumps(body)
    elif body:
        headers['content-type'] = mime
    response, content = http.request(url, method, body, headers)
    status = response.status
    if response['content-type'].startswith('application/json'):
        result = json.loads(content)
    else:
        result = content
    return response, result
