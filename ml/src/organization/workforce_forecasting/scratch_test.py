import urllib.request
from urllib.error import HTTPError
try:
    urllib.request.urlopen('http://127.0.0.1:8000/api/organization/talent/skill-shortages')
    print("API Endpoint is working perfectly!")
except HTTPError as e:
    print(e.read().decode())
