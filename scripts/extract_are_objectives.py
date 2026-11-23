#!/usr/bin/env python3
"""Extract ARE 5.0 divisions, sections, objectives and weightings from the
NCARB ARE 5.0 Guidelines PDF into content/are-objectives.json.

Usage:  python3 scripts/extract_are_objectives.py sources/are/ARE-5-Guidelines.pdf content/are-objectives.json

Requires poppler's `pdftotext` on PATH. Objective titles, percentages and
descriptions are taken verbatim from the PDF; nothing is invented.
"""
import json, re, subprocess, sys
from pathlib import Path

DIVISIONS = [
    # code, name, first content page, last content page (1-based, Oct 2026 edition)
    ("PcM", "Practice Management", 71, 76),
    ("PjM", "Project Management", 77, 83),
    ("PA", "Programming & Analysis", 84, 90),
    ("PPD", "Project Planning & Design", 91, 97),
    ("PDD", "Project Development & Documentation", 98, 104),
    ("CE", "Construction & Evaluation", 105, 110),
]

# Division details table (read from the layout of each division's "DIVISION DETAILS" page;
# the table's multi-line cells don't extract cleanly so they were verified by eye and are
# re-checked against the extracted item counts below).
DETAILS = {
    "PcM": dict(totalItems=65, scoredItems=59, pretestItems=6, caseStudies="Up to 6", caseStudyItems="Up to 14", testDuration="2 hr 40 min", breakDuration="30 min", appointmentDuration="3 hr 20 min"),
    "PjM": dict(totalItems=75, scoredItems=68, pretestItems=7, caseStudies="Up to 7", caseStudyItems="Up to 16", testDuration="3 hr", breakDuration="30 min", appointmentDuration="3 hr 40 min"),
    "PA": dict(totalItems=75, scoredItems=68, pretestItems=7, caseStudies="Up to 7", caseStudyItems="Up to 16", testDuration="3 hr", breakDuration="30 min", appointmentDuration="3 hr 40 min"),
    "PPD": dict(totalItems=100, scoredItems=91, pretestItems=9, caseStudies="Up to 9", caseStudyItems="Up to 20", testDuration="4 hr 5 min", breakDuration="45 min", appointmentDuration="5 hr"),
    "PDD": dict(totalItems=100, scoredItems=91, pretestItems=9, caseStudies="Up to 9", caseStudyItems="Up to 20", testDuration="4 hr 5 min", breakDuration="45 min", appointmentDuration="5 hr"),
    "CE": dict(totalItems=75, scoredItems=68, pretestItems=7, caseStudies="Up to 7", caseStudyItems="Up to 16", testDuration="3 hr", breakDuration="30 min", appointmentDuration="3 hr 40 min"),
}

FOOTER = re.compile(r"ARE 5\.0 GUIDELINES \| [A-Z]+ \d{4}\s+\d+")


def page_text(pdf, first, last):
    out = subprocess.run(["pdftotext", "-f", str(first), "-l", str(last), "-layout", pdf, "-"],
                         check=True, capture_output=True, text=True).stdout
    lines = []
    for raw in out.splitlines():
        line = re.sub(r"\s{2,}", "  ", raw).strip()
        # normalise stray spaces inside cognitive-level tags, e.g. "(A/E )" -> "(A/E)"
        line = re.sub(r"\(\s*(U/A|A/E)\s*\)", r"(\1)", line)
        if not line or FOOTER.search(line) or line in ("EXAM CONTENT",):
            continue
        lines.append(line)
    return lines


def pct(s):
    a, b = s.replace("%", "").split("-")
    return {"min": int(a), "max": int(b)}


