# Number of Posts per page. I'm using 1 here as the page gets quite busy with multiple Posts, especially since adding the
# facebook comment input.
# If one was to build on top of the API they could tweak this and have multiple Posts shown on their front end.
POST_PAGE_SIZE = 1

# Expiry for Auth Sessions
SESSION_EXPIRY = 60 * 30  # 30 mins

# Auth Cookie Name
AUTH_COOKIE_KEY = "spud"

# Max number of Posts allowed. Auto cleanup when this count is exceeded
MAX_NUMBER_OF_POSTS = 20

# Pages
INDEX_PAGE = 'index.html'
LOGIN_PAGE = 'login.html'
ADMIN_PAGE = 'admin.html'