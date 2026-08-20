import os
from pathlib import Path

from dotenv import load_dotenv

load_dotenv(override=True)

BASE_DIR = Path(__file__).resolve().parent
creds = os.environ.get("GOOGLE_APPLICATION_CREDENTIALS")
if creds and not os.path.isabs(creds):
    os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = str(BASE_DIR / creds)

_client = None


def _get_client():
    global _client
    if _client is not None:
        return _client
    project = os.environ.get("GCP_PROJECT_ID")
    location = os.environ.get("GCP_LOCATION")
    if not project or not location:
        raise RuntimeError("NO_API_KEY")
    from google import genai

    _client = genai.Client(vertexai=True, project=project, location=location)
    return _client


def ask_gemini(prompt: str, model: str = "gemini-2.5-flash") -> str:
    client = _get_client()
    response = client.models.generate_content(model=model, contents=prompt)
    return response.text or ""


def ask_gemini_with_image(
    prompt: str,
    image_bytes: bytes,
    mime_type: str,
    model: str = "gemini-2.5-flash",
) -> str:
    from google.genai import types

    client = _get_client()
    response = client.models.generate_content(
        model=model,
        contents=[
            types.Part.from_text(text=prompt),
            types.Part.from_bytes(data=image_bytes, mime_type=mime_type),
        ],
    )
    return response.text or ""
