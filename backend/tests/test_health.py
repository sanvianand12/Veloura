from app.api.routes.health import get_health
from app.main import root

def test_health_check(db):
    """Test get_health returns healthy status and active database connection."""
    data = get_health(db=db)
    assert data["status"] == "healthy"
    assert data["database"] == "healthy"
    assert data["service"] == "Veloura Backend API"
    assert "version" in data
    assert "timestamp" in data

def test_root_endpoint():
    """Test root endpoint returns welcome info and paths."""
    data = root()
    assert "Veloura" in data["message"]
    assert data["documentation"] == "/docs"
    assert data["health"] == "/health"
    assert data["status"] == "online"
