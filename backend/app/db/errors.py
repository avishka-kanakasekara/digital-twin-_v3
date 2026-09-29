"""Application errors for Fabric database and storage operations."""


class FabricDataError(Exception):
    """Safe database failure. Details are logged, not returned to clients."""

    def __init__(self, message: str = "Database operation failed", *, status_code: int = 503):
        super().__init__(message)
        self.status_code = status_code


class FabricAuthError(FabricDataError):
    def __init__(self, message: str = "Fabric authentication failed"):
        super().__init__(message, status_code=503)


class StorageError(Exception):
    def __init__(self, message: str = "File storage operation failed", *, status_code: int = 400):
        super().__init__(message)
        self.status_code = status_code
