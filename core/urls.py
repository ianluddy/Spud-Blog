from django.conf import settings
from django.conf.urls.defaults import url, patterns

urlpatterns = patterns('core.views',

    # Pages
    url(r'^$', 'index', {}, name='index'),
    url(r'^admin', 'admin', {}, name='admin'),
    url(r'^login', 'login', {}, name='login'),

    # API
    url(r'^log_out', 'log_out', {}, name='log_out'),
    url(r'^clean', 'clean', {}, name='clean'),
    url(r'^authenticate', 'authenticate', {}, name='authenticate'),
    url(r'^posts', 'posts', {}, name='posts'),
    url(r'^update_post', 'update_post', {}, name='update_post'),
    url(r'^delete_post', 'delete_post', {}, name='delete_post'),
    url(r'^tags', 'tags', {}, name='tags'),
    url(r'^pages', 'pages', {}, name='pages'),
)

if settings.DEBUG:
    urlpatterns += patterns('django.views.generic.simple',
        url(r'^500/$', 'direct_to_template', {'template': '500.html'}),
        url(r'^404/$', 'direct_to_template', {'template': '404.html'}),
    )
