# Veloura API Documentation

## Base URL
Default local development backend server: `http://localhost:8000`

Interactive OpenAPI / Swagger UI: `http://localhost:8000/docs`  
ReDoc Reference: `http://localhost:8000/redoc`

---

## Endpoints

### 1. System Health
- **`GET /health`**
  - **Purpose**: Verifies that the FastAPI application and SQLite database connection are responsive and operational.
  - **Response 200 OK**:
    ```json
    {
      "status": "healthy",
      "service": "Veloura Backend API",
      "timestamp": "2026-10-31T09:15:00.000Z",
      "database": "healthy",
      "version": "0.1.0"
    }
    ```

### 2. Events Resource (`/api/events`)
- **`GET /api/events`**
  - Retrieve all planned events, sorted with the newest events first.
  - Query parameters: `skip` (int, default 0), `limit` (int, default 100).

- **`POST /api/events`**
  - Create a new event.
  - **Request Body**:
    ```json
    {
      "title": "Autumn Botanical Gala",
      "event_type": "Gala",
      "date": "2026-11-20",
      "time": "19:00",
      "location": "The Glass Greenhouse, Chicago",
      "guest_count": 150,
      "budget": 35000.0,
      "theme": "Candlelight & Dried Botanicals",
      "description": "Intimate celebration featuring seasonal botanicals.",
      "status": "Planning"
    }
    ```
  - **Response 201 Created**: Returns the persisted event with assigned `id`, `created_at`, and `updated_at`.

- **`GET /api/events/stats`**
  - Returns aggregate metrics across all events:
    ```json
    {
      "total_events": 4,
      "total_budget": 125000.0,
      "total_guests": 580,
      "upcoming_events": 4
    }
    ```

- **`GET /api/events/{id}`**
  - Fetch full details for an individual event.
  - Returns 404 if not found.

- **`PUT /api/events/{id}`**
  - Update fields of an existing event.

- **`DELETE /api/events/{id}`**
  - Remove an event from the database (204 No Content).

