from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.http import HttpResponse
import requests
from bs4 import BeautifulSoup
import pandas as pd
import io

class MutualFundsView(APIView):
    def get(self, request):
        url = "https://www.moneycontrol.com/mutual-funds/best-funds/equity.html"
        
        try:
            response = requests.get(url, timeout=10)
            response.raise_for_status()
        except requests.exceptions.RequestException as e:
            return Response({"error": f"Request failed: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        try:
            soup = BeautifulSoup(response.content, 'html.parser')
            rows = soup.find_all('tr', class_=lambda x: x and x.startswith('INF'))
            
            # Define lists to hold each attribute
            scheme_names = []
            plans = []
            categories = []
            crisil_ranks = []
            aum_cr = []
            one_weeks = []
            one_months = []
            three_months = []
            six_months = []
            ytds = []
            one_years = []
            two_years = []
            three_years = []
            five_years = []
            ten_years = []
            
            for row in rows:
                columns = row.find_all('td')
                
                if len(columns) < 15:  # Ensure there are enough columns
                    continue
                
                # Append the data to respective lists
                scheme_names.append(columns[0].text.strip())
                plans.append(columns[1].text.strip() if len(columns) > 1 else 'N/A')
                categories.append(columns[2].text.strip() if len(columns) > 2 else 'N/A')
                crisil_ranks.append(columns[3].text.strip() if len(columns) > 3 else 'N/A')
                aum_cr.append(columns[4].text.strip() if len(columns) > 4 else 'N/A')
                one_weeks.append(columns[5].text.strip() if len(columns) > 5 else 'N/A')
                one_months.append(columns[6].text.strip() if len(columns) > 6 else 'N/A')
                three_months.append(columns[7].text.strip() if len(columns) > 7 else 'N/A')
                six_months.append(columns[8].text.strip() if len(columns) > 8 else 'N/A')
                ytds.append(columns[9].text.strip() if len(columns) > 9 else 'N/A')
                one_years.append(columns[10].text.strip() if len(columns) > 10 else 'N/A')
                two_years.append(columns[11].text.strip() if len(columns) > 11 else 'N/A')
                three_years.append(columns[12].text.strip() if len(columns) > 12 else 'N/A')
                five_years.append(columns[13].text.strip() if len(columns) > 13 else 'N/A')
                ten_years.append(columns[14].text.strip() if len(columns) > 14 else 'N/A')
            
            # Create a DataFrame with the data
            df = pd.DataFrame({
                'Scheme Name': scheme_names,
                'Plan': plans,
                'Category Name': categories,
                'Crisil Rank': crisil_ranks,
                'AuM (Cr)': aum_cr,
                '1W': one_weeks,
                '1M': one_months,
                '3M': three_months,
                '6M': six_months,
                'YTD': ytds,
                '1Y': one_years,
                '2Y': two_years,
                '3Y': three_years,
                '5Y': five_years,
                '10Y': ten_years
            })
            
            # Check if the user wants to download the data as a CSV file
            if 'download' in request.query_params and request.query_params['download'].lower() == 'true':
                csv_buffer = io.StringIO()
                df.to_csv(csv_buffer, index=False)
                csv_buffer.seek(0)
                response = HttpResponse(csv_buffer, content_type='text/csv')
                response['Content-Disposition'] = 'attachment; filename=mutual_funds.csv'
                return response
            
            funds_data = df.to_dict(orient='records')
            
            if not funds_data:
                return Response({"error": "No valid data found"}, status=status.HTTP_204_NO_CONTENT)
            
            return Response({
                "data": funds_data
            }, status=status.HTTP_200_OK)
        
        except Exception as e:
            return Response({"error": f"Error parsing the data: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        

