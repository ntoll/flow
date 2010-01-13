#!/usr/bin/env python
"""
An ugly hack that passes as a means for pushing files and directories to FluidDB
as tags and namespaces.

Use for creating FluidApps (until I've managed to bootstrap enough that we can
use FluidDB as an IDE for FluidApps).

Created by Nicholas Tollervey - http://ntoll.org/contact
"""
import logging
import sys
import os
import datetime
import time
import fluiddb as fd
if sys.version_info < (2, 6):
    import simplejson as json
else:
    import json

LOG_FILENAME = 'push.log'
logging.basicConfig(filename=LOG_FILENAME, level=logging.DEBUG,
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")

def processDirectoryIntoNamespace(directory, last_update, credentials, object):
    """
    Given a path to a directory on the local filesystem this method will
    find/create an associated namespace on FluidDB and populate it with child
    tags that map to the local files
    """
    directory_path = directory[0]
    logging.info('Checking directory %s'%directory_path)
    # We ignore hidden directories
    if directory_path.find('.DS_Store') >= 0 or directory_path.find('.git') >= 0:
        logging.info('Ignoring GIT related directory')
        return
    elif directory_path.startswith('./') or directory_path == '.':
        logging.info('OK')
    else:
        logging.info('Ignoring hidden directory')
        return
    # Lets build the path as it would appear in FluidDB
    fluid_namespace_path = '/'.join((
        '/namespaces', # namespaces root
        credentials['username'], # user's root namespace
        'fluidapp', # the namespace underneath which we store fluid applications
        credentials['root_namespace'] # the "application" namespace
        ))
    if len(directory_path)>2:
        fluid_namespace_path = '/'.join((fluid_namespace_path, directory_path[2:]) # the path of the directory with ./ knocked off the front
        )
    logging.info('FluidDB namespace: %s'%fluid_namespace_path)
    # Lets see what FluidDB responds with
    state_of_namespace = fd.call('GET', fluid_namespace_path)
    logging.info('State of namespace:')
    logging.info(state_of_namespace)
    if state_of_namespace[0]['status'] == '404':
        # The namespace that represents this directory doesn't exist so lets
        # create it...
        logging.info('Creating new namespace')
        parent_namespace = '/'.join(fluid_namespace_path.split('/')[:-1])
        logging.info('Parent namespace: %s'%parent_namespace)
        new_namespace_name = fluid_namespace_path.split('/')[-1:][0]
        logging.info('New namespace name: %s'%new_namespace_name)
        logging.info(fd.call('POST', parent_namespace,
            {'description': u'A directory in the %s FluidApp'%credentials['root_namespace'],
            'name': new_namespace_name}))
    if state_of_namespace[0]['status'] == '404' or state_of_namespace[0]['status'] == '200':
        # process the files
        files = directory[2]
        logging.info('Files in this directory:')
        logging.info(files)
        for file in files:
            processFileIntoTag(file, directory_path,
                    fluid_namespace_path.replace('/namespaces','/tags'),
                    last_update, object, credentials)
    else:
        logging.error('Barfed! -----------------------------------')
        return
    logging.info('Finished! ----------------------------------')

def processFileIntoTag(file, directory_path, fluid_namespace_path, last_update,
        object, credentials):
    logging.info('Checking file: %s'%file)
    if file.startswith('.') or file.endswith('.log') or file.endswith('.pyc') or file.endswith('.swp') or file == 'credentials.json':
        logging.info('Ignoring log/hidden file...')
        return
    # do we need to process it (compare timestamps)?
    file_stat = os.stat('/'.join((directory_path, file)))
    if not file_stat.st_mtime > last_update:
        logging.info('Unchanged since last push so ignoring...')
        return
    logging.info('Changed since last push')
    # does the tag exist..?
    tag_path = "/".join((fluid_namespace_path, file))
    logging.info('Tag path in FluidDB: %s'%tag_path)
    state_of_tag = fd.call('GET', tag_path)
    logging.info(state_of_tag)
    if state_of_tag[0]['status'] == '404':
        # NO! so we need to create it
        logging.info(fd.call('POST', fluid_namespace_path, { 
            'name': file, 
            'description': 'A tag in the %s FluidApp'%credentials['root_namespace'],
            'indexed': True
            }))
    # Lets create tag value on the appropriate object. To start we need to work
    # out the appropriate mime type (very hacky)
    mime = 'text/plain'
    if file.endswith('.css'):
        mime = 'text/css'
    elif file.endswith('.js'):
        mime = 'application/javascript'
    elif file.endswith('.html'):
        mime = 'text/html'
    elif file.endswith('.png'):
        mime = 'image/png'
    elif file.endswith('.jpg'):
        mime = 'image/jpg'
    elif file.endswith('.gif'):
        mime = 'image/gif'
    logging.info('Pushing file %s as a value for tag: %s with mime: %s'%(file, tag_path, mime))
    body = open('/'.join((directory_path, file)), 'r')
    logging.info(fd.call('PUT', ''.join([object, tag_path[5:]]), body.read(), mime))
    body.close()

def main(args):
    """
    Set stuff up, read credentials, start the ball rolling
    """
    logging.info("++++++++++++++++++++++++++++++++++++++++++++++")
    logging.info("++++++++++++++++++++++++++++++++++++++++++++++")
    logging.info("Starting push at %s"%datetime.datetime.today().ctime())
    try:
        homedir = os.path.expanduser('~')
        logging.info("Attempting to load credentials.json from %s"%homedir)
        credentials_file = open('credentials.json', 'r')
        credentials = json.loads(credentials_file.read())
    except Exception as e:
        logging.error("Could not process credentials...")
        logging.error(e)
        sys.exit()
    finally:
        credentials_file.close()
    if 'main' in args:
        fd.prefix = fd.MAIN
    else:
        fd.prefix = fd.SANDBOX
    logging.info("FluidDB instance: %s"%fd.prefix)
    fd.login(credentials['username'], credentials['password'])
    new_object_flag = False
    last_update = False
    if credentials.has_key('object_id'):
        object = '/objects/'+credentials['object_id']
        # lets just check we've got the expected object (in case of Sandbox reset)
        check_response = fd.call('GET', object)
        if check_response[0]['status'] == '200':
            new_object_flag = not check_response[1]['tagPaths']
        else:
            new_object_flag = True
    if new_object_flag:
        # ok, so the expected object doesn't exist so create a new one and store
        # back in the credentials file...
        new_object_response = fd.call('POST', '/objects', {"about": 'A new FluidApp'}) 
        if new_object_response[0]['status'] == '201':
            new_id = new_object_response[1]['id']
            credentials['object_id'] = new_id
            object = '/objects/'+credentials['object_id']
            try:
                credentials_out = open('credentials.json', 'w')
                credentials_out.write(json.dumps(credentials, indent=2))
            finally:
                credentials_out.close()
            logging.warning('New object created: %s'%object)
            print 'New object created: %s'%object
            last_update = 1.0
    logging.info("Object id: %s"%object)
    os.chdir('..')
    if not last_update:
        try:
            timestamp_file = open('.timestamp', 'r')
            last_update = float(timestamp_file.read())
            timestamp_file.close()
        except:
            last_update = 1.0
    # Update the timestamp to now
    try:
        timestamp_file = open('.timestamp', 'w')
        timestamp_file.write(str(time.mktime(datetime.datetime.today().timetuple())))
    finally:
        timestamp_file.close()
    # lets check we have a fluidApp namespace
    # Lets build the path as it would appear in FluidDB
    fluid_namespace_path = '/'.join((
        '/namespaces', # namespaces root
        credentials['username'], # user's root namespace
        'fluidapp', # the namespace underneath which we store fluid applications
        ))
    state_of_fluidapp_namespace = fd.call('GET', fluid_namespace_path)
    logging.info(state_of_fluidapp_namespace)
    if state_of_fluidapp_namespace[0]['status'] == '404':
        # The namespace that represents the fluidapp namespace
        logging.info('Creating new namespace for fluidapps')
        parent_namespace = '/'.join(fluid_namespace_path.split('/')[:-1])
        logging.info('Parent namespace: %s'%parent_namespace)
        new_namespace_name = fluid_namespace_path.split('/')[-1:][0]
        logging.info('New namespace name: %s'%new_namespace_name)
        logging.info(fd.call('POST', parent_namespace,
            {'description': u'A namespace for storing fluidapps created by %s'%credentials['username'],
            'name': new_namespace_name}))

    # navigate the directory tree and work out what are the new/updated files
    # and namespaces that need pushing to FluidDB
    for directory in os.walk('.'):
        processDirectoryIntoNamespace(directory, last_update, credentials, object)

if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
