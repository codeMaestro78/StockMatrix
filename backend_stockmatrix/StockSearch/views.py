from django.http import HttpResponse
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
import yfinance as yf
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import io
import base64
from sklearn.linear_model import LinearRegression
from datetime import datetime, timedelta
import requests
import time
from json.decoder import JSONDecodeError
from django.core.cache import cache
import random
from functools import wraps
import logging
import traceback

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def rate_limit(key_prefix, limit=60, period=60):
    def decorator(view_func):
        @wraps(view_func)
        def wrapped_view(self, request, *args, **kwargs):
            client_ip = request.META.get('REMOTE_ADDR')
            cache_key = f'ratelimit:{key_prefix}:{client_ip}'
            
            # Get current request count
            requests = cache.get(cache_key, 0)
            
            if requests >= limit:
                return Response(
                    {'error': 'Too many requests. Please try again later.'},
                    status=status.HTTP_429_TOO_MANY_REQUESTS
                )
            
            # Increment request count
            cache.set(cache_key, requests + 1, period)
            
            return view_func(self, request, *args, **kwargs)
        return wrapped_view
    return decorator

def global_rate_limit(limit=100, period=60):
    def decorator(view_func):
        @wraps(view_func)
        def wrapped_view(self, request, *args, **kwargs):
            cache_key = 'global_ratelimit'
            requests = cache.get(cache_key, 0)
            
            if requests >= limit:
                return Response(
                    {'error': 'Global rate limit exceeded. Please try again later.'},
                    status=status.HTTP_429_TOO_MANY_REQUESTS
                )
            
            # Increment request count
            cache.set(cache_key, requests + 1, period)
            
            return view_func(self, request, *args, **kwargs)
        return wrapped_view
    return decorator

class StockView(APIView):
    @rate_limit('stock_api', limit=30, period=60)
    @global_rate_limit(limit=100, period=60)
    def post(self, request, *args, **kwargs):
        symbol = request.data.get('symbol', '').strip()
        file_format = request.data.get('format', '').strip().lower()
        
        logger.info(f"Received request for symbol: {symbol}, format: {file_format}")
        
        if not symbol:
            return Response({'error': 'Stock symbol is required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            # Handle NSE/BSE suffix
            if not symbol.endswith('.NS') and not symbol.endswith('.BO'):
                symbol += '.NS'
            
            logger.info(f"Processing symbol: {symbol}")
            
            # Basic implementation with proper error handling
            try:
                stock = yf.Ticker(symbol)
                
                # First try to get basic info with timeout
                stock_info = {}
                try:
                    stock_info = stock.info
                    if not stock_info or len(stock_info) < 5:
                        return Response(
                            {'error': f'No data available for {symbol}. Please check the symbol and try again.'},
                            status=status.HTTP_404_NOT_FOUND
                        )
                except Exception as e:
                    logger.error(f"Error fetching stock info: {str(e)}")
                    return Response(
                        {'error': f'Unable to fetch data for {symbol}. The service might be temporarily unavailable.'},
                        status=status.HTTP_503_SERVICE_UNAVAILABLE
                    )
                
                # Get current price or use a default
                current_price = stock_info.get('currentPrice', stock_info.get('previousClose', 0))
                
                # Get company name
                company_name = stock_info.get('longName', stock_info.get('shortName', symbol))
                
                # Return simplified response
                return Response({
                    'symbol': symbol,
                    'details': {
                        'longName': company_name,
                        'shortName': stock_info.get('shortName', symbol),
                        'industry': stock_info.get('industry', 'N/A'),
                        'sector': stock_info.get('sector', 'N/A'),
                        'country': stock_info.get('country', 'N/A'),
                    },
                    'stock': {
                        'currentPrice': current_price,
                        'previousClose': stock_info.get('previousClose', 'N/A'),
                        'dayLow': stock_info.get('dayLow', 'N/A'),
                        'dayHigh': stock_info.get('dayHigh', 'N/A'),
                    },
                    'technicalIndicators': {
                        'RSI': 50,  # Placeholder values
                        'MA50': 0,
                        'MA200': 0,
                        'MACD': 0,
                        'SignalLine': 0,
                    },
                    'graph': '',  # Empty placeholder for graph
                    'analysis': f"Basic analysis for {company_name} ({symbol}).\n\nThis is a simplified response. For detailed analysis, please try again later.",
                    'forecast': {
                        'futurePrices': [current_price] * 30,  # Placeholder
                        'forecastDates': [(datetime.now() + timedelta(days=i)).strftime('%Y-%m-%d') for i in range(30)],
                        'averageForecast': current_price,
                        'percentageChange': 0,
                    },
                    'sentimentAnalysis': {
                        'averageSentiment': 0,
                        'headlines': [],
                    }
                }, status=status.HTTP_200_OK)
                
            except requests.exceptions.RequestException as req_err:
                logger.error(f"Request exception: {str(req_err)}")
                return Response(
                    {'error': 'Failed to fetch stock data. The service might be temporarily unavailable.'},
                    status=status.HTTP_503_SERVICE_UNAVAILABLE
                )
            except Exception as e:
                logger.error(f"Unexpected error: {str(e)}")
                logger.error(traceback.format_exc())
                return Response(
                    {'error': 'An unexpected error occurred while processing your request.'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
                
        except Exception as e:
            logger.error(f"Outer exception: {str(e)}")
            logger.error(traceback.format_exc())
            return Response(
                {'error': 'An unexpected error occurred. Please try again later.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )