from django.urls import path
from .views import MutualFundsView

urlpatterns = [
    path('mutualfunds/', MutualFundsView.as_view(), name='mutual_funds'),
]
