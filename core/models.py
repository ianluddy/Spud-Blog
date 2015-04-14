from google.appengine.ext import ndb
import time

class Blog(ndb.Model):
    stamp = ndb.FloatProperty(default=time.time())
    name = ndb.StringProperty()

class Post(ndb.Model):
    stamp = ndb.FloatProperty(default=time.time())
    title = ndb.StringProperty(default="Untitled")
    body = ndb.TextProperty(default="Empty")
    image = ndb.BlobProperty()
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