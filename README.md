# com.xsec.workspace.traffic

This is the public source repository for `com.xsec.workspace.traffic`. It was materialized from
the immutable signed XSEC Marketplace release during the first-party source
migration. Develop on `beta`; merge reviewed, tested changes to `main` for the
Stable source line.

The package owns the complete sandboxed frontend for the restored traffic
workbench. Its Preact source lives in `src/`; `pnpm build` bundles it into the
single self-contained ESM artifact declared by the manifest:

```text
plugins/com.xsec.workspace.traffic/com.xsec.desktop/frontend/index.js
```

The workbench, standalone detail, replay editor, filters and plugin settings are
implemented here. XSEC Desktop supplies only capability-checked Host RPC,
current-session binding, persisted-traffic events and workspace navigation. The
legacy compiled React workbench is a product reference and is not a runtime
dependency.

## Development

```bash
pnpm install
pnpm check
pnpm build
pnpm test
pnpm verify
```

Commit the generated frontend artifact together with its source changes. The
test suite checks the manifest/activation contract, filter and replay helpers,
and verifies that the generated module is self-contained and loadable.

## Release verification

Before publishing a Beta source revision, run `pnpm verify` and validate the
declared plugin directory with the XSEC Desktop release tooling. The published
source revision must include the generated frontend artifact. Factory records
the exact Beta and Stable source revisions with the immutable release.

Use the exact candidate commit for both channel checks. Source verification is
defined by `.github/workflows/ci.yml`: Node 24.19.0, pnpm 10.34.5, and the frozen
lockfile must reproduce the committed frontend without a diff:

```bash
git checkout --detach <candidate-source-sha>
node --version
pnpm --version
pnpm install --frozen-lockfile
pnpm verify
git diff --exit-code -- plugins/com.xsec.workspace.traffic/com.xsec.desktop/frontend/index.js
```

The version commands must report Node v24.19.0 and pnpm 10.34.5. Any install,
verification, test, or generated-artifact diff failure rejects the source
revision. Record the source SHA and the successful `manifest` and
`source-preflight / source-preflight` run URLs.

The protected Factory automation described in the
[first-party Factory runbook](https://github.com/tzf1003/xsec-plugins/blob/main/docs/first-party-plugin-factory.md)
is the release-tooling authority. Its exact protected `xsec-plugins/main`
revision and workflow run URL identify the tooling version; the Factory receipt
must bind that revision to this repository's exact Beta and Stable SHAs. Stable
passes reproduction only when the Factory source gate rebuilds the Beta
release from the recorded Stable SHA and reports the same `releaseId` and
artifact SHA-256. Record both source SHAs, the Factory revision and run URL,
the release ID, and the artifact digest. Any mismatch or missing KMS/source-gate
proof rejects promotion.

Desktop acceptance follows the
[official marketplace smoke contract](https://github.com/tzf1003/xSecDesktop/blob/main/docs/plugins/official-marketplace-smoke.md).
The protected workflow runs the locked Desktop host command below against the
exact Factory revision and requested channel, using a new temporary profile:

```text
cargo run --locked -p xsec-plugin-host --bin xsec-official-marketplace-smoke -- smoke --profile-root <fresh-runner-temp-path> --marketplace-revision <factory-revision> --channel <beta-or-stable>
```

The release passes only when the Linux (`ubuntu-24.04`), Windows
(`windows-2022`), macOS ARM (`macos-15`), and macOS Intel
(`macos-15-intel`) jobs all succeed for that revision and channel, and the
Factory callback records the successful matrix. Retain the workflow run URL
and each platform's `official-marketplace-smoke-*` report artifact; a failed or
missing platform job rejects publication.

Marketplace artifacts, release indexes, signatures, and Factory adoption proof
remain in [tzf1003/xsec-plugins](https://github.com/tzf1003/xsec-plugins).
This source repository never stores Factory credentials or KMS material.

Source repository: <https://github.com/tzf1003/xsec-plugin-traffic>
