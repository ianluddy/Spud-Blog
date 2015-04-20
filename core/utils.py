from functools import wraps
import json
import time
import logging

from django.shortcuts import render_to_response
from django.http import HttpResponse
from google.appengine.ext import ndb
from core.models import Post, Blog, User, Token
from core.constants import AUTH_COOKIE_KEY, LOGIN_PAGE, MAX_NUMBER_OF_POSTS

#### Utils ####

def format_datetime(dtime):
    # Format datetime
    return dtime.strftime('%Y-%m-%d %H:%M:%S %Z')

def json_response(data):
    # Build HTTP Response from JSON data
    return HttpResponse(json.dumps(data), content_type="application/json")

def flatten_list(list_of_lists):
    # Flatten list of lists
    return [item for sublist in list_of_lists for item in sublist]

def page_count(object_count, page_size):
    # Get total page count given total object count and page size
    count = object_count / page_size
    if object_count % page_size > 0:
        count += 1
    return count

#### Auth ####

def valid_auth_cookie(token_value):
    # Validate our token, make sure a User exists
    token = Token.query(Token.value == token_value, ancestor=get_blog_key()).get()
    if token:
        token.refresh()
    return bool(token)

def log_user_in():
    # Create a Session token and return it's value
    new_token = Token(parent=get_blog_key())
    new_token.put()
    return new_token.value

def log_user_out(token):
    # Delete the given Session token
    token = Token.query(Token.value == token, ancestor=get_blog_key()).get()
    if token:
        token.key.delete()

#### Database ####

def tag_filter(request, query):
    # Pull tags from request and apply to query
    tags = json.loads(request.GET.get("tags", "[]"))
    if tags:
        return query.filter(Post.tags.IN(tags))
    return query

def initialise_db():
    # Create an ancestor for all of our Posts to ensure consistency when manipulating Posts
    blog_instance = Blog.query().get()
    if not blog_instance:
        blog_instance = Blog()
        blog_instance.put()

    # Create Users
    if not User.query().fetch():
        User(
            username='admin',
            password='admin'  # TODO - obfuscate this
        ).put()

def get_blog_key():
    # Return our Blog key. There should only be one instance of Blog. This is used as an ancestor to all Posts.
    return Blog.query().get().key

#### Decorators ####

def parse_parameters(str_list=[], bool_list=[], json_list=[], int_list=[]):
    # Parse parameters from the request object and cast to whatever we think they should be
    # Then pass on to the View
    def decorator(view):
        @wraps(view)
        def wrapper(request, *args, **kwargs):
            keyword_args = {}

            # Grab Strings
            for key in str_list:
                keyword_args[key] = request.GET.get(key)

            # Parse booleans
            for key in bool_list:
                keyword_args[key] = True if request.GET.get(key, "").lower() in ["true", "1"] else False

            # Parse JSON
            for key in json_list:
                keyword_args[key] = json.loads(request.GET.get(key)) if key in request.GET else []

            # Parse Ints
            for key in int_list:
                keyword_args[key] = long(request.GET.get(key)) if key in request.GET else None

            return view(request, *args, **keyword_args)
        return wrapper
    return decorator

def authenticate_user():
    # Authenticate user
    def decorator(view):
        @wraps(view)
        def wrapper(request, *args, **kwargs):

            # Look for an auth cookie and validate it
            authorised = True
            if AUTH_COOKIE_KEY not in request.COOKIES:
                # Auth cookie not found so redirect
                authorised = False
            elif not valid_auth_cookie(request.COOKIES.get(AUTH_COOKIE_KEY)):
                # Auth cookie not tied to a valid User
                authorised = False

            # Redirect to Login if unauthorised, otherwise return what was asked for
            if authorised:
                return view(request, *args, **kwargs)
            else:
                return render_to_response(LOGIN_PAGE, {})

        return wrapper
    return decorator

#### Clean Up ####

def clean_session_tokens():
    # Remove expired Tokens
    ndb.delete_multi(Token.query(Token.expires < int(time.time())).fetch(keys_only=True))

def clean_posts():
    # Remove posts if we have exceeded the limit
    for expired_post in Post.query().order(-Post.stamp).fetch()[MAX_NUMBER_OF_POSTS:]:
        expired_post.key.delete()