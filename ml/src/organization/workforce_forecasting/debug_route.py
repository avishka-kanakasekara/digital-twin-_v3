import os
import sys
from dotenv import load_dotenv

# Appending backend directory to sys.path so we can import app modules
sys.path.append(os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))), "backend"))
load_dotenv()

from app.database import get_supabase_admin
from app.routers.organization import get_skill_shortages

print(get_skill_shortages())