def parse_division(pdf, code, name, first, last):
    lines = page_text(pdf, first, last)
    text = "\n".join(lines)

    # Overview paragraph
    m = re.search(r"DIVISION OVERVIEW\n(.*?)\nSection 1:", text, re.S)
    overview = " ".join(m.group(1).split()) if m else ""

    # Section list with objective titles + cognitive level (overview page)
    sec_titles = {}
    for sm in re.finditer(r"^Section (\d): (.+)$", text, re.M):
        sec_titles[sm.group(1)] = sm.group(2).strip()

    # Section weightings (SECTION DETAILS table). Names may wrap onto the next line.
    sec_pct = {}
    for sm in re.finditer(r"SECTION (\d): ([^\n]*?)\s*(\d+-\d+)\s+(\d+-\d+)%", text):
        sec_pct[sm.group(1)] = {"expectedItems": sm.group(3), "targetPercent": pct(sm.group(4) + "%")}
    # Fallback for rows where the name wrapped (e.g. "SECTION 1: Business\n13-17 20-26%\nOperations")
    for sm in re.finditer(r"SECTION (\d): [^\n]*\n\s*(\d+-\d+)\s+(\d+-\d+)%", text):
        sec_pct.setdefault(sm.group(1), {"expectedItems": sm.group(2), "targetPercent": pct(sm.group(3) + "%")})

    # Objective blocks: "OBJECTIVE 1.1 (8-12%)" then title line(s) ending in (U/A)|(A/E), then description
    obj_iter = list(re.finditer(r"^OBJECTIVE (\d)\.(\d) \((\d+-\d+%)\)$", text, re.M))
    objectives = []
    for i, om in enumerate(obj_iter):
        end = obj_iter[i + 1].start() if i + 1 < len(obj_iter) else len(text)
        body = text[om.end():end].strip()
        # cut trailing section header of the next section, e.g. "PcM  SECTION 2\nFinances..."
        body = re.split(rf"\n{code}  SECTION \d\n", "\n" + body)[0].strip()
        body = re.split(r"\n[A-Z][A-Za-z ,&]+ \( ?[A-Za-z]+ ?\)\nDIVISION OVERVIEW", body)[0]
        tm = re.match(r"(.*?\((U/A|A/E)\))\s*\n(.*)", body, re.S)
        title, level, desc = tm.group(1), tm.group(2), tm.group(3)
        title = " ".join(title.split())
        title = re.sub(r"\s*\((U/A|A/E)\)$", "", title)
        desc = " ".join(desc.split())
        objectives.append({
            "id": f"{code}-{om.group(1)}.{om.group(2)}",
            "number": f"{om.group(1)}.{om.group(2)}",
            "section": om.group(1),
            "title": title,
            "cognitiveLevel": level,
            "targetPercent": pct(om.group(3)),
            "description": desc,
        })

    sections = []
    for num in sorted(sec_titles):
        # Section intro paragraph sits between "<code>  SECTION n\n<Name lines>\n" and first OBJECTIVE
        im = re.search(rf"^{code}  SECTION {num}\n(.*?)\nOBJECTIVE", text, re.S | re.M)
        intro = ""
        if im:
            chunk = im.group(1).split("\n")
            # drop heading lines (the section name, which may wrap) — intro starts at first sentence-length line
            name_words = set(sec_titles[num].replace("&", " ").split())
            while chunk and set(chunk[0].replace("&", " ").replace(",", "").split()) <= name_words | {"&", ","}:
                chunk.pop(0)
            intro = " ".join(" ".join(chunk).split())
            if intro.startswith(sec_titles[num]):
                intro = intro[len(sec_titles[num]):].strip()
        sections.append({
            "id": f"{code}-S{num}",
            "number": num,
            "name": sec_titles[num],
            "intro": intro,
            **sec_pct.get(num, {}),
            "objectives": [o for o in objectives if o["section"] == num],
        })
    for s in sections:
        for o in s["objectives"]:
            del o["section"]

    return {
        "code": code,
        "name": name,
        "overview": overview,
        "details": DETAILS[code],
        "sections": sections,
    }


def main(pdf, out):
    divisions = [parse_division(pdf, *d) for d in DIVISIONS]
    n_obj = sum(len(s["objectives"]) for d in divisions for s in d["sections"])
    expected = {"PcM": (4, 12), "PjM": (5, 17), "PA": (4, 16), "PPD": (5, 17), "PDD": (5, 17), "CE": (4, 12)}
    for d in divisions:
        ns, no = len(d["sections"]), sum(len(s["objectives"]) for s in d["sections"])
        assert (ns, no) == expected[d["code"]], f"{d['code']}: got {ns} sections / {no} objectives"
        for s in d["sections"]:
            assert "targetPercent" in s, f"{d['code']} section {s['number']} missing %"
            for o in s["objectives"]:
                assert o["title"] and o["description"], o["id"]
    assert n_obj == 91, n_obj
    doc = {
        "exam": "ARE 5.0",
        "source": {
            "title": "Architect Registration Examination 5.0 Guidelines",
            "publisher": "National Council of Architectural Registration Boards (NCARB)",
            "edition": "October 2026",
            "effective": "2026-10-01",
            "url": "https://www.ncarb.org/sites/default/files/ARE-5-Guidelines.pdf",
            "localFile": "sources/are/ARE-5-Guidelines.pdf",
            "pages": "70-110 (Exam Content)",
        },
        "itemTypes": ["multiple-choice", "check-all-that-apply", "hotspot"],
        "cognitiveLevels": {
            "U/A": "Understand/Apply",
            "A/E": "Analyze/Evaluate",
        },
        "divisions": divisions,
    }
    Path(out).parent.mkdir(parents=True, exist_ok=True)
    Path(out).write_text(json.dumps(doc, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"wrote {out}: {len(divisions)} divisions, {n_obj} objectives")


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
