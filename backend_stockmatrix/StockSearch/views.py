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
from datetime import timedelta
from textblob import TextBlob
import requests
import time
from json.decoder import JSONDecodeError
from django.core.cache import cache

class StockView(APIView):
    def post(self, request, *args, **kwargs):
        symbol = request.data.get('symbol', '').strip()
        file_format = request.data.get('format', '').strip().lower()
        if not symbol:
            return Response({'error': 'Stock symbol is required'}, status=status.HTTP_400_BAD_REQUEST)

        # Check if data is cached
        cache_key = f'stock_data_{symbol}'
        cached_data = cache.get(cache_key)
        if cached_data:
            return Response(cached_data, status=status.HTTP_200_OK)

        try:
            # Handle NSE/BSE suffix
            if not symbol.endswith('.NS') and not symbol.endswith('.BO'):
                symbol += '.NS'

            # Enhanced retry mechanism with exponential backoff and jitter
            max_retries = 5  # Increased from 3 to 5
            base_delay = 2
            for attempt in range(max_retries):
                try:
                    # Add delay before each retry (except first attempt)
                    if attempt > 0:
                        delay = base_delay * (2 ** attempt) + np.random.uniform(0, 1)
                        time.sleep(delay)
                    
                    stock = yf.Ticker(symbol)
                    # First try to get basic info
                    stock_info = stock.info
                    # Then get historical data
                    df = stock.history(period="1y")
                    
                    if df.empty:
                        return Response({'error': 'No data found for the symbol'}, status=status.HTTP_404_NOT_FOUND)
                    break
                except requests.exceptions.HTTPError as e:
                    if "429" in str(e) and attempt < max_retries - 1:
                        continue
                    elif "429" in str(e):
                        return Response(
                            {'error': 'Rate limit exceeded. Please try again in a few minutes.'},
                            status=status.HTTP_429_TOO_MANY_REQUESTS
                        )
                    else:
                        raise
                except Exception as e:
                    if attempt < max_retries - 1:
                        continue
                    else:
                        raise

            # Moving Averages
            df['MA50'] = df['Close'].rolling(window=50).mean()
            df['MA200'] = df['Close'].rolling(window=200).mean()

            # RSI Calculation
            delta = df['Close'].diff()
            gain = (delta.where(delta > 0, 0)).rolling(window=14).mean()
            loss = (-delta.where(delta < 0, 0)).rolling(window=14).mean()
            rs = gain / loss
            df['RSI'] = 100 - (100 / (1 + rs))

            # Forecasting
            df['Date'] = df.index
            df['Days'] = (df['Date'] - df['Date'].min()).dt.days
            X = df[['Days']].values
            y = df['Close'].values
            model = LinearRegression().fit(X, y)
            future_days = np.arange(len(df) + 30).reshape(-1, 1)
            forecast = model.predict(future_days)
            forecast_dates = [df.index[-1] + timedelta(days=i) for i in range(1, 31)]

            # Plotting
            plt.figure(figsize=(14, 7))
            plt.plot(df['Close'], label='Close Price')
            plt.plot(df['MA50'], label='50-Day MA')
            plt.plot(df['MA200'], label='200-Day MA')
            plt.plot(df.index, forecast[:len(df)], label='Forecast', linestyle='--')
            plt.scatter(forecast_dates, forecast[-30:], color='red', label='Future Forecast')
            plt.legend()
            plt.title(f"{symbol} Stock Price and Indicators")

            buf = io.BytesIO()
            plt.savefig(buf, format='jpeg')
            buf.seek(0)
            image_base64 = base64.b64encode(buf.read()).decode('utf-8')
            buf.close()
            plt.close()  # Close the plot to free memory

            # Sentiment Analysis with News
            company_name = stock_info.get('longName', symbol)
            news_api_key = 'your_news_api_key'  # Replace with your key
            news_url = f'https://newsapi.org/v2/everything?q={company_name}&sortBy=publishedAt&apiKey={news_api_key}'
            news_response = requests.get(news_url)
            news_data = news_response.json()

            related_news = []
            sentiment_scores = []
            if news_data.get('status') == 'ok' and news_data.get('articles'):
                articles = news_data['articles'][:5]  # Limit to 5 articles
                for article in articles:
                    title = article['title']
                    related_news.append({
                        'title': title,
                        'link': article['url'],
                        'source': article['source']['name'],
                    })
                    blob = TextBlob(title)
                    sentiment_scores.append(blob.sentiment.polarity)


            average_sentiment = np.mean(sentiment_scores) if sentiment_scores else 'N/A'

            # Response Data

            stock_data = {
                'stock': {
                    'currentPrice': stock_info.get('currentPrice', 'N/A'),
                    'previousClose': stock_info.get('regularMarketPreviousClose', 'N/A'),
                    
                    # Include other fields as needed...
                },
                'graph': image_base64,
                'technicalIndicators': {
                    'RSI': round(df['RSI'].iloc[-1], 2),
                },
                'sentimentAnalysis': {
                    'averageSentiment': average_sentiment,
                    'headlines': related_news,
                }
            }

            # Cache the response data
            cache.set(cache_key, stock_data, timeout=60*60)  # Cache for 1 hour

            # Handle file export
            if file_format == 'csv':
                csv_buf = io.StringIO()
                df.to_csv(csv_buf)
                csv_buf.seek(0)
                response = HttpResponse(csv_buf, content_type='text/csv')
                response['Content-Disposition'] = f'attachment; filename="{symbol}_data.csv"'
                return response
            elif file_format == 'excel':
                excel_buf = io.BytesIO()
                with pd.ExcelWriter(excel_buf, engine='xlsxwriter') as writer:
                    df.to_excel(writer, index=False)
                excel_buf.seek(0)
                response = HttpResponse(excel_buf, content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
                response['Content-Disposition'] = f'attachment; filename="{symbol}_data.xlsx"'
                return response

            return Response(stock_data, status=status.HTTP_200_OK)

        except requests.exceptions.RequestException as req_err:
            return Response({'error': 'Failed to fetch news data', 'details': str(req_err)}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        except JSONDecodeError as json_err:
            return Response({'error': 'Too many requests to Yahoo Finance. Please try again later.'}, status=status.HTTP_429_TOO_MANY_REQUESTS)
        except ValueError as val_err:
            return Response({'error': 'Invalid data received', 'details': str(val_err)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({'error': 'An unexpected error occurred', 'details': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)





            