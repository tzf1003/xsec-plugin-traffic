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
For Stable publication, deterministically reproduce the same release and
generated frontend artifact, then pass Desktop smoke tests on Linux, Windows,
macOS ARM, and macOS Intel.

Marketplace artifacts, release indexes, signatures, and Factory adoption proof
remain in [tzf1003/xsec-plugins](https://github.com/tzf1003/xsec-plugins).
This source repository never stores Factory credentials or KMS material.

Source repository: <https://github.com/tzf1003/xsec-plugin-traffic>
