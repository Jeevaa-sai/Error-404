import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from tnt_equivalent import calculate_stored_energy_kj, calculate_tnt_equivalent_mass

def test_stored_energy_positive():
    e = calculate_stored_energy_kj(50.0, "propane")
    assert e > 0

def test_stored_energy_bigger_volume_bigger_energy():
    e_small = calculate_stored_energy_kj(20.0, "propane")
    e_large = calculate_stored_energy_kj(50.0, "propane")
    assert e_large > e_small

def test_tnt_equivalent_positive():
    w = calculate_tnt_equivalent_mass(50.0, "diesel")
    assert w > 0

def test_tnt_equivalent_bigger_volume_bigger_mass():
    w_small = calculate_tnt_equivalent_mass(20.0, "diesel")
    w_large = calculate_tnt_equivalent_mass(50.0, "diesel")
    assert w_large > w_small

def test_unknown_fuel_raises():
    try:
        calculate_tnt_equivalent_mass(50.0, "unknown_fuel")
        assert False, "should have raised ValueError"
    except ValueError:
        pass
