from typing import Tuple, Union, Optional
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
) -> Union[
    Tuple[None, None],  # Case where both are None
    Tuple[core_models.UnitType, float],  # Case where both are defined
]:
    s = s.lower().replace(" ", "")

    for specific_unit, (unit_type, conversion_metric) in conversion_metrics.items():
        if re.search(r"\b" + specific_unit + r"\b", s):
            return unit_type, conversion_metric

    # If no specific unit matches, return None
    return None, None


# Main section for testing
if __name__ == "__main__":
    # List of test strings
    test_strings = [
        "kg",
        "g",
        "litre",
        "ml",
        "100 sheets",
        " each ",
        "m2 ",
        "100g ",
    ]

    # Loop through the test strings and print the results
    for test_string in test_strings:
        unit_type, conversion_metric = get_standard_unit_type_and_conversion(
            test_string
        )
        print(
            f"'{test_string}': Unit Type - {unit_type}, Conversion Metric - {conversion_metric}"
        )
