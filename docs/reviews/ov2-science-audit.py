"""Independent OV-2 CSV audit; run from the repository root with Python 3."""

import csv
import hashlib
import io
import json
import math
import random
import re
from pathlib import Path

root = Path(__file__).resolve().parents[2]
corpus = json.loads((root / "data/corpus.v1.json").read_text())
tables = root / "research/flame/samples/psi_tables"
source_by_hash = {}
for table_path in sorted(tables.glob("*.csv")):
    digest = hashlib.sha256(table_path.read_bytes()).hexdigest()
    try:
        source_text = table_path.read_bytes().decode("utf-8-sig")
    except UnicodeDecodeError:
        source_text = table_path.read_bytes().decode("cp1252")
    source_rows = list(csv.reader(io.StringIO(source_text)))
    headers = [header.strip() for header in source_rows[0]]
    source_by_hash[digest[:12]] = (
        table_path.name,
        [{header: values[index] if index < len(values) else "" for index, header in enumerate(headers) if header}
         for values in source_rows[1:]],
    )


def raw_for(row):
    filename, source_rows = source_by_hash[row["csvSha12"]]
    raw = {key: value for key, value in row["raw"].items() if value.strip()}
    candidates = [(index, candidate) for index, candidate in enumerate(source_rows)
                  if all(candidate.get(key) == value for key, value in raw.items())]
    assert candidates, row["id"]
    local_index, original = next((candidate for candidate in candidates if candidate[0] == row["rowIndex"]), candidates[0])
    return filename, local_index + 2, original


generator = random.Random(20261114)
results = []
for accession in ["PSI-69", "PSI-25", "PSI-159", "PSI-20", "PSI-107"]:
    population = [row for row in corpus["rows"] if row["accession"] == accession]
    for row in generator.sample(population, 2):
        filename, csv_line, raw = raw_for(row)
        oxygen_column = {"PSI-69": "O initial ambient composition; mole fraction",
                         "PSI-25": "Calibrated  initial O2 % by vol",
                         "PSI-159": "XO2 before test" if "XO2 before test" in raw else "XO2",
                         "PSI-20": "Oxygen Conc (percent)"}.get(accession)
        pressure_column = {"PSI-69": "Ambient pressure; mmHg", "PSI-159": "approx p (bar)"}.get(accession)
        raw_oxygen = raw.get(oxygen_column) if oxygen_column else None
        raw_pressure = raw.get(pressure_column) if pressure_column else None
        oxygen_values = [float(value) for value in re.findall(r"\d+(?:\.\d+)?", raw_oxygen or "")]
        if accession in ["PSI-69", "PSI-159"]:
            oxygen_values = [value * 100 for value in oxygen_values]
        if oxygen_values and all(0 <= value <= 100 for value in oxygen_values):
            assert math.isclose(row["o2Pct"]["min"], min(oxygen_values), abs_tol=0.0051), row["id"]
            assert math.isclose(row["o2Pct"]["max"], max(oxygen_values), abs_tol=0.0051), row["id"]
        else:
            assert row["o2Pct"] == {"min": None, "max": None}, row["id"]
        expected_pressure = None
        if raw_pressure:
            expected_pressure = float(raw_pressure) * (101.325 / 760 if accession == "PSI-69" else 100)
            if expected_pressure > 0:
                assert math.isclose(row["pressureKpa"]["min"], expected_pressure, abs_tol=0.0051), row["id"]
        if expected_pressure is None or expected_pressure <= 0:
            assert row["pressureKpa"] == {"min": None, "max": None}, row["id"]
        if accession == "PSI-107":
            flow = float(raw["Air Rate (cm/s)"])
            assert math.isclose(row["flowCmS"]["min"], flow, abs_tol=0.0051), row["id"]
        results.append({"id": row["id"], "csv": filename, "csvLine": csv_line,
                        "test": row.get("testLabel"), "rawOxygen": raw_oxygen,
                        "oxygenPct": row["o2Pct"], "basis": row["o2Location"],
                        "rawPressure": raw_pressure, "expectedKpa": expected_pressure,
                        "parsedKpa": row["pressureKpa"], "flowCmS": row["flowCmS"], "pass": True})

flex_raw = source_by_hash["37c88ce8ae93"][1]
flex = [record for record in flex_raw if record.get("FLEX Test #", "").strip()]
high_oxygen = [record for record in flex if float(record["O initial ambient composition; mole fraction"]) * 100 >= 30]
inside = [record for record in flex
          if 27 <= float(record["O initial ambient composition; mole fraction"]) * 100 <= 33
          and 70.3 * 0.85 <= float(record["Ambient pressure; mmHg"]) * 101.325 / 760 <= 70.3 * 1.15]
assert len(flex) == 274 and len(high_oxygen) == 24 and len(inside) == 8
bass_raw = source_by_hash["71e792bf6b5f"][1]
bass_oxygen = [float(record["Calibrated  initial O2 % by vol"])
               for record in bass_raw if record.get("Calibrated  initial O2 % by vol", "").strip()]
assert min(bass_oxygen) == 13.6 and max(bass_oxygen) == 22.2
reject_results = []
for reject in corpus["rejects"]:
    matching = [row for row in corpus["rows"]
                if row["accession"] == reject["accession"] and row["rowIndex"] == reject["rowIndex"]]
    assert len(matching) == 1
    row = matching[0]
    filename, csv_line, raw = raw_for(row)
    assert raw[reject["column"]] == reject["rawValue"]
    field = {"o2-out-of-range": "o2Pct", "pressure-nonpositive": "pressureKpa", "flow-negative": "flowCmS"}[reject["reason"]]
    assert row[field] == {"min": None, "max": None}
    reject_results.append({"id": row["id"], "csvLine": csv_line, "raw": reject["rawValue"],
                           "reason": reject["reason"], "nullField": field})

output = {"seed": 20261114, "rows": results, "flexRows": len(flex), "flexAtLeast30": len(high_oxygen),
          "flexInside": [record["FLEX Test #"] for record in inside],
          "bassIIInitialOxygenPct": [min(bass_oxygen), max(bass_oxygen)], "rejects": reject_results,
          "cfiBurnerRows": sum(row["accession"] == "PSI-159" and row["o2Location"] == "burner" for row in corpus["rows"]),
          "breUnknownBasisRows": sum(row["accession"] == "PSI-20" and row["o2Location"] == "unknown" for row in corpus["rows"])}
print(json.dumps(output, indent=2))
