from fastapi.testclient import TestClient
from app.main import app


def test_demo_data_and_dashboard():
    with TestClient(app) as client:
        response = client.get('/api/dashboard')
        assert response.status_code == 200
        payload = response.json()
        assert payload['clients_count'] >= 3
        assert payload['bookings_count'] >= 3
        assert 'revenue' in payload
        assert client.get('/api/clients').status_code == 200
        assert client.get('/api/bookings').status_code == 200


def test_create_client():
    with TestClient(app) as client:
        response = client.post('/api/clients', json={
            'name': 'Тестовий клієнт',
            'email': 'test-client@example.com',
            'phone': '+380000000000',
            'notes': 'API test'
        })
        assert response.status_code == 201
        assert response.json()['name'] == 'Тестовий клієнт'
