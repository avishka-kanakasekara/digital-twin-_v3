"""Fabric SQL database access for the Employee Digital Twin API."""

from app.db.client import Client, get_db, reset_db_clients

__all__ = ["Client", "get_db", "reset_db_clients"]
