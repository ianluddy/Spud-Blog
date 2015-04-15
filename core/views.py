from django.views.generic import TemplateView
from django.http import HttpResponse
import logging
import json

from core.constants import POST_PAGE_SIZE
from core.models import Post, Blog
from core.utils import json_response, flatten_list, page_count, get_blog_key

######## Pages ########

index = TemplateView.as_view(template_name='index.html')  # Public page
admin = TemplateView.as_view(template_name='admin.html')  # Admin page

######## API ########

def posts(request):
    """
    Get Published Blog Posts
    :param tags LIST of tags to filter on [optional]
    :param page INT page number of Posts to return [optional]
    :param titles_only BOOLEAN return Post titles and stamps only [optional]
    :param published_only BOOLEAN return published Posts only [optional]
    :return: LIST
    """
    # Grab any parameters we can
    published_only = request.GET.get("published_only", "").lower() in ["true", "1"]
    titles_only = request.GET.get("titles_only", "").lower() in ["true", "1"]
    page_number = int(request.GET.get("page")) if "page" in request.GET else None
    tags = json.loads(request.GET.get("tags")) if "tags" in request.GET else []
    post_id = long(request.GET.get("id")) if "id" in request.GET else None

    # ID filter (if we get an ID parameter lets assume the user wants all the info on that Post)
    if post_id:
        post = Post.get_by_id(post_id, parent=get_blog_key())
        iterator = [post] if post else []
    else:
        # If no ID specified, get all Posts ordered by stamp for our Blog
        post_query = Post.query(ancestor=get_blog_key()).order(Post.stamp)

        # Published filter
        if published_only:
            post_query = post_query.filter(Post.published == True)

        # Tag filter
        if tags:
            post_query = post_query.filter(Post.tags.IN(tags))

        # Page Filter
        if page_number is not None:
            iterator = post_query.fetch(POST_PAGE_SIZE, offset=page_number * POST_PAGE_SIZE)
        else:
            iterator = post_query.fetch()

    # Preview or full Post
    if titles_only:
        response = json_response([post.preview() for post in iterator])
    else:
        response = json_response([post.dictionary() for post in iterator])

    return response


def delete_post(request):
    """
    Delete Blog Post
    :param: id LONG id of post to delete
    :return: BOOL success or failure
    """
    # Grab Post ID
    post_id = long(request.GET.get("id")) if "id" in request.GET else None

    # Attempt to delete the Post
    try:
        Post.get_by_id(post_id, parent=get_blog_key()).key.delete()
        success = True
    except Exception:
        logging.error("Error deleting Post", exc_info=True)
        success = False

    return HttpResponse(success)


def update_post(request):
    """
    Add/Edit Blog Post
    :param: id LONG id of post to update [optional]
    :param: title STR post title [optional]
    :param: body STR post body [optional]
    :param: published BOOL post published flag [optional]
    :return: BOOL success or failure
    """
    post_id = long(request.GET.get("id")) if "id" in request.GET else None

    # Create or retrieve Post
    if post_id:
        post = Post.get_by_id(post_id, parent=get_blog_key())
    else:
        post = Post(parent=get_blog_key())

    # Update Post
    if "body" in request.GET:
        post.body = request.GET.get("body")
    if "title" in request.GET:
        post.title = request.GET.get("title")
    if "publish" in request.GET:
        post.published = request.GET.get("publish", "").lower() in ["true", "1"]
    if "tags" in request.GET:
        post.tags = json.loads(request.GET.get("tags").lower()) if "tags" in request.GET else []

    # Persist
    try:
        post.put()
        success = True
    except Exception:
        success = False
        logging.error("Error saving post", exc_info=True)

    return HttpResponse(success)


def pages(request):
    """
    Get number of pages of Blog Posts
    :param LIST of tags to filter on [optional]
    :return: INT
    """
    # Grab all published Posts
    post_query = Post.query().filter(Post.published == True)

    # Apply Tag filter
    tags = json.loads(request.GET.get("tags").lower()) if "tags" in request.GET else []
    if tags:
        post_query = post_query.filter(Post.tags.IN(tags))

    return HttpResponse(page_count(post_query.count(), POST_PAGE_SIZE))

def post_page(request):
    """
    Get Page number of given Post
    :param id LONG id of Post
    :param tags LIST of tags to filter on [optional]
    :return: INT
    """
    # Grab all published Posts
    post_query = Post.query().filter(Post.published == True)

    # Apply Tag filter
    tags = json.loads(request.GET.get("tags").lower()) if "tags" in request.GET else []
    if tags:
        post_query = post_query.filter(Post.tags.IN(tags))

    return HttpResponse(page_count(post_query.count(), POST_PAGE_SIZE))

def tags(request):
    """
    Get exhaustive list of Tags for published Posts
    :return: LIST of Post tags
    """
    # Grab all published Posts
    post_query = Post.query(ancestor=get_blog_key()).filter(Post.published == True)

    # Remove duplicates
    tags = list(set(flatten_list([post.tags for post in post_query.iter()])))

    return json_response(tags)