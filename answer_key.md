# Answer Key — License Testbed

Defines the expected license analysis results. Use to score SCA tools on
correctly identifying, classifying, and reporting dependency licenses —
including the critical dev-vs-production differentiation.

---

## License Categories

| Category | Weight | Examples |
|----------|--------|---------|
| **Strong Copyleft** | Critical | GPL-2.0, GPL-3.0, AGPL-3.0 |
| **Weak Copyleft** | Medium | LGPL-2.1, LGPL-3.0, MPL-2.0 |
| **Non-OSI / Restrictive** | High | BUSL-1.1, SSPL-1.0 |
| **Permissive** | None (baseline) | MIT, BSD, ISC, Apache-2.0, 0BSD |
| **Public Domain** | None | CC0, Unlicense, WTFPL |

---

## F-1: Strong Copyleft — Production Runtime (CRITICAL)

### F-1.1: ffmpeg-static — GPL-3.0-or-later

```
UID: LICENSE_GPL30_FFMPEG
Package: ffmpeg-static (^5.1.0)
Declared License: GPL-3.0-or-later
Location: dependencies (PRODUCTION)
Import: src/app.js (line 14, used in GET /)
SPDX Valid: yes
Category: strong-copyleft
Risk: HIGH
Expected SCA Behaviour:
  - Flag as strong copyleft at HIGH severity
  - Warn about license incompatibility (app is MIT, dep is GPL-3.0)
  - Show dependency reachability in production code path
```

### F-1.2: @license-testbed/agpl-pkg — AGPL-3.0-only

```
UID: LICENSE_AGPL30_PKG
Package: @license-testbed/agpl-pkg (^1.0.0)
Declared License: AGPL-3.0-only
Location: dependencies (PRODUCTION)
Import: src/app.js (line 22, used in GET /licenses)
SPDX Valid: yes
Category: network-copyleft
Risk: CRITICAL
Why: AGPL-3.0 closes the SaaS loophole — even network interaction
     triggers source distribution requirements.
Expected: Flag as most severe license risk
```

### F-1.3: my-gpl-package — GPL-2.0

```
UID: LICENSE_GPL20_MYGPL
Package: my-gpl-package (^1.0.0)
Declared License: GPL-2.0
Location: dependencies (PRODUCTION — but package has no index.js)
SPDX Valid: yes
Category: strong-copyleft
Risk: HIGH (but note: package is essentially a stub)
Expected: Flag from package.json/lockfile metadata as GPL-2.0
```

---

## F-2: Weak Copyleft — Production Runtime

### F-2.1: @license-testbed/lgpl-pkg — LGPL-2.1-only

```
UID: LICENSE_LGPL21_PKG
Package: @license-testbed/lgpl-pkg (^1.0.0)
Declared License: LGPL-2.1-only
SPDX: yes
Category: weak-copyleft
Risk: Medium
Expected: Flag as copyleft but distinguish as "weak/library" copyleft
```

### F-2.2: @license-testbed/mpl-pkg — MPL-2.0

```
UID: LICENSE_MPL20_PKG
Package: @license-testbed/mpl-pkg (^1.0.0)
Declared License: MPL-2.0
SPDX: yes
Category: weak-copyleft
Risk: Low-Medium
Expected: Flag as weak (file-level) copyleft, not same severity as GPL
```

---

## F-3: Non-OSI / Commercially Restrictive

### F-3.1: @license-testbed/busl-pkg — BUSL-1.1

```
UID: LICENSE_BUSL11_PKG
Package: @license-testbed/busl-pkg (^1.0.0)
Declared License: BUSL-1.1
SPDX: yes
Category: non-osi-commercial
Risk: HIGH
Why: Business Source License — NOT OSI-approved. Source available but
     production/commercial use restricted. Converts to Apache-2.0 after
     a change date (typically 3-4 years).
Expected: Flag as non-OSI / source-available / commercially restricted
```

### F-3.2: @license-testbed/sspl-pkg — SSPL-1.0

```
UID: LICENSE_SSPL10_PKG
Package: @license-testbed/sspl-pkg (^1.0.0)
Declared License: SSPL-1.0
SPDX: yes
Category: non-osi-commercial
Risk: HIGH
Why: Server Side Public License — NOT OSI-approved. Requires publishing
     source code of ALL infrastructure used to provide the service.
Expected: Flag as non-OSI / cloud-restricted / commercially restricted
```

---

## F-4: Dev-Only Copyleft Differentiation (Scoring Challenge)

### F-4.1: @license-testbed/dev-only-gpl — GPL-3.0-only in devDependencies

