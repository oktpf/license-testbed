# License Analysis Testbed

A sample Node.js application for evaluating SCA tools' ability to detect and
classify open source licenses in dependencies — with a specific focus on
copyleft and commercially-restrictive licenses.

## Purpose

This repository is part of the **AppSec Vendor Evaluation Framework**
([appsec-vendor-eval-framework](https://github.com/oktpf/appsec-vendor-eval-framework)).
It tests **SCA (Software Composition Analysis)** tools on:

- Identifying and classifying all dependency licenses (direct + transitive)
- Flagging strong copyleft (GPL-2.0, GPL-3.0, AGPL-3.0)
- Detecting weak copyleft (LGPL, MPL)
- Recognising non-OSI / commercially-restrictive licenses (BUSL, SSPL)
- Handling SPDX license expressions and dual licensing
- Distinguishing devDependency-only packages from production dependencies
- Discovering transitive dependencies with problematic licenses
- Reachability analysis — is a copyleft dependency actually imported in
  production code or only in test files?

## Architecture

```
license-testbed/
├── package.json              # Root workspace — dependencies + devDependencies
├── src/
│   └── app.js                # Express server (PRODUCTION code)
├── test/
│   └── app.test.js           # Mocha tests (DEV-ONLY code)
├── packages/                 # Workspace packages with explicit SPDX licenses
│   ├── agpl-pkg/             # AGPL-3.0-only
│   ├── lgpl-pkg/             # LGPL-2.1-only
│   ├── mpl-pkg/              # MPL-2.0
│   ├── busl-pkg/             # BUSL-1.1
│   ├── sspl-pkg/             # SSPL-1.0
│   ├── dev-only-gpl/         # GPL-3.0-only (devDependency only!)
│   ├── wtfpl-pkg/            # WTFPL
│   ├── unlicense-pkg/        # Unlicense
│   ├── bsd2-pkg/             # BSD-2-Clause
│   ├── bsd3-pkg/             # BSD-3-Clause
│   ├── zerobsd-pkg/          # 0BSD
│   ├── apache2-pkg/          # Apache-2.0
│   ├── mit-pkg/              # MIT
│   └── isc-pkg/              # ISC
├── README.md
└── answer_key.md             # Expected findings for scoring
```

## Dev vs Production Dependency Test

A key feature of this testbed is testing whether SCA tools distinguish
dev-time-only dependencies from production runtime dependencies:

| Context | Package | License | Where Used |
|---------|---------|---------|------------|
| **PRODUCTION** | `ffmpeg-static` | GPL-3.0-or-later | `src/app.js` imports it |
| **PRODUCTION** | `sharp` | Apache-2.0 (transitive LGPL-3.0 via libvips) | `src/app.js` imports it |
| **DEV ONLY** | `@license-testbed/dev-only-gpl` | GPL-3.0-only | Only in `test/app.test.js` |
| **DEV ONLY** | `mocha`, `chai` | MIT | Only in test runner |
| **DEV ONLY** | `typescript` | Apache-2.0 | Only as dev tool |

A smart SCA tool should:
1. Flag `ffmpeg-static` as HIGH severity (GPL-3.0 in production runtime)
2. Flag `dev-only-gpl` as LOWER severity (GPL-3.0 but dev-only context)
3. Not flag `typescript` at all (permissive Apache-2.0, dev only)

## Dependency License Inventory

### Runtime Dependencies — Copyleft & Restrictive (Critical Findings)

| Package | License | Category | Risk | Used In |
|---------|---------|----------|------|---------|
| `ffmpeg-static` | **GPL-3.0-or-later** | **Strong Copyleft** | High | `/`, `test/` |
| `@license-testbed/agpl-pkg` | **AGPL-3.0-only** | **Network Copyleft** | Critical | `/licenses` |
| `@license-testbed/lgpl-pkg` | **LGPL-2.1-only** | **Weak Copyleft** | Medium | `/licenses` |
| `@license-testbed/mpl-pkg` | MPL-2.0 | Weak Copyleft | Low-Medium | `/licenses` |
| `@license-testbed/busl-pkg` | **BUSL-1.1** | **Non-OSI / Commercial** | High | `/licenses` |
| `@license-testbed/sspl-pkg` | **SSPL-1.0** | **Non-OSI / Commercial** | High | `/licenses` |
| `node-forge` | (BSD-3-Clause OR GPL-2.0) | Dual License | Depends | `/crypto` |
| `my-gpl-package` | GPL-2.0 | Strong Copyleft | High | Declared only (broken pkg) |
| `sharp` → libvips | Apache-2.0 → **LGPL-3.0 transitive** | Weak Copyleft | Medium | `/image` |

### Dev-Only Dependency — Copyleft Differentiation Challenge

| Package | License | Category | Risk | Where |
|---------|---------|----------|------|-------|
| `@license-testbed/dev-only-gpl` | **GPL-3.0-only** | **Strong Copyleft** | Low (dev-only) | Only in `test/` |

### Permissive Baseline (Should NOT trigger alerts)

| Package | License | Used In |
|---------|---------|---------|
| `express` | MIT | `/` (server) |
| `lodash` | MIT | `/` |
| `rxjs` | Apache-2.0 | `/` |
| `semver` | ISC | `/` |
| `source-map` | BSD-3-Clause | `/` (imported) |
| `spdx-license-ids` | CC0-1.0 | `/` |
| `@license-testbed/wtfpl-pkg` | WTFPL | `/licenses` |
| `@license-testbed/unlicense-pkg` | Unlicense | `/licenses` |
| `@license-testbed/bsd2-pkg` | BSD-2-Clause | `/licenses` |
| `@license-testbed/bsd3-pkg` | BSD-3-Clause | `/licenses` |
| `@license-testbed/zerobsd-pkg` | 0BSD | `/licenses` |
| `@license-testbed/apache2-pkg` | Apache-2.0 | `/licenses` |
| `@license-testbed/mit-pkg` | MIT | `/licenses` |
| `@license-testbed/isc-pkg` | ISC | `/licenses` |
| `typescript` (dev) | Apache-2.0 | Build only |
| `tslib` (dev) | 0BSD | Build only |

## Running

```bash
npm install
npm start       # starts on http://localhost:3000
npm test        # runs mocha suite
```

### Endpoints

| Route | Purpose | Key Dependency Tested |
|-------|---------|----------------------|
| `GET /` | Overview | `ffmpeg-static` (GPL-3.0), `rxjs`, `lodash`, `semver` |
| `GET /licenses` | Full catalog | All workspace packages |
| `GET /image` | Image processing | `sharp` (transitive LGPL-3.0) |
| `GET /crypto` | Hashing | `node-forge` (dual-license) |
| `GET /transitive` | Dependency chain | `sharp` → libvips (LGPL-3.0) |

## Scoring Context

The critical scoring weight is on whether the SCA tool:

1. **Flags** `ffmpeg-static` (GPL-3.0) as strong copyleft in **production code**
2. **Flags** `agpl-pkg` (AGPL-3.0) as network copyleft / critical
3. **Flags** `busl-pkg` and `sspl-pkg` as non-OSI / commercially restrictive
4. **Downgrades** `dev-only-gpl` (GPL-3.0 but devDependency only) — shows it understands dev context
5. **Discovers** transitive LGPL-3.0 via `sharp` → `@img/sharp-libvips-*`
6. **Correctly handles** dual-license `node-forge`
7. **Generates** accurate SBOM with SPDX-valid license IDs
8. **Does not flag** permissive packages (MIT, BSD, ISC) — zero FPs
