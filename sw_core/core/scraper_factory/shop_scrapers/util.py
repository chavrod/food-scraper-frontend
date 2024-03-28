from typing import Tuple
import os
import sys
import django

import re


sys.path.append("/Users/dmitry/projects/shopping_wiz/sw_core")
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "shop_wiz.settings")
django.setup()

import core.models as core_models

# Conversion metrics for specific units to their standardized unit
conversion_metrics = {
    "kg": (core_models.UnitType.KG, 1),
    "100g": (core_models.UnitType.KG, 10),
    "g": (core_models.UnitType.KG, 1000),
    "ml": (core_models.UnitType.L, 1000),
    "100ml": (core_models.UnitType.L, 10),
    "l": (core_models.UnitType.L, 1),
    "litre": (core_models.UnitType.L, 1),
    "70cl": (core_models.UnitType.L, 1 / 0.7),
    "75cl": (core_models.UnitType.L, 1 / 0.75),
    "metre": (core_models.UnitType.M, 1),
    "each": (core_models.UnitType.EACH, 1),
    "100sht": (core_models.UnitType.HUNDRED_SHEETS, 1),
    "100sheets": (core_models.UnitType.HUNDRED_SHEETS, 1),
    "m2": (core_models.UnitType.M2, 1),
}


def get_standard_unit_type_and_conversion(
    s: str,
) -> Tuple[core_models.UnitType, float]:
    s = s.lower().replace(" ", "")

    for specific_unit, (unit_type, conversion_metric) in conversion_metrics.items():
        if re.search(r"\b" + specific_unit + r"\b", s):
            return unit_type, conversion_metric

    # If no specific unit matches, return None
    return core_models.UnitType.EACH, 1


def get_unit_data(
    parts_list: list[str], price: float
) -> Tuple[core_models.UnitType, float, float]:
    # Initialize default values
    default_unit_type = core_models.UnitType.EACH
    default_unit_measurement = 1.0

    if parts_list and parts_list[0]:
        cleaned_price_per_unit_str = re.sub(r"[^\d.]", "", parts_list[0])
        cleaned_price_per_unit_float = (
            round(float(cleaned_price_per_unit_str), 2)
            if cleaned_price_per_unit_str
            else 0
        )

        # Check if there's a second part for the unit type
        if (
            len(parts_list) > 1
            and parts_list[1]
            and cleaned_price_per_unit_float > 0
            and price > 0
        ):
            unit_type_str = parts_list[1]
            standardised_unit_type, conversion_metric = (
                get_standard_unit_type_and_conversion(unit_type_str)
            )
            # Convert the price per unit to float and round to 2 decimal places
            price_per_unit = round(cleaned_price_per_unit_float * conversion_metric, 2)
            unit_measurment = round(price / price_per_unit, 3)
            return standardised_unit_type, price_per_unit, unit_measurment
    # Return default values if conditions are not met
    return default_unit_type, price, default_unit_measurement


if __name__ == "__main__":
    test_cases = [
        (["5.2", "  "], 10.0),
        (["", "g"], 10),
        (["5.2", "g"], 0),
        (["5.2", "g"], 10.0),
        (["3.5", "litre"], 3.5),
        (["20.0", "kg"], 20.0),
        (["15.0", "ml"], 15.0),
        (["5.0", "g"], 5.0),
        (["7.5", "100 sheets"], 7.5),
        (["2.0", "each"], 2.0),
        (["30.0", "m2"], 30.0),
        (["1.0", "100g"], 3.0),
    ]

    # Loop through the test cases and print the results
    for parts_list, price in test_cases:
        unit_type, price_per_unit, unit_measurement = get_unit_data(parts_list, price)
        print(
            f"Parts: {parts_list}, Price: {price} -> Unit Type: {unit_type}, Price per Unit: {price_per_unit:.2f}, Unit Measurement: {unit_measurement:.3f}"
        )