```
UID: LICENSE_GPL30_DEVONLY
Package: @license-testbed/dev-only-gpl (^1.0.0)
Declared License: GPL-3.0-only
Location: devDependencies (DEV ONLY)
Import: test/app.test.js only — NOT in src/app.js
SPDX: yes
Category: strong-copyleft (but dev-only context)
Risk: Low (dev-only — not distributed)
Expected SCA Behaviour (BEST):
  - Still flag the GPL-3.0 license (it exists in the dependency tree)
  - BUT note it's a devDependency / only imported in test files
  - Assign LOWER severity than ffmpeg-static (same license, prod context)
Expected SCA Behaviour (ADEQUATE):
  - Flag it at same severity as ffmpeg-static (tool doesn't differentiate
    dev vs prod context — losing points vs competitors that do)
Expected SCA Behaviour (WORST):
  - Miss it entirely (doesn't scan devDependencies)
```

---

## F-5: Edge Cases & License Expressions

### F-5.1: node-forge — Dual License (BSD-3-Clause OR GPL-2.0)

```
UID: LICENSE_DUAL_NODEFORGE
Package: node-forge (^1.3.1)
Declared License: (BSD-3-Clause OR GPL-2.0)
Location: dependencies (PRODUCTION, imported in src/app.js)
SPDX: yes (valid expression)
Category: dual-license-edge
Risk: Depends on interpretation
Expected: Correctly parse SPDX expression and surface both options
```

### F-5.2: extjs-gpl — GPL-3.0 in dependencies, not imported

```
UID: LICENSE_GPL30_EXTJS
Package: extjs-gpl (^6.2.0)
Declared License: GPL-3.0
Location: dependencies, BUT browser-only — NOT imported in any Node.js code
SPDX: yes
Category: dead-code-edge
Risk: Low (can't actually be used in this project)
Expected: Tool may flag as GPL-3.0 but should ideally note it's not
          importable in Node.js context
```

---

## F-6: Transitive Copyleft Detection

### F-6.1: sharp → @img/sharp-libvips-* (LGPL-3.0-or-later)

```
UID: LICENSE_LGPL30_TRANSITIVE
Package: sharp (^0.35.0, direct dep)
Transitive: @img/sharp-libvips-linux-x64 (LGPL-3.0-or-later)
Category: weak-copyleft-transitive
Risk: Medium
Expected: Discover transitive dep and flag LGPL-3.0. Show path:
          sharp → @img/sharp-libvips-*
```

---

## F-7: Permissive Baselines (Zero FP)

The following should trigger **no license policy violations**:

express (MIT), lodash (MIT), rxjs (Apache-2.0), semver (ISC),
source-map (BSD-3-Clause), spdx-license-ids (CC0-1.0),
@license-testbed/wtfpl-pkg (WTFPL), @license-testbed/unlicense-pkg (Unlicense),
@license-testbed/bsd2-pkg (BSD-2-Clause), @license-testbed/bsd3-pkg (BSD-3-Clause),
@license-testbed/zerobsd-pkg (0BSD), @license-testbed/apache2-pkg (Apache-2.0),
@license-testbed/mit-pkg (MIT), @license-testbed/isc-pkg (ISC),
typescript (Apache-2.0, dev), tslib (0BSD, dev), mocha (MIT, dev),
chai (MIT, dev)

Any SCA tool flagging these as license violations is a False Positive.

---

## Scoring Summary

| Finding ID | License | Category | Risk | Prod/Dev | Points |
|-----------|---------|----------|------|----------|--------|
| LICENSE_GPL30_FFMPEG | GPL-3.0-or-later | Strong Copyleft | High | PROD | Critical |
| LICENSE_AGPL30_PKG | AGPL-3.0-only | Network Copyleft | Critical | PROD | Critical |
| LICENSE_GPL20_MYGPL | GPL-2.0 | Strong Copyleft | High | PROD | Critical |
| LICENSE_LGPL21_PKG | LGPL-2.1-only | Weak Copyleft | Medium | PROD | Medium |
| LICENSE_MPL20_PKG | MPL-2.0 | Weak Copyleft | Low-Med | PROD | Medium |
| LICENSE_BUSL11_PKG | BUSL-1.1 | Non-OSI Restrictive | High | PROD | High |
| LICENSE_SSPL10_PKG | SSPL-1.0 | Non-OSI Restrictive | High | PROD | High |
| LICENSE_GPL30_DEVONLY | GPL-3.0-only | Strong Copyleft | Low | DEV | **Diff** |
| LICENSE_DUAL_NODEFORGE | (BSD-3-Clause OR GPL-2.0) | Dual / Edge | Depends | PROD | Medium |
| LICENSE_GPL30_EXTJS | GPL-3.0 | Dead Code | Low | PROD (stub) | Low |
| LICENSE_LGPL30_TRANSITIVE | LGPL-3.0-or-later | Transitive Copyleft | Medium | PROD | High |

**Total Findings:** 11 expected
**Critical Scorecard Items:** F-1.1 (GPL-3.0 prod), F-1.2 (AGPL-3.0),
F-3.1 (BUSL), F-3.2 (SSPL), F-4.1 (dev-only differentiation)

**Pass Criteria:** Tool flags all 4 critical items AND differentiates F-4.1
severity from F-1.1 (same license, different context).
