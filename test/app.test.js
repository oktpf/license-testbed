// Test file — imports a devDependency with GPL-3.0
// This tests whether SCA tools correctly distinguish:
//   - DEV-ONLY usage (this file) from PRODUCTION usage (src/app.js)
//   - devDependency packages from runtime dependencies
//
// A good SCA tool should:
//   - Still flag @license-testbed/dev-only-gpl's GPL-3.0 license
//   - But note it's a dev-only dependency / not in production runtime
//   - NOT classify it at the same severity as ffmpeg-static (GPL-3.0 in production)

const { expect } = require('chai');
const devOnlyGpl = require('@license-testbed/dev-only-gpl');

describe('License Testbed — Dev-Only Dependency Check', function() {

  it('should flag dev-only-gpl as GPL-3.0 dev-only dependency', function() {
    // @license-testbed/dev-only-gpl is GPL-3.0-only licensed
    // It is ONLY in devDependencies and ONLY imported in this test file
    // SCA tools should flag it but note it's dev-only context
    expect(devOnlyGpl.license).to.equal('GPL-3.0-only');
    console.log('Dev-only GPL package:', devOnlyGpl);
  });

  it('should distinguish ffmpeg-static as production GPL-3.0 dependency', function() {
    // ffmpeg-static is ALSO GPL-3.0-or-later, but in dependencies AND
    // imported in src/app.js (production code).
    // SCA tools that distinguish dev vs runtime should flag this at
    // HIGH severity while dev-only-gpl should be at LOWER severity.
    const ffmpeg = require('ffmpeg-static');
    expect(ffmpeg).to.be.a('string');
    console.log('ffmpeg-static path:', ffmpeg);
  });

});
