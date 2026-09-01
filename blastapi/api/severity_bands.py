# Thermal radiation damage criteria (kW/m²):
# Source: commonly cited process-safety references — API RP 521 ("Pressure-
# relieving and Depressuring Systems") and the TNO "Green Book" (Methods for
# the Determination of Possible Damage). These three bands are widely used
# in consequence-analysis literature:
#   37.5 kW/m² — sufficient to cause damage to process equipment; high
#                probability of fatality for unprotected personnel within
#                seconds of exposure.
#   12.5 kW/m² — minimum energy to ignite wood/melt plastic; significant
#                chance of fatality for personnel unable to reach shelter
#                within ~20s.
#    4.0 kW/m² — threshold causing pain to unprotected skin within ~20s;
#                commonly used as the public-safety / evacuation boundary.
THERMAL_BANDS_KW_M2 = {
    "high": 37.5,
    "medium": 12.5,
    "low": 4.0,
}

# Blast overpressure damage criteria (kPa):
# Source: CCPS, "Guidelines for Consequence Analysis of Chemical Releases"
# (Center for Chemical Process Safety, 1999), and HSE "Methods of
# Approximation and Determination of Human Vulnerability for Offsite Risk
# Assessment." Widely-cited approximate bands:
#   35 kPa — threshold for significant structural damage / partial
#            demolition of houses; potential for serious injury/fatality.
#   16 kPa — threshold associated with serious injury from structural
#            collapse or debris.
#    3 kPa — threshold for glass breakage in a significant fraction of
#            windows; typically used as the outer public-hazard boundary.
OVERPRESSURE_BANDS_KPA = {
    "high": 35.0,
    "medium": 16.0,
    "low": 3.0,
}

THERMAL_LABELS = {k: f"{v:g} kW/m²" for k, v in THERMAL_BANDS_KW_M2.items()}
OVERPRESSURE_LABELS = {k: f"{v:g} kPa" for k, v in OVERPRESSURE_BANDS_KPA.items()}
