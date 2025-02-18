from django.urls import path
from api import views
urlpatterns = [
    path('signup/', views.signup, name='signup'),
    path('login/', views.login, name='login'), 

    # Add other URL patterns for your app here
]