# StockSearch/urls.py
from django.urls import path
from .views import StockView, TestAlphaVantageView

urlpatterns = [
    path('get-stock/', StockView.as_view(), name='get-stock'),
    path('test-api/', TestAlphaVantageView.as_view(), name='test-api'),
]
