// license-testbed: SCA vendor evaluation — license analysis
//
// This app deliberately imports packages across the license spectrum.
// All imports in this file are PRODUCTION code paths. SCA tools that
// distinguish reachable vs unreachable dependencies should find every
// import below in a live code path.

const express = require('express');
const _ = require('lodash');
const { Observable } = require('rxjs');
const semver = require('semver');
const { SourceMapConsumer } = require('source-map');
const forge = require('node-forge');
const ffmpegPath = require('ffmpeg-static');
const sharp = require('sharp');
const spdxIds = require('spdx-license-ids');
// Note: my-gpl-package (GPL-2.0) is in the dependency tree but has no valid
// entry point; it is NOT imported here. SCA tools should still flag it
// from the package.json / lockfile metadata as a strong-copyleft dependency.

// Workspace packages — these declare specific licenses in their package.json
const agplPkg = require('@license-testbed/agpl-pkg');
const lgplPkg = require('@license-testbed/lgpl-pkg');
const mplPkg = require('@license-testbed/mpl-pkg');
const buslPkg = require('@license-testbed/busl-pkg');
const ssplPkg = require('@license-testbed/sspl-pkg');
const wtfplPkg = require('@license-testbed/wtfpl-pkg');
const unlicensePkg = require('@license-testbed/unlicense-pkg');
const bsd2Pkg = require('@license-testbed/bsd2-pkg');
const bsd3Pkg = require('@license-testbed/bsd3-pkg');
const zerobsdPkg = require('@license-testbed/zerobsd-pkg');
const apache2Pkg = require('@license-testbed/apache2-pkg');
const mitPkg = require('@license-testbed/mit-pkg');
const iscPkg = require('@license-testbed/isc-pkg');

const app = express();
const PORT = process.env.PORT || 3000;

// ---------------------------------------------------------------------------
// Route: / — overview
// Demonstrates lodash, rxjs, semver, spdx-license-ids in a production path
// ---------------------------------------------------------------------------
app.get('/', (req, res) => {
  // lodash: pick some licenses for display
  const permissiveLicenses = _.pick(
    { 'MIT': true, 'Apache-2.0': true, 'ISC': true, 'BSD-2-Clause': true, 'BSD-3-Clause': true, '0BSD': true },
    ['MIT', 'Apache-2.0']
  );

  // rxjs: create a simple observable for request tracking
  const request$ = new Observable((observer) => {
    observer.next({ path: '/', time: Date.now() });
    observer.complete();
  });

  // semver: validate the node version
  const nodeOk = semver.satisfies(process.version, '>=18.0.0');

  res.json({
    name: 'License Testbed',
    purpose: 'SCA vendor evaluation — open source license analysis',
    nodeOk,
    permissiveBaseline: Object.keys(permissiveLicenses),
    spdxLicenseCount: spdxIds.length,
    // Use ffmpeg-static path to demonstrate GPL-3.0 dependency in runtime
    ffmpegAvailable: typeof ffmpegPath === 'string' && ffmpegPath.length > 0,
    myGplPackageInTree: true, // declared in package.json, GPL-2.0
    note: 'This project intentionally includes dependencies with commercially-restrictive licenses for evaluation purposes.'
  });
});

