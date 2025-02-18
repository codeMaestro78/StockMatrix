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

class StockView(APIView):
    def post(self, request, *args, **kwargs):
        symbol = request.data.get('symbol', '').strip()
        file_format = request.data.get('format', '').strip().lower()  # For exporting historical data
        if not symbol:
            return Response({'error': 'Stock symbol is required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            # Handle NSE/BSE suffix for Indian stocks
            if not symbol.endswith('.NS') and not symbol.endswith('.BO'):
                symbol += '.NS'

            stock = yf.Ticker(symbol)
            stock_info = stock.info

            df = stock.history(period="1y")
            if df.empty:
                return Response({'error': 'No data found for the symbol'}, status=status.HTTP_404_NOT_FOUND)

            # Moving Averages
            df['MA50'] = df['Close'].rolling(window=50).mean()
            df['MA200'] = df['Close'].rolling(window=200).mean()

            # Calculate RSI
            delta = df['Close'].diff()
            gain = (delta.where(delta > 0, 0)).rolling(window=14).mean()
            loss = (-delta.where(delta < 0, 0)).rolling(window=14).mean()
            rs = gain / loss
            df['RSI'] = 100 - (100 / (1 + rs))

            # Forecasting future prices using linear regression
            df['Date'] = df.index
            df['Days'] = (df['Date'] - df['Date'].min()).dt.days
            X = df[['Days']].values
            y = df['Close'].values
            model = LinearRegression().fit(X, y)
            future_days = np.arange(len(df) + 30).reshape(-1, 1)  # Predicting 30 days ahead
            forecast = model.predict(future_days)
            forecast_dates = [df.index[-1] + timedelta(days=i) for i in range(1, 31)]

            # Generate a graph with additional indicators
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

            # Sentiment Analysis with News
            company_name = stock_info.get('longName', symbol)  # Fallback to symbol if no company name
            news_api_key = '2d9608365be54c15953db9c193398fae'  # Replace with your News API key
            news_url = f'https://newsapi.org/v2/everything?q={company_name}&sortBy=publishedAt&apiKey={news_api_key}'
            news_response = requests.get(news_url)
            news_data = news_response.json()

            related_news = []
            sentiment_scores = []
            if news_data.get('status') == 'ok' and news_data.get('articles'):
                # Limit to 5-7 news headlines
                articles = news_data['articles'][:9]  # Adjust the number here if needed
                for article in articles:
                    title = article['title']
                    related_news.append({
                        'title': title,
                        'link': article['url'],
                        'source': article['source']['name'],
                        'publishedAt': article['publishedAt'],
                        'description': article.get('description', ''),
                    })
                    # Sentiment Analysis on news headlines
                    blob = TextBlob(title)
                    sentiment_scores.append(blob.sentiment.polarity)

            average_sentiment = np.mean(sentiment_scores) if sentiment_scores else 'N/A'

            # Compile the response data
            stock_data = {
                'stock': {
                    'open': stock.history(period='1d').iloc[0]['Open'],
                    'close': stock.history(period='1d').iloc[0]['Close'],
                    'currentPrice': stock_info.get('regularMarketPrice', 'N/A') or 'N/A',
                    'previousClose': stock_info.get('regularMarketPreviousClose', 'N/A'),
                    'dayLow': stock_info.get('dayLow', 'N/A'),
                    'dayHigh': stock_info.get('dayHigh', 'N/A'),
                    'marketCap': stock_info.get('marketCap', 'N/A'),
                    'peRatio': stock_info.get('trailingPE', 'N/A'),
                    'dividendYield': stock_info.get('dividendYield', 'N/A'),
                    'bookValue': stock_info.get('bookValue', 'N/A'),
                    'faceValue': stock_info.get('faceValue', 'N/A'),
                },
                'financials': {
                    'revenue': stock_info.get('totalRevenue', 'N/A'),
                    'grossMargins': stock_info.get('grossMargins', 'N/A'),
                    'operatingMargins': stock_info.get('operatingMargins', 'N/A'),
                    'netIncomeToCommon': stock_info.get('netIncomeToCommon', 'N/A'),
                    'returnOnEquity': stock_info.get('returnOnEquity', 'N/A'),
                },
                'analystOpinions': {
                    'targetMeanPrice': stock_info.get('targetMeanPrice', 'N/A'),
                    'recommendationKey': stock_info.get('recommendationKey', 'N/A'),
                },
                'details': {
                    'longName': stock_info.get('longName', 'N/A'),
                    'symbol': stock_info.get('symbol', 'N/A'),
                    'industry': stock_info.get('industry', 'N/A'),
                    'sector': stock_info.get('sector', 'N/A'),
                    'longBusinessSummary': stock_info.get('longBusinessSummary', 'N/A'),
                    'address': stock_info.get('address', 'N/A'),
                    'phone': stock_info.get('phone', 'N/A'),
                    'website': stock_info.get('website', 'N/A'),
                },
                'graph': image_base64,
                'analysis': f"{symbol} is currently {'above' if df['MA50'].iloc[-1] > df['MA200'].iloc[-1] else 'below'} its 200-day moving average.",
                'technicalIndicators': {
                    'RSI': df['RSI'].iloc[-1],
                },
                'forecast': {
                    'futurePrices': forecast[-30:].tolist(),
                    'forecastDates': [date.strftime('%Y-%m-%d') for date in forecast_dates],
                },
                'sentimentAnalysis': {
                    'averageSentiment': average_sentiment,
                    'headlines': related_news,
                }
            }

            # Handle historical data export
            if file_format == 'csv':
                response = HttpResponse(content_type='text/csv')
                response['Content-Disposition'] = f'attachment; filename="{symbol}_historical_data.csv"'
                df.to_csv(path_or_buf=response)
                return response
            elif file_format == 'excel':
                response = HttpResponse(content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
                response['Content-Disposition'] = f'attachment; filename="{symbol}_historical_data.xlsx"'
                df.to_excel(response, engine='openpyxl')
                return response
            elif file_format:
                return Response({'error': 'Unsupported file format. Use "csv" or "excel".'}, status=status.HTTP_400_BAD_REQUEST)

            return Response(stock_data, status=status.HTTP_200_OK)

        except requests.exceptions.RequestException as req_err:
            return Response({'error': 'Failed to fetch news data', 'details': str(req_err)}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        except yf.YFinanceError as yf_err:
             return Response({'error': 'Failed to fetch stock data from yfinance', 'details': str(yf_err)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        except ValueError as val_err:
            return Response({'error': 'Value error occurred', 'details': str(val_err)}, status=status.HTTP_400_BAD_REQUEST)

