# Sources

Official documents that the study content is based on. These are untouched downloads, kept for reference and for regenerating `/content`.

## `sources/are/`
| File | Source | Retrieved |
|---|---|---|
| `ARE-5-Guidelines.pdf` | NCARB, *ARE 5.0 Guidelines*, October 2026 edition (effective 2026-10-01; includes the April 27, 2026 objective updates). https://www.ncarb.org/sites/default/files/ARE-5-Guidelines.pdf | 2026-11-23 |

> **Not committed to git.** NCARB's PDF is copyrighted and this repository is public, so `.gitignore` excludes it. Run `npm run fetch:sources` to download it locally. The extracted objectives in `content/are-objectives.json` are committed. SHA-256 of the copy used: see `sources/are/SHA256SUMS`.

### `sources/are/ethics/` (not committed: fetch with `npm run fetch:sources`)
| File | Source |
|---|---|
| `NCARB-Model-Rules-of-Conduct.pdf` | NCARB *Model Rules of Conduct*, rev. July 2023. https://www.ncarb.org/sites/default/files/Rules_of_Conduct.pdf |
| `AIA-Code-of-Ethics-2024.pdf` | AIA *Code of Ethics and Professional Conduct*, 2024 (the edition on the ARE). https://www.aia.org/sites/default/files/2024-04/aia-code-of-ethics-april-2024.pdf |
| `AIA-Code-of-Ethics-2026-proposed.pdf` | AIA *Proposed 2026 Code of Ethics* redlines (reference only). https://www.aia.org/sites/default/files/2026-07/Code%20of%20Ethics.pdf |

### `sources/are/practice-exams/` (not committed: fetch with `npm run fetch:sources`)
NCARB's official ARE 5.0 practice exam PDFs, one per division (Feb 2026 editions), from https://www.ncarb.org/pass-the-are/prepare/practice-exams. They're licensed for personal study use as is; no derivative works. Use them in Claude Code study sessions (see CLAUDE.md). The app's questions are original and only match NCARB's *style* (`content/schema/ITEM-STYLE.md`).

### `sources/are/law/` (public domain, committed)
Text of every federal statute and regulation cited in ARE content, from govinfo.gov (U.S. Code, 2024 edition) and ecfr.gov (current): FLSA, Title VII, ADA Title I, ADEA, FMLA, COBRA, the ACA employer mandate, OSHA, Copyright Act sections, the Brooks Act, IRC §1361, NHPA §106, 29 C.F.R. §§541.300/.600, and 36 C.F.R. Part 68. Each file starts with its source URL.

### `sources/are/aia/` (you add these; never committed)
AIA contract documents downloaded from your NCARB Record (Exams tab → Additional Resources), e.g. `B101-2017.pdf`, `A201-2017.pdf`, `C401-2017.pdf`. They're licensed to you and copyrighted, so `.gitignore` excludes this folder. Claude Code uses them to verify AIA paragraph citations.

## `sources/cse/`
| File | Source | Retrieved |
|---|---|---|
| `architects-practice-act.pdf` | California Architects Board, *Architects Practice Act*, April 1, 2026 edition (BPC §5500 et seq. + CCR Title 16, Div. 2). https://www.cab.ca.gov/docs/publications/architects-practice-act.pdf | 2026-11-23 |
| `coastal-act.pdf` | California Coastal Commission, *California Coastal Act* (PRC Div. 20). https://www.coastal.ca.gov/coastact.pdf | 2026-11-23 |
| `cab-cse-reference-material.html` / `.txt` | CAB, CSE Reference Material list. https://www.cab.ca.gov/cand/cse/ref_mat.shtml | 2026-11-23 |
| `cab-cse-test-plan-page.html` | CAB, CSE Test Plan page (says the Test Plan is in the Handbook). https://www.cab.ca.gov/cand/cse/test_plan.shtml | 2026-11-23 |
| `cab-cse-prepare.html` | CAB, Preparing for the CSE. https://www.cab.ca.gov/cand/cse/prepare_cse.shtml | 2026-11-23 |

### ❌ Still needed: please add
1. **CSE Handbook (contains the CSE Test Plan).** CAB links it to PSI at https://test-takers.psiexams.com/api/content/bulletin/2519. Save it as `sources/cse/CSE-Handbook.pdf`. It couldn't be downloaded automatically: the download was blocked in the build session.
2. *(Optional, needed when CSE content is generated)* Statute text from leginfo.legislature.ca.gov, which sits behind a bot-check page:
   - HSC Div. 12.5
   - HSC Div. 104 Pt. 7 (Ch. 7, 8, 9, 13 Art. 1)
   - HSC Div. 107 Pt. 7 Ch. 1 Art. 9
   - EDC Field Act articles
   - CIV §§8000–9566
   - PCC Div. 2 Pt. 3 Ch. 1 Art. 3.5

   Use "Save as PDF" in a browser and drop the files here.
3. *(Optional)* CEQA Guidelines (CCR Title 14, Div. 6, Ch. 3) and the CARB 2019 legislative summary.

Codes that are copyrighted and only viewable free online (IBC, CBC/Title 24 parts, ADA Standards via ICC/DOJ) are **cited by section number only**. Their text is not copied into this repo.
