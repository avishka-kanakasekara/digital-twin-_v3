import os
from pathlib import Path
from dotenv import load_dotenv
from google import genai

load_dotenv(override=True)  # .env wins over any stale shell exports

BASE_DIR = Path(__file__).resolve().parent
creds = os.environ.get("GOOGLE_APPLICATION_CREDENTIALS")
if creds and not os.path.isabs(creds):
    os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = str(BASE_DIR / creds)

client = genai.Client(
    vertexai=True,
    project=os.environ["GCP_PROJECT_ID"],
    location=os.environ["GCP_LOCATION"],
)

def ask_gemini(prompt: str, model: str = "gemini-2.5-flash") -> str:
    response = client.models.generate_content(model=model, contents=prompt)
    return response.text