// ---------------------------------------------------------------------------
// Route: /licenses — full catalog of all dependencies and their SPDX licenses
// Imports every workspace package, demonstrating they are in the production path
// ---------------------------------------------------------------------------
app.get('/licenses', (req, res) => {
  const licenseCatalog = [
    // Real npm packages
    { name: 'express',           license: 'MIT',           source: 'npm',    category: 'permissive' },
    { name: 'lodash',            license: 'MIT',           source: 'npm',    category: 'permissive' },
    { name: 'rxjs',              license: 'Apache-2.0',    source: 'npm',    category: 'permissive' },
    { name: 'semver',            license: 'ISC',           source: 'npm',    category: 'permissive' },
    { name: 'source-map',        license: 'BSD-3-Clause',  source: 'npm',    category: 'permissive' },
    { name: 'spdx-license-ids',  license: 'CC0-1.0',       source: 'npm',    category: 'permissive' },
    // Dual license — edge case
    { name: 'node-forge',        license: '(BSD-3-Clause OR GPL-2.0)', source: 'npm', category: 'dual' },
    // Strong copyleft — production import (CRITICAL)
    { name: 'ffmpeg-static',     license: 'GPL-3.0-or-later', source: 'npm', category: 'strong-copyleft' },
    { name: 'my-gpl-package',    license: 'GPL-2.0',       source: 'npm',    category: 'strong-copyleft' },
    // Apache 2.0 with transitive LGPL-3.0 via libvips
    { name: 'sharp',             license: 'Apache-2.0',     source: 'npm',    category: 'permissive', transitiveNote: 'depends on @img/sharp-libvips-* (LGPL-3.0-or-later)' },
    // Workspace packages
    { name: agplPkg.name,       license: agplPkg.license,  source: 'workspace', category: 'network-copyleft' },
    { name: lgplPkg.name,       license: lgplPkg.license,  source: 'workspace', category: 'weak-copyleft' },
    { name: mplPkg.name,        license: mplPkg.license,   source: 'workspace', category: 'weak-copyleft' },
    { name: buslPkg.name,       license: buslPkg.license,  source: 'workspace', category: 'non-osi-restrictive' },
    { name: ssplPkg.name,       license: ssplPkg.license,  source: 'workspace', category: 'non-osi-restrictive' },
    { name: wtfplPkg.name,      license: wtfplPkg.license, source: 'workspace', category: 'permissive' },
    { name: unlicensePkg.name,  license: unlicensePkg.license, source: 'workspace', category: 'permissive' },
    { name: bsd2Pkg.name,       license: bsd2Pkg.license,  source: 'workspace', category: 'permissive' },
    { name: bsd3Pkg.name,       license: bsd3Pkg.license,  source: 'workspace', category: 'permissive' },
    { name: zerobsdPkg.name,    license: zerobsdPkg.license, source: 'workspace', category: 'permissive' },
    { name: apache2Pkg.name,    license: apache2Pkg.license, source: 'workspace', category: 'permissive' },
    { name: mitPkg.name,        license: mitPkg.license,   source: 'workspace', category: 'permissive' },
    { name: iscPkg.name,        license: iscPkg.license,   source: 'workspace', category: 'permissive' },
  ];

  res.json({ count: licenseCatalog.length, packages: licenseCatalog });
});

// ---------------------------------------------------------------------------
// Route: /image — uses sharp (transitive LGPL-3.0 via libvips) in production
// ---------------------------------------------------------------------------
app.get('/image', async (req, res) => {
  try {
    // Create a 1x1 pixel placeholder image using sharp
    const pngBuffer = await sharp({
      create: {
        width: 1,
        height: 1,
        channels: 3,
        background: { r: 0, g: 0, b: 0 }
      }
    }).png().toBuffer();

    res.type('png').send(pngBuffer);
  } catch (err) {
    res.status(500).json({ error: 'Image processing failed' });
  }
});

// ---------------------------------------------------------------------------
// Route: /crypto — uses node-forge (dual BSD-3-Clause OR GPL-2.0)
// ---------------------------------------------------------------------------
app.get('/crypto', (req, res) => {
  const md = forge.md.md5.create();
  md.update('test data');
  const hash = md.digest().toHex();

  res.json({
    algorithm: 'MD5',
    hash: hash,
    library: 'node-forge',
    note: 'node-forge is dual-licensed (BSD-3-Clause OR GPL-2.0)'
  });
});

// ---------------------------------------------------------------------------
// Route: /transitive — demonstrates the chain of dependency license exposure
// ---------------------------------------------------------------------------
app.get('/transitive', (req, res) => {
  // sharp is Apache-2.0, but depends on @img/sharp-libvips-* which is LGPL-3.0-or-later
  // This demonstrates transitive copyleft exposure
  res.json({
    directDep: { name: 'sharp', license: 'Apache-2.0' },
    transitiveDep: { name: '@img/sharp-libvips-linux-x64', license: 'LGPL-3.0-or-later' },
    note: 'SCA tools should discover LGPL-3.0 transitive dependency even when the direct dependency is Apache-2.0'
  });
});

app.listen(PORT, () => {
  console.log(`License Testbed running on http://localhost:${PORT}`);
});
