# StockSearch/urls.py
from django.urls import path
from .views import StockView

urlpatterns = [
    path('get-stock/', StockView.as_view(), name='get_stock'),
]
