"""Shared Flask extensions — importable without circular dependencies."""

from flask_caching import Cache
from flask_mail import Mail

cache = Cache()
mail = Mail()
