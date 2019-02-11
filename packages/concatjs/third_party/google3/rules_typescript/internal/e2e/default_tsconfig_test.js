/**
 * @fileoverview
 * This tests interactions between multiple Bazel workspaces.
 *
 * We have learned from experience in the rules_nodejs repo that it's not
 * practical to simply check in the nested WORKSPACE files and try to build
 * them, because
 * - it's hard to exclude them from the parent WORKSPACE - each nested workspace
 *   must be registered there with a matching name
 * - testing a child workspace requires `cd` into the directory, which doesn't
 *   fit the CI model of `bazel test ...`
 *
 * The test is written in JavaScript simply to make it more portable, so we can
 * run it on Windows for example. We don't use TypeScript here since we are
 * running outside the build system.
 */

const fs = require('fs');
const path = require('path');
const child_process = require('child_process');
const os = require('os');

const tmpdir = fs.mkdtempSync(path.join(os.tmpdir(), 'wksp'));
const WORKSPACE_BOILERPLATE = `
local_repository(
    name = "build_bazel_rules_typescript",
    path = "${process.cwd()}",
)
# Using rules_typescript_dev_dependencies for this test since we're not depending on the generated npm package
load("@build_bazel_rules_typescript//:package.bzl", "rules_typescript_dev_dependencies")
rules_typescript_dev_dependencies()
load("@build_bazel_rules_nodejs//:defs.bzl", "node_repositories", "yarn_install")
node_repositories()
yarn_install(
  name = "npm",
  package_json = "//:package.json",
  yarn_lock = "//:yarn.lock",
)
# Using ts_setup_dev_workspace for this test since we're not depending on the generated npm package
load("@build_bazel_rules_typescript//internal:ts_repositories.bzl", "ts_setup_dev_workspace")
ts_setup_dev_workspace()
`;

const PACKAGE_JSON = `{
    "devDependencies": {
        "@types/node": "7.0.18",
        "protobufjs": "5.0.3",
        "source-map-support": "0.5.9",
        "tsickle": "0.33.1",
        "tsutils": "2.27.2",
        "typescript": "~3.1.3"
    }
}
`;

