from django.views.generic import TemplateView
from django.http import HttpResponse, HttpResponseForbidden
from django.views.decorators.http import require_http_methods
from django.shortcuts import render_to_response
import logging

from core.constants import POST_PAGE_SIZE, AUTH_COOKIE_KEY, SESSION_EXPIRY, INDEX_PAGE, LOGIN_PAGE, ADMIN_PAGE
from core.models import Post, User
from core.utils import flatten_list, page_count, get_blog_key, parse_parameters, authenticate_user
from core.utils import json_response, log_user_in, log_user_out, clean_session_tokens, clean_posts

#### Pages ####

index = TemplateView.as_view(template_name=INDEX_PAGE)  # Public page
login = TemplateView.as_view(template_name=LOGIN_PAGE)  # Login page

@authenticate_user()
@require_http_methods(["GET"])
def admin(request):
    return render_to_response(ADMIN_PAGE, {})

#### Auth ####

@require_http_methods(["GET", "POST"])
@parse_parameters(str_list=["username", "password"])
def authenticate(request, username=None, password=None):
    """
    Authenticate User, create Session token and return it's value in a Cookie
    :param username [STRING]
    :param password [PASSWORD]
    :return: 200 or 403
    """
    user = User.query(User.username == username, User.password == password).get()
    if user:
        response = render_to_response(ADMIN_PAGE, {})
        response.set_cookie(AUTH_COOKIE_KEY, log_user_in(), max_age=SESSION_EXPIRY)
        return response
    else:
        return HttpResponseForbidden()

@require_http_methods(["GET"])
def log_out(request):
    """
    Log User out by grabbing the login token from the Cookie and removing it
    :return: Login Page
    """
    log_user_out(request.COOKIES.get(AUTH_COOKIE_KEY))
    return render_to_response(LOGIN_PAGE, {})

#### API ####

@require_http_methods(["GET"])
@parse_parameters(bool_list=["titles_only", "published_only"], json_list=["tags"], int_list=["page", "post_id"])
def posts(request, post_id=None, tags=None, page=None, titles_only=False, published_only=False):
    """
    Get Published Blog Posts
    :param tags [LIST] of tags to filter on [optional]
    :param page [INT] page number of Posts to return [optional]
    :param titles_only [BOOLEAN] return Post titles and stamps only [optional]
    :param published_only [BOOLEAN] return published Posts only [optional]
    :param post_id [LONG] Post identifier [optional]
    :return: posts [LIST] List of Posts
    """
    # ID filter (if we get an ID parameter lets assume the user wants all the info on that Post)
    if post_id:
        post = Post.get_by_id(post_id, parent=get_blog_key())
        iterator = [post] if post else []
    else:
        # If no ID specified, get all Posts ordered by stamp for our Blog
        post_query = Post.query(ancestor=get_blog_key()).order(-Post.stamp)

        # Published filter
        if published_only:
            post_query = post_query.filter(Post.published == True)

        # Tag filter
        if tags:
            post_query = post_query.filter(Post.tags.IN(tags))

        # Page Filter
        if page is not None:
            iterator = post_query.fetch(POST_PAGE_SIZE, offset=page * POST_PAGE_SIZE)
        else:
            iterator = post_query.fetch()

    # Preview or full Post
    if titles_only:
        response = json_response([post.preview() for post in iterator])
    else:
        response = json_response([post.dictionary() for post in iterator])

    return response

@authenticate_user()
@require_http_methods(["GET", "POST"])
@parse_parameters(int_list=["post_id"])
def delete_post(request, post_id):
    """
    Delete Blog Post
    :param: post_id [LONG] id of post to delete
    :return: success [BOOL] success or failure
    """
    # Attempt to delete the Post
    try:
        Post.get_by_id(post_id, parent=get_blog_key()).key.delete()
        success = True
    except Exception:
        logging.error("Error deleting Post", exc_info=True)
        success = False

    return HttpResponse(success)

@authenticate_user()
@require_http_methods(["GET", "POST"])
@parse_parameters(str_list=["title", "body"], bool_list=["published"], json_list=["tags"], int_list=["post_id"])
def update_post(request, post_id=None, title=None, body=None, published=False, tags=None):
    """
    Add/Edit Blog Post
    :param: post_id [LONG] id of post to update [optional]
    :param: title [STR] post title [optional]
    :param: body [STR] post body [optional]
    :param: published [BOOL] post published flag [optional]
    :param: tags [LIST] list of tags[optional]
    :return: success [BOOL] success or failure
    """
    # Create or retrieve Post
    if post_id:
        post = Post.get_by_id(post_id, parent=get_blog_key())
    else:
        post = Post(parent=get_blog_key())

    # Update Post
    if body is not None:
        post.body = body
    if title is not None:
        post.title = title
    if tags is not None:
        post.tags = tags
    post.published = published

    # Persist
    try:
        post.put()
        success = True
    except Exception:
        success = False
        logging.error("Error saving post", exc_info=True)

    return HttpResponse(success)

@require_http_methods(["GET"])
@parse_parameters(json_list=["tags"])
def pages(request, tags=None):
    """
    Get number of pages of Blog Posts
    :param tags [LIST] of tags to filter on [optional]
    :return: pages [INT] number of pages
    """
    # Grab all published Posts
    post_query = Post.query().filter(Post.published == True)

    # Apply Tag filter
    if tags:
        post_query = post_query.filter(Post.tags.IN(tags))

    return HttpResponse(page_count(post_query.count(), POST_PAGE_SIZE))

@require_http_methods(["GET"])
def tags(request):
    """
    Get exhaustive list of Tags for published Posts
    :return: tags [LIST] list of Post tags
    """
    # Grab all published Posts
    post_query = Post.query(ancestor=get_blog_key()).filter(Post.published == True)

    # Remove duplicates
    tags = list(set(flatten_list([post.tags for post in post_query.iter()])))

    return json_response(tags)

#### Clean Up ####

@require_http_methods(["GET"])
def clean(request):
    """
    Cron endpoint to run cleanup jobs
    :return:
    """
    try:
        clean_session_tokens()
        clean_posts()
        return HttpResponse(True)
    except Exception:
        return HttpResponse(False)