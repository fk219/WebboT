"""
Initialize database
Creates all tables
"""

from app.database import engine, Base
from app.models.agent import Agent

def init_db():
    """Create all tables"""
    print("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    print("Database tables created successfully!")

if __name__ == "__main__":
    init_db()
