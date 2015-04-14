from django.views.generic import TemplateView
from django.http import HttpResponse
from core.constants import POST_PAGE_SIZE
import logging
import json
from core.models import Post
from core.utils import json_response, flatten_list, page_count, tag_filter


######## Pages ########

index = TemplateView.as_view(template_name='index.html')# Public page
admin = TemplateView.as_view(template_name='admin.html')# Admin page

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
    published_only = request.GET.get("published_only", "").lower() in ["true", "1"]
    titles_only = request.GET.get("titles_only", "").lower() in ["true", "1"]
    page_number = int(request.GET.get("page")) if "page" in request.GET else None
    tags = json.loads(request.GET.get("tags")) if "tags" in request.GET else []
    post_id = long(request.GET.get("id")) if "id" in request.GET else None

    # Get all Posts ordered by stamp
    post_query = Post.query().order(Post.stamp)

    # ID filter
    if post_id:
        post_query = post_query.filter(Post.key.id() == post_id)

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
    id = request.GET.get("id")
    # Post.query()
    # delete

    return True

def update_post(request):
    """
    Add/Edit Blog Post
    :param: id LONG id of post to update [optional]
    :param: title STR post title [optional]
    :param: body STR post body [optional]
    :param: published BOOL post published flag [optional]
    :return: BOOL success or failure
    """
    id = request.GET.get("id")

    # Create or retrieve Post
    if id:
        post = Post.query()
    else:
        post = Post()

    # Update Post
    if "body" in request.GET:
        post.body = request.GET.get("body")
    if "title" in request.GET:
        post.title = request.GET.get("title")
    if "published" in request.GET:
        post.published = request.GET.get("published", "").lower() in ["true", "1"]

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
    post_query = Post.query()

    # Tag filter
    tags = json.loads(request.GET.get("tags")) if "tags" in request.GET else []
    if tags:
        post_query = post_query.filter(Post.tags.IN(tags))

    return HttpResponse(page_count(post_query.count(), POST_PAGE_SIZE))

def tags(request):
    """
    Get exhaustive list of Blog Post Tags
    :return: LIST
    """
    return json_response(list(set(flatten_list([post.tags for post in Post.query().iter()]))))