const YARN_LOCK =
    `# THIS IS AN AUTOGENERATED FILE. DO NOT EDIT THIS FILE DIRECTLY.
# yarn lockfile v1


"@types/node@7.0.18":
  version "7.0.18"
  resolved "https://registry.yarnpkg.com/@types/node/-/node-7.0.18.tgz#cd67f27d3dc0cfb746f0bdd5e086c4c5d55be173"
  integrity sha1-zWfyfT3Az7dG8L3V4IbExdVb4XM=

ansi-regex@^2.0.0:
  version "2.1.1"
  resolved "https://registry.yarnpkg.com/ansi-regex/-/ansi-regex-2.1.1.tgz#c3b33ab5ee360d86e0e628f0468ae7ef27d654df"
  integrity sha1-w7M6te42DYbg5ijwRorn7yfWVN8=

ascli@~1:
  version "1.0.1"
  resolved "https://registry.yarnpkg.com/ascli/-/ascli-1.0.1.tgz#bcfa5974a62f18e81cabaeb49732ab4a88f906bc"
  integrity sha1-vPpZdKYvGOgcq660lzKrSoj5Brw=
  dependencies:
    colour "~0.7.1"
    optjs "~3.2.2"

balanced-match@^1.0.0:
  version "1.0.0"
  resolved "https://registry.yarnpkg.com/balanced-match/-/balanced-match-1.0.0.tgz#89b4d199ab2bee49de164ea02b89ce462d71b767"
  integrity sha1-ibTRmasr7kneFk6gK4nORi1xt2c=

brace-expansion@^1.1.7:
  version "1.1.11"
  resolved "https://registry.yarnpkg.com/brace-expansion/-/brace-expansion-1.1.11.tgz#3c7fcbf529d87226f3d2f52b966ff5271eb441dd"
  integrity sha512-iCuPHDFgrHX7H2vEI/5xpz07zSHB00TpugqhmYtVmMO6518mCuRMoOYFldEBl0g187ufozdaHgWKcYFb61qGiA==
  dependencies:
    balanced-match "^1.0.0"
    concat-map "0.0.1"

buffer-from@^1.0.0:
  version "1.1.1"
  resolved "https://registry.yarnpkg.com/buffer-from/-/buffer-from-1.1.1.tgz#32713bc028f75c02fdb710d7c7bcec1f2c6070ef"
  integrity sha512-MQcXEUbCKtEo7bhqEs6560Hyd4XaovZlO/k9V3hjVUF/zwW7KBVdSK4gIt/bzwS9MbR5qob+F5jusZsb0YQK2A==

bytebuffer@~5:
  version "5.0.1"
  resolved "https://registry.yarnpkg.com/bytebuffer/-/bytebuffer-5.0.1.tgz#582eea4b1a873b6d020a48d58df85f0bba6cfddd"
  integrity sha1-WC7qSxqHO20CCkjVjfhfC7ps/d0=
  dependencies:
    long "~3"

camelcase@^2.0.1:
  version "2.1.1"
  resolved "https://registry.yarnpkg.com/camelcase/-/camelcase-2.1.1.tgz#7c1d16d679a1bbe59ca02cacecfb011e201f5a1f"
  integrity sha1-fB0W1nmhu+WcoCys7PsBHiAfWh8=

cliui@^3.0.3:
  version "3.2.0"
  resolved "https://registry.yarnpkg.com/cliui/-/cliui-3.2.0.tgz#120601537a916d29940f934da3b48d585a39213d"
  integrity sha1-EgYBU3qRbSmUD5NNo7SNWFo5IT0=
  dependencies:
    string-width "^1.0.1"
    strip-ansi "^3.0.1"
    wrap-ansi "^2.0.0"

code-point-at@^1.0.0:
  version "1.1.0"
  resolved "https://registry.yarnpkg.com/code-point-at/-/code-point-at-1.1.0.tgz#0d070b4d043a5bea33a2f1a40e2edb3d9a4ccf77"
  integrity sha1-DQcLTQQ6W+ozovGkDi7bPZpMz3c=

colour@~0.7.1:
  version "0.7.1"
  resolved "https://registry.yarnpkg.com/colour/-/colour-0.7.1.tgz#9cb169917ec5d12c0736d3e8685746df1cadf778"
  integrity sha1-nLFpkX7F0SwHNtPoaFdG3xyt93g=

concat-map@0.0.1:
  version "0.0.1"
  resolved "https://registry.yarnpkg.com/concat-map/-/concat-map-0.0.1.tgz#d8a96bd77fd68df7793a73036a3ba0d5405d477b"
  integrity sha1-2Klr13/Wjfd5OnMDajug1UBdR3s=

decamelize@^1.1.1:
  version "1.2.0"
  resolved "https://registry.yarnpkg.com/decamelize/-/decamelize-1.2.0.tgz#f6534d15148269b20352e7bee26f501f9a191290"
  integrity sha1-9lNNFRSCabIDUue+4m9QH5oZEpA=

fs.realpath@^1.0.0:
  version "1.0.0"
  resolved "https://registry.yarnpkg.com/fs.realpath/-/fs.realpath-1.0.0.tgz#1504ad2523158caa40db4a2787cb01411994ea4f"
  integrity sha1-FQStJSMVjKpA20onh8sBQRmU6k8=

glob@^7.0.5:
  version "7.1.3"
  resolved "https://registry.yarnpkg.com/glob/-/glob-7.1.3.tgz#3960832d3f1574108342dafd3a67b332c0969df1"
  integrity sha512-vcfuiIxogLV4DlGBHIUOwI0IbrJ8HWPc4MU7HzviGeNho/UJDfi6B5p3sHeWIQ0KGIU0Jpxi5ZHxemQfLkkAwQ==
  dependencies:
    fs.realpath "^1.0.0"
    inflight "^1.0.4"
    inherits "2"
    minimatch "^3.0.4"
    once "^1.3.0"
    path-is-absolute "^1.0.0"

inflight@^1.0.4:
  version "1.0.6"
  resolved "https://registry.yarnpkg.com/inflight/-/inflight-1.0.6.tgz#49bd6331d7d02d0c09bc910a1075ba8165b56df9"
  integrity sha1-Sb1jMdfQLQwJvJEKEHW6gWW1bfk=
  dependencies:
    once "^1.3.0"
    wrappy "1"

inherits@2:
  version "2.0.3"
  resolved "https://registry.yarnpkg.com/inherits/-/inherits-2.0.3.tgz#633c2c83e3da42a502f52466022480f4208261de"
  integrity sha1-Yzwsg+PaQqUC9SRmAiSA9CCCYd4=

invert-kv@^1.0.0:
  version "1.0.0"
  resolved "https://registry.yarnpkg.com/invert-kv/-/invert-kv-1.0.0.tgz#104a8e4aaca6d3d8cd157a8ef8bfab2d7a3ffdb6"
  integrity sha1-EEqOSqym09jNFXqO+L+rLXo//bY=

is-fullwidth-code-point@^1.0.0:
  version "1.0.0"
  resolved "https://registry.yarnpkg.com/is-fullwidth-code-point/-/is-fullwidth-code-point-1.0.0.tgz#ef9e31386f031a7f0d643af82fde50c457ef00cb"
  integrity sha1-754xOG8DGn8NZDr4L95QxFfvAMs=
  dependencies:
    number-is-nan "^1.0.0"

lcid@^1.0.0:
  version "1.0.0"
  resolved "https://registry.yarnpkg.com/lcid/-/lcid-1.0.0.tgz#308accafa0bc483a3867b4b6f2b9506251d1b835"
  integrity sha1-MIrMr6C8SDo4Z7S28rlQYlHRuDU=
  dependencies:
    invert-kv "^1.0.0"

long@~3:
  version "3.2.0"
  resolved "https://registry.yarnpkg.com/long/-/long-3.2.0.tgz#d821b7138ca1cb581c172990ef14db200b5c474b"
  integrity sha1-2CG3E4yhy1gcFymQ7xTbIAtcR0s=

minimatch@^3.0.4:
  version "3.0.4"
  resolved "https://registry.yarnpkg.com/minimatch/-/minimatch-3.0.4.tgz#5166e286457f03306064be5497e8dbb0c3d32083"
  integrity sha512-yJHVQEhyqPLUTgt9B83PXu6W3rx4MvvHvSUvToogpwoGDOUQ+yDrR0HRot+yOCdCO7u4hX3pWft6kWBBcqh0UA==
  dependencies:
    brace-expansion "^1.1.7"

minimist@0.0.8:
  version "0.0.8"
  resolved "https://registry.yarnpkg.com/minimist/-/minimist-0.0.8.tgz#857fcabfc3397d2625b8228262e86aa7a011b05d"
  integrity sha1-hX/Kv8M5fSYluCKCYuhqp6ARsF0=

minimist@^1.2.0:
  version "1.2.0"
  resolved "https://registry.yarnpkg.com/minimist/-/minimist-1.2.0.tgz#a35008b20f41383eec1fb914f4cd5df79a264284"
  integrity sha1-o1AIsg9BOD7sH7kU9M1d95omQoQ=

mkdirp@^0.5.1:
  version "0.5.1"
  resolved "https://registry.yarnpkg.com/mkdirp/-/mkdirp-0.5.1.tgz#30057438eac6cf7f8c4767f38648d6697d75c903"
  integrity sha1-MAV0OOrGz3+MR2fzhkjWaX11yQM=
  dependencies:
    minimist "0.0.8"

number-is-nan@^1.0.0:
  version "1.0.1"
  resolved "https://registry.yarnpkg.com/number-is-nan/-/number-is-nan-1.0.1.tgz#097b602b53422a522c1afb8790318336941a011d"
  integrity sha1-CXtgK1NCKlIsGvuHkDGDNpQaAR0=

once@^1.3.0:
  version "1.4.0"
  resolved "https://registry.yarnpkg.com/once/-/once-1.4.0.tgz#583b1aa775961d4b113ac17d9c50baef9dd76bd1"
  integrity sha1-WDsap3WWHUsROsF9nFC6753Xa9E=
  dependencies:
    wrappy "1"

optjs@~3.2.2:
  version "3.2.2"
  resolved "https://registry.yarnpkg.com/optjs/-/optjs-3.2.2.tgz#69a6ce89c442a44403141ad2f9b370bd5bb6f4ee"
  integrity sha1-aabOicRCpEQDFBrS+bNwvVu29O4=

os-locale@^1.4.0:
  version "1.4.0"
  resolved "https://registry.yarnpkg.com/os-locale/-/os-locale-1.4.0.tgz#20f9f17ae29ed345e8bde583b13d2009803c14d9"
  integrity sha1-IPnxeuKe00XoveWDsT0gCYA8FNk=
  dependencies:
    lcid "^1.0.0"

path-is-absolute@^1.0.0:
  version "1.0.1"
  resolved "https://registry.yarnpkg.com/path-is-absolute/-/path-is-absolute-1.0.1.tgz#174b9268735534ffbc7ace6bf53a5a9e1b5c5f5f"
  integrity sha1-F0uSaHNVNP+8es5r9TpanhtcX18=

protobufjs@5.0.3:
  version "5.0.3"
  resolved "https://registry.yarnpkg.com/protobufjs/-/protobufjs-5.0.3.tgz#e4dfe9fb67c90b2630d15868249bcc4961467a17"
  integrity sha512-55Kcx1MhPZX0zTbVosMQEO5R6/rikNXd9b6RQK4KSPcrSIIwoXTtebIczUrXlwaSrbz4x8XUVThGPob1n8I4QA==
  dependencies:
    ascli "~1"
    bytebuffer "~5"
    glob "^7.0.5"
    yargs "^3.10.0"

source-map-support@0.5.9:
  version "0.5.9"
  resolved "https://registry.yarnpkg.com/source-map-support/-/source-map-support-0.5.9.tgz#41bc953b2534267ea2d605bccfa7bfa3111ced5f"
  integrity sha512-gR6Rw4MvUlYy83vP0vxoVNzM6t8MUXqNuRsuBmBHQDu1Fh6X015FrLdgoDKcNdkwGubozq0P4N0Q37UyFVr1EA==
  dependencies:
    buffer-from "^1.0.0"
    source-map "^0.6.0"

source-map@^0.6.0:
  version "0.6.1"
  resolved "https://registry.yarnpkg.com/source-map/-/source-map-0.6.1.tgz#74722af32e9614e9c287a8d0bbde48b5e2f1a263"
  integrity sha512-UjgapumWlbMhkBgzT7Ykc5YXUT46F0iKu8SGXq0bcwP5dz/h0Plj6enJqjz1Zbq2l5WaqYnrVbwWOWMyF3F47g==

source-map@^0.7.3:
  version "0.7.3"
  resolved "https://registry.yarnpkg.com/source-map/-/source-map-0.7.3.tgz#5302f8169031735226544092e64981f751750383"
  integrity sha512-CkCj6giN3S+n9qrYiBTX5gystlENnRW5jZeNLHpe6aue+SrHcG5VYwujhW9s4dY31mEGsxBDrHR6oI69fTXsaQ==

string-width@^1.0.1:
  version "1.0.2"
  resolved "https://registry.yarnpkg.com/string-width/-/string-width-1.0.2.tgz#118bdf5b8cdc51a2a7e70d211e07e2b0b9b107d3"
  integrity sha1-EYvfW4zcUaKn5w0hHgfisLmxB9M=
  dependencies:
    code-point-at "^1.0.0"
    is-fullwidth-code-point "^1.0.0"
    strip-ansi "^3.0.0"

strip-ansi@^3.0.0, strip-ansi@^3.0.1:
  version "3.0.1"
  resolved "https://registry.yarnpkg.com/strip-ansi/-/strip-ansi-3.0.1.tgz#6a385fb8853d952d5ff05d0e8aaf94278dc63dcf"
  integrity sha1-ajhfuIU9lS1f8F0Oiq+UJ43GPc8=
  dependencies:
    ansi-regex "^2.0.0"

tsickle@0.33.1:
  version "0.33.1"
  resolved "https://registry.yarnpkg.com/tsickle/-/tsickle-0.33.1.tgz#eee4ebabeda3bcd8afc32cee34c822cbe3e839ec"
  integrity sha512-SpW2G3PvDGs4a5sMXPlWnCWHWRviWjSlI3U0734e3fU3U39VAE0NPr8M3W1cuL/OU/YXheYipGeEwtIJ5k0NHQ==
  dependencies:
    minimist "^1.2.0"
    mkdirp "^0.5.1"
    source-map "^0.7.3"

tslib@^1.8.1:
  version "1.9.3"
  resolved "https://registry.yarnpkg.com/tslib/-/tslib-1.9.3.tgz#d7e4dd79245d85428c4d7e4822a79917954ca286"
  integrity sha512-4krF8scpejhaOgqzBEcGM7yDIEfi0/8+8zDRZhNZZ2kjmHJ4hv3zCbQWxoJGz1iw5U0Jl0nma13xzHXcncMavQ==

tsutils@2.27.2:
  version "2.27.2"
  resolved "https://registry.yarnpkg.com/tsutils/-/tsutils-2.27.2.tgz#60ba88a23d6f785ec4b89c6e8179cac9b431f1c7"
  integrity sha512-qf6rmT84TFMuxAKez2pIfR8UCai49iQsfB7YWVjV1bKpy/d0PWT5rEOSM6La9PiHZ0k1RRZQiwVdVJfQ3BPHgg==
  dependencies:
    tslib "^1.8.1"

typescript@~3.1.6:
  version "3.1.6"
  resolved "https://registry.yarnpkg.com/typescript/-/typescript-3.1.6.tgz#b6543a83cfc8c2befb3f4c8fba6896f5b0c9be68"
  integrity sha512-tDMYfVtvpb96msS1lDX9MEdHrW4yOuZ4Kdc4Him9oU796XldPYF/t2+uKoX0BBa0hXXwDlqYQbXY5Rzjzc5hBA==

window-size@^0.1.4:
  version "0.1.4"
  resolved "https://registry.yarnpkg.com/window-size/-/window-size-0.1.4.tgz#f8e1aa1ee5a53ec5bf151ffa09742a6ad7697876"
  integrity sha1-+OGqHuWlPsW/FR/6CXQqatdpeHY=

wrap-ansi@^2.0.0:
  version "2.1.0"
  resolved "https://registry.yarnpkg.com/wrap-ansi/-/wrap-ansi-2.1.0.tgz#d8fc3d284dd05794fe84973caecdd1cf824fdd85"
  integrity sha1-2Pw9KE3QV5T+hJc8rs3Rz4JP3YU=
  dependencies:
    string-width "^1.0.1"
    strip-ansi "^3.0.1"

wrappy@1:
  version "1.0.2"
  resolved "https://registry.yarnpkg.com/wrappy/-/wrappy-1.0.2.tgz#b5243d8f3ec1aa35f1364605bc0d1036e30ab69f"
  integrity sha1-tSQ9jz7BqjXxNkYFvA0QNuMKtp8=

y18n@^3.2.0:
  version "3.2.1"
  resolved "https://registry.yarnpkg.com/y18n/-/y18n-3.2.1.tgz#6d15fba884c08679c0d77e88e7759e811e07fa41"
  integrity sha1-bRX7qITAhnnA136I53WegR4H+kE=

yargs@^3.10.0:
  version "3.32.0"
  resolved "https://registry.yarnpkg.com/yargs/-/yargs-3.32.0.tgz#03088e9ebf9e756b69751611d2a5ef591482c995"
  integrity sha1-AwiOnr+edWtpdRYR0qXvWRSCyZU=
  dependencies:
    camelcase "^2.0.1"
    cliui "^3.0.3"
    decamelize "^1.1.1"
    os-locale "^1.4.0"
    string-width "^1.0.1"
    window-size "^0.1.4"
    y18n "^3.2.0"
`;

