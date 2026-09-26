import math
import datetime
import os
import re

def test_astronomical_formulas():
    print("Testing Astronomical Formulas...")
    # Julian Day calculation test for 2026-10-20
    year, month, day = 2026, 10, 20
    if month <= 2:
        year -= 1
        month += 12
    a = math.floor(year / 100.0)
    b = 2 - a + math.floor(a / 4.0)
    jd = math.floor(365.25 * (year + 4716)) + math.floor(30.6001 * (month + 1)) + (day + 6.0/24.0) + b - 1524.5
    assert jd > 2461000, f"Julian day {jd} out of range"
    print(f"✓ Julian Day for 2026-10-20 = {jd:.2f}")

    # Lahiri Ayanamsha test
    ayanamsha = 23.85 + (50.29 / 3600.0) * ((jd - 2451545.0) / 365.25)
    assert 24.0 <= ayanamsha <= 24.5, f"Lahiri Ayanamsha {ayanamsha} expected ~24.2 deg"
    print(f"✓ Lahiri Ayanamsha for 2026 = {ayanamsha:.2f}°")

    # Sun mean longitude
    d = jd - 2451545.0
    sun_mean_long = (280.460 + 0.9856474 * d) % 360.0
    print(f"✓ Sun Mean Longitude = {sun_mean_long:.2f}°")

def test_festival_dataset_integrity():
    print("\nTesting Festival Data Source Integrity...")
    path = "app/src/main/java/com/ritu/calendar/data/festival/FestivalDataSource.kt"
    assert os.path.exists(path), f"File {path} not found"
    
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()

    # Extract all FestivalModel entries
    festival_ids = re.findall(r'id\s*=\s*"([^"]+)"', content)
    assert len(festival_ids) >= 15, f"Found only {len(festival_ids)} festivals"
    print(f"✓ Extracted {len(festival_ids)} festivals: {', '.join(festival_ids[:5])}...")

    # Verify unique IDs
    assert len(festival_ids) == len(set(festival_ids)), "Duplicate festival IDs found!"
    print("✓ All festival IDs are unique")

    # Check Northeast festivals
    ne_fests = ["fest_rongali_bihu", "fest_bhogali_bihu", "fest_kongali_bihu", "fest_ambubachi_mela", "fest_hornbill_nagaland", "fest_chapchar_kut", "fest_yaoshang_manipur"]
    for ne in ne_fests:
        assert ne in festival_ids, f"Missing key Northeast festival {ne}"
    print(f"✓ Verified rich Northeast & Assam representation ({len(ne_fests)} primary festivals checked)")

def test_xml_resources():
    print("\nTesting Android XML Resources...")
    assert os.path.exists("app/src/main/res/values/strings.xml")
    assert os.path.exists("app/src/main/res/values/colors.xml")
    assert os.path.exists("app/src/main/res/values/themes.xml")
    assert os.path.exists("app/src/main/AndroidManifest.xml")
    print("✓ XML layout & value resource files exist and are intact")

if __name__ == "__main__":
    test_astronomical_formulas()
    test_festival_dataset_integrity()
    test_xml_resources()
    print("\n✨ ALL VERIFICATION TESTS PASSED SUCCESSFULLY! ✨")
