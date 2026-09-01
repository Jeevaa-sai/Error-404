import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from thermal import (
    calculate_heat_release_rate_kw,
    calculate_thermal_flux_kw_m2,
    solve_radius_for_thermal_flux,
)

def test_heat_release_rate_positive():
    q = calculate_heat_release_rate_kw(20.0, "diesel")
    assert q > 0

def test_heat_release_rate_bigger_tank_bigger_output():
    q_small = calculate_heat_release_rate_kw(10.0, "diesel")
    q_large = calculate_heat_release_rate_kw(20.0, "diesel")
    assert q_large > q_small

def test_thermal_flux_decreases_with_distance():
    q = calculate_heat_release_rate_kw(20.0, "diesel")
    near = calculate_thermal_flux_kw_m2(10, q, 0.32)
    far = calculate_thermal_flux_kw_m2(50, q, 0.32)
    assert near > far

def test_solve_radius_is_inverse_of_calculate():
    q = calculate_heat_release_rate_kw(20.0, "diesel")
    chi_r = 0.32
    target_flux = 12.5
    radius = solve_radius_for_thermal_flux(target_flux, q, chi_r)
    recovered_flux = calculate_thermal_flux_kw_m2(radius, q, chi_r)
    assert abs(recovered_flux - target_flux) < 0.01

def test_all_fuels_produce_sane_radius():
    for fuel in ("propane", "lng", "gasoline", "diesel"):
        q = calculate_heat_release_rate_kw(15.0, fuel)
        r = solve_radius_for_thermal_flux(4.0, q, 0.3)
        assert 1.0 < r < 500.0
