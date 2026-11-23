# Verification log

Which study-content facts have been checked against source documents, and what's still flagged.

## 2026-11-23: PcM checked against primary sources
Sources (all in `sources/are/`; copyrighted PDFs are fetched locally with `npm run fetch:sources`):
- `ethics/NCARB-Model-Rules-of-Conduct.pdf`: NCARB *Model Rules of Conduct*, revised July 2023 (from ncarb.org).
- `ethics/AIA-Code-of-Ethics-2024.pdf`: AIA *Code of Ethics and Professional Conduct*, 2024 (the edition the ARE Guidelines list). AIA has also posted `AIA-Code-of-Ethics-2026-proposed.pdf` (proposed redlines). It isn't used for content until NCARB lists it.
- `law/usc-*.txt`, `law/cfr-*.txt`: U.S. Code (govinfo, 2024 edition) and eCFR (current) text for every federal statute or regulation cited in PcM. These are public domain and committed.

| Objective | What was checked | Result |
|---|---|---|
| PcM 1.1 | AIA Canon V (E.S. 5.1–5.2, Rules 5.101, 5.201); NCARB 2.5, 6.1 | Citations made specific |
| PcM 1.2 | FLSA overtime (29 U.S.C. §207); exemption salary $684/wk (29 C.F.R. §541.600); Title VII 15, ADA 15, ADEA 20, FMLA 50 / 1,250 hrs / 75 mi / 12 workweeks unpaid, COBRA <20 exempt / 18 mo / 102%, ACA 50 full-time; OSHA general duty clause | All confirmed. Flags cleared; details added |
| PcM 1.3 | All NCARB and AIA rule references; copyright §§101, 102(a)(8), 120(a), 201, 411(a), 412 | **Corrected:** NCARB Rule 5 is "Signing and Sealing Documents" (not "Professional Conduct"). There's a Rule 6 (AXP supervisors). Conflicts must be *disclosed and waived in writing by all parties* (2.3). Supplier compensation (2.2) can't be waived. Refuse / report / terminate is Rule 3.5. AIA 2.105 adds "advise against" and has no withdraw step. Added AIA penalties, the antitrust statement (fee competition and free services aren't unethical), and the duty to report (NCARB 3.9 / AIA 4.101). Added 1 question and 4 cards |
| PcM 1.4 | NCARB 1.1 standard of care; AIA 2.401, E.S. 6.5, 6.501 (climate and environment) | Confirmed. Citations made specific |
| PcM 3.1 | Brooks Act 40 U.S.C. §§1103–1104; AIA antitrust statement, 2.103 | Confirmed. Added "at least 3 firms ranked" and the fee-competition note |
| PcM 4.1 | S corporation, 26 U.S.C. §1361(b)(1) | Confirmed (100 shareholders, 1 class of stock, eligible shareholders) |
| PcM 4.2 | Secretary of the Interior treatments, 36 C.F.R. Part 68; NHPA §106, 54 U.S.C. §306108 | Confirmed |

## Still flagged (39 items)
- **AIA contract documents (most of them):** B101-2017 paragraph numbers (§2.2, 2.5, 4.2.x, 8.1.x, 8.2.4, 9.1, 10.3–10.6, 11.5, 11.6, 11.9, 11.10.x) and edition years of AIA documents not on NCARB's list (B102–B105, B132/B133, A102/A103/A132/A134, C101, C106, C132, C191, E203, G201/G202).
  - **To clear these:** download B101-2017, A201-2017, C401-2017 (plus any others you have) from your NCARB Record and save them in `sources/are/aia/`. That folder is in `.gitignore` and will never be committed. Then ask Claude Code to "verify the AIA citations".
- **Industry standards:** National CAD Standard / UDS sheet types, the BIMForum LOD spec, and the ASTM UniFormat designation. These aren't free public documents.
- **Rules of thumb:** multiplier range, fee phase split, firm-positioning framework. There's no single authoritative source; they stay flagged as rules of thumb.
- **Jurisdiction-specific items:** certificate-of-merit statutes, firm ownership rules, the NCARB Model Law firm provisions.
- **April 2026 objective changes:** NCARB's own list of the 12 changed objectives still hasn't been found.
