# ReFoRM project page (ICAIF 2026)

Project page for **From Hindsight to Foresight: Adapting Reusable Reasoning Structures from Recurring Financial Events**.

Published with GitHub Pages from the root of the `main` branch. No build step is needed.

Official implementation: https://github.com/jinsaaang/reform. The BibTeX on the page is the author-provided SSRN citation (abstract 7475378).

## Files

- `index.html`: centered title block with the KakaoBank collaboration credit, overview figure, abstract, recurring financial events, method with the interactive FOMC example, results, reasoning analysis, case studies and citation. Affiliations, explanations, category results, and reasoning results are visible directly. Only baseline definitions use an expandable disclosure; the collaboration credit appears once in the hero.
- `styles.css`: layout, light and dark color schemes, responsive rules, and reduced-motion support.
- `app.js`: the interactive example with pointer, keyboard, and touch relation selection, the synchronized model/metric/reference results explorer and Table 3 table, case-study tabs, BibTeX copy, and section highlighting in the header.
- `assets/fig-motivation.svg`, `assets/fig-overview.svg`: Figures 1 and 2 as vector SVG, converted from the authors' figure PDFs and cropped to content.
- `assets/fonts/`: self-hosted Libertinus Serif and Libertinus Sans (SIL Open Font License, see `LICENSE-OFL.txt`).
- `assets/og-image.png`: link preview image.
- `assets/kakaobank-signature-black.png`: collaboration credit.
- `paper.pdf`: supplied manuscript, unchanged.

## Evidence and scope

Benchmark numbers and cases are transcribed or paraphrased from Tables 1, 3, 4, and 5, Figure 3, and Section 5 of the manuscript. The FOMC example is built by hand from public Federal Reserve sources to illustrate path reconstruction and is not a model output. Its selected 2024 evidence predates the target decision, and credit-channel support is marked unverified.

All links to local files are relative, so the page works under a GitHub Pages project path.
