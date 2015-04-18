from django.http import HttpResponse
from functools import wraps
from google.appengine.ext import ndb
from core.models import Post, Blog
from core.constants import LOREM, POST_TAGS, POST_TITLES
import json, random, time, logging

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

    # Put some initial test data in the DB
    if not Post.query().fetch():
        for i in range(12):
            time.sleep(0.1)
            add_post(str(i) + ": " + random.choice(POST_TITLES), LOREM, [random.choice(POST_TAGS)], blog_instance)

def add_post(title, body, tags, parent):
    # Create a Post object and persist
    Post(
        parent=parent.key,
        title=title,
        body=body,
        tags=tags,
        published=random.choice([True, True, False])
    ).put()

def get_blog_key():
    # Return our Blog key. There should only be one instance of Blog. This is used as an ancestor to all Posts.
    return Blog.query().get().key

def empty_table(model):
    # Empty given table
    ndb.delete_multi(model.query().fetch(keys_only=True))

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