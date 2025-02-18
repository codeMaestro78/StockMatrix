from django.db import models
from djongo import models as djongo_models


class User(djongo_models.Model):
    username=djongo_models.CharField(max_length=100)
    email=djongo_models.EmailField(max_length=100)
    password=djongo_models.CharField(max_length=100)