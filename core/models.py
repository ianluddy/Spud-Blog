from google.appengine.ext import ndb
from constants import SESSION_EXPIRY
import time
import uuid

class User(ndb.Model):
    """
    User
    """
    username = ndb.StringProperty()
    password = ndb.StringProperty()

class Token(ndb.Model):
    """
    Auth token representing a User Session
    """
    value = ndb.StringProperty(default=str(uuid.uuid4()))
    expires = ndb.IntegerProperty(default=int(time.time() + SESSION_EXPIRY))

    def refresh(self):
        self.expires = int(time.time() + SESSION_EXPIRY)
        self.put()

class Blog(ndb.Model):
    """
    Blog [Ancestor for all of our entities to ensure consistency]
    """
    name = ndb.StringProperty()

class Post(ndb.Model):
    """
    Blog Post
    """
    stamp = ndb.FloatProperty(default=time.time())
    title = ndb.StringProperty(default="Untitled")
    body = ndb.TextProperty(default="Empty")
    tags = ndb.StringProperty(repeated=True)
    published = ndb.BooleanProperty(default=False)

    def preview(self):
        return {
            "stamp": self.stamp,
            "title": self.title,
            "published": self.published,
            "id": self.key.id()
        }

    def dictionary(self):
        dictionary = self.to_dict()
        dictionary["id"] = self.key.id()
        return dictionary