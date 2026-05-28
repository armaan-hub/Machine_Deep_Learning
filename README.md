# Machine & Deep Learning — Linear Algebra Visual Companion

Interactive browser-based linear algebra chapters connected to ML/DL intuition.

> Screenshot placeholder: add screenshots under `assets/` and link them here.

## Chapters

| # | Title | Key concept | ML/DL connection | File |
|---|---|---|---|---|
| 1 | Vectors & Linear Combinations | Span, basis, linear combos | Word embeddings | `chapters/ch1-vectors-linear-combinations.html` |
| 2 | Matrix Transformations | Linear maps, composition | Dense layers (`y=Wx+b`) | `chapters/ch2-matrix-transformations.html` |
| 3 | Determinants & Area | Signed area scaling | Normalizing flows `log|det J|` | `chapters/ch3-determinants-area.html` |
| 4 | Eigenvectors & Eigenvalues | Invariant directions, power iteration | PCA + RNN stability | `chapters/ch4-eigenvectors-eigenvalues.html` |
| 5 | SVD | `M = UΣVᵀ`, low-rank approximation | LoRA + compression | `chapters/ch5-svd.html` |

## How to use

1. Clone repository.
2. Open `index.html` directly in a browser (`file://`).
3. Or visit deployed GitHub Pages URL once enabled.

## Architecture

- Shared JavaScript files use IIFE and expose `window.*` globals.
- Chapter pages include scripts via classic `<script src>`, no modules/import/export.
- No build tooling required; everything runs directly from static files.

## Keyboard shortcuts

| Key | Action |
|---|---|
| Space | Play animation |
| R | Reset |
| 1-5 | Presets |

## Tech stack

- HTML5, CSS3, Vanilla JavaScript
- Canvas 2D API
- MathJax 3 (tex-chtml)

## Contributing

To add a chapter:
1. Create `chapters/chX-<name>.html`.
2. Reuse `js/` + `css/` shared files.
3. Add card entry in `index.html` chapters array.
4. Keep compatibility with `file://` and IIFE global architecture.
