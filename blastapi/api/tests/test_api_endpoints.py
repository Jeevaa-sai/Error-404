from fastapi.testclient import TestClient

from api.main import app

client = TestClient(app)


def test_health_endpoint_returns_ok():
    response = client.get('/health')
    assert response.status_code == 200
    assert response.json()['status'] == 'ok'


def test_supported_fuels_endpoint_returns_list():
    response = client.get('/fuels')
    assert response.status_code == 200
    assert isinstance(response.json()['fuels'], list)
    assert 'propane' in response.json()['fuels']


def test_invalid_lat_lon_are_rejected():
    payload = {
        'lat': 91,
        'lon': 0,
        'tank_volume_m3': 50,
        'tank_diameter_m': 12,
        'fuel_type': 'propane',
        'wind_speed_mps': 6,
        'wind_direction_deg': 45,
    }
    response = client.post('/calculate-zones', json=payload)
    assert response.status_code == 422


def test_invalid_wind_direction_is_rejected():
    payload = {
        'lat': 13.0067,
        'lon': 80.2206,
        'tank_volume_m3': 50,
        'tank_diameter_m': 12,
        'fuel_type': 'propane',
        'wind_speed_mps': 6,
        'wind_direction_deg': 360,
    }
    response = client.post('/calculate-zones', json=payload)
    assert response.status_code == 422
