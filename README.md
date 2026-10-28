# EMD Budget FY 2026-27

Budget-utilisation dashboard for **JSW Steel Dolvi – Energy Management Department**, fund centre **135080** (fund DOLVI, FM area 1000, control ledger 9H), fiscal year 2026 (Apr 2026 – Mar 2027).

Snapshot date: **28 Oct 2026** (FM periods 1–7).

> Internal JSW data. Keep this repository private and the Vercel project behind Vercel Authentication.

## What it shows

| Tab | Content |
|---|---|
| Overview | Budget / consumed / available, the actual-PO-PR split, consumption by commitment item, month-wise activity, FY25 carry-forward share, items to watch |
| Commitment items | Full summary table per commitment item (₹ lakh) with utilisation status |
| Open POs & PRs | Ageing of open commitments and searchable lists of every open PO and PR |
| Vendors | Top 15 vendors and the full vendor table (actuals + open PO value) |
| Transaction register | All 2,817 FM lines, filterable, with CSV download |

Budget, consumed and available match SAP **FMAVCR01** (Display Annual Values of Control Objects). The actual / open PO / open PR split is summed from each commitment item's **FM document journal** and reconciles to the consumed figure exactly.

## Structure

```
index.html        page, styles and chart code
runtime.js        small loader that reads /data and draws the page
vendor/d3.min.js  d3 v7.9.0 (bundled, no CDN needed)
data/*.json       the snapshot (budget_items, monthly, open_pos, open_prs, vendors, transactions)
scripts/          Python that turns SAP exports into data/*.json
vercel.json       headers (noindex, no-cache on data)
```

No build step: Vercel serves the folder as a static site.

## Refreshing the numbers

1. In SAP, open **FMAVCR01** for FM area 1000, FY 2026, fund DOLVI, fund centre 135080, and expand all nodes.
2. For each commitment item's posting address, click **Documents**, then **List → Export → Local File → Unconverted** and save into `sap_exports/` with these names:
   `admin_items.txt, equipment.txt, FM_OIL.txt, FM_OPCONS.txt, FM_PROF.txt, FM_RM_PM.txt, FM_RM_CONTRA.txt, FM_SERVICE.txt, FM_MANPOW.txt, FM_SS_ELE.txt, FM_SS_MECH.txt, FM_TESTING.txt`
   (CONFERENCE_SEMINARSEXP has a single line, kept in `conference.json`.)
3. Update the budget / consumed / available figures in `scripts/datasets.py` (`BUD` list) from the FMAVCR01 screen.
4. From `sap_exports/`, run:
   ```
   python ../scripts/build.py
   python ../scripts/datasets.py
   ```
   The scripts assert that every commitment item's journal total equals its consumed amount.
5. Update the snapshot date in `index.html`, commit and push. Vercel redeploys automatically.

## Local preview

```
python -m http.server 8000
```
then open http://localhost:8000.