/**
 * Create a file at path filename, creating parent directories as needed, under
 * this test's temp directory. Write the content into that file.
 */
function write(filename, content) {
  var parents = path.dirname(path.join(tmpdir, filename));
  while (path.dirname(parents) !== parents) {
    if (!fs.existsSync(path.join(parents))) {
      fs.mkdirSync(path.join(parents));
    }
    parents = path.dirname(parents);
  }
  fs.writeFileSync(path.join(tmpdir, filename), content);
}

function bazel(workspace, args) {
  const result = child_process.spawnSync('bazel', args, {
    cwd: path.join(tmpdir, workspace),
    stdio: 'inherit',
  });
  expect(result.status).toBe(0, 'bazel exited with non-zero exit code');
}

describe('default tsconfig', () => {
  it(`uses the tsconfig in the workspace defining the rule,
        not the workspace where the rule is defined (rules_typescript), nor
        the workspace where the build is occurring`,
     () => {
       // Workspace 'a' can't compile with --noImplicitAny.
       // When workspace 'b' has a dep here, we make sure not to use the
       // tsconfig from workspace 'b'
       write('a/package.json', PACKAGE_JSON);
       write('a/yarn.lock', YARN_LOCK);
       write('a/WORKSPACE', `
workspace(name = "a")
${WORKSPACE_BOILERPLATE}`);
       write('a/BUILD', `
# We use ts_library from internal/defaults.bzl since we don't have a @bazel/typescript npm
# package in this test. This changes the ts_library compiler from the default
# which depends on @npm//@bazel/typescript which is not available in this test to '@build_bazel_rules_typescript//internal:tsc_wrapped_bin' which is
load("@build_bazel_rules_typescript//internal:defaults.bzl", "ts_library")
ts_library(
    name = "a_lib",
    srcs=["has_implicit_any.ts"],
    visibility = ["//visibility:public"],
)
        `);
       write('a/tsconfig.json', `{}`);
       write('a/has_implicit_any.ts', `function f(a) {
            console.error(a);
        }`);

       // Workspace 'b' has a default tsconfig that sets --noImplicitAny.
       write('b/package.json', PACKAGE_JSON);
       write('b/yarn.lock', YARN_LOCK);
       write('b/WORKSPACE', `
workspace(name="b")
local_repository(name="a", path="../a")
${WORKSPACE_BOILERPLATE}`);
       write('b/BUILD', `
# We use ts_library from internal/defaults.bzl since we don't have a @bazel/typescript npm
# package in this test. This changes the ts_library compiler from the default
# which depends on @npm//@bazel/typescript which is not available in this test to '@build_bazel_rules_typescript//internal:tsc_wrapped_bin' which is
load("@build_bazel_rules_typescript//internal:defaults.bzl", "ts_library")
exports_files(["tsconfig.json"])
ts_library(
    name = "b_lib",
    srcs = ["file.ts"],
    deps = ["@a//:a_lib"],
)
        `);
       write('b/file.ts', `
        f('thing');
        `);
       write('b/tsconfig.json', `{
            "compilerOptions": {
                "noImplicitAny": true
            }
        }`);

       // Now build from workspace 'b' and verify that the dep in workspace 'a'
       // was able to compile.
       bazel('b', ['build', ':all']);
     });
});
