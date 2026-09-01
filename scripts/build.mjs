import { build } from "esbuild";
import { mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const output = resolve("plugins/com.xsec.workspace.traffic/com.xsec.desktop/frontend/index.js");
await mkdir(dirname(output), { recursive: true });
await build({
  entryPoints: [resolve("src/entrypoint.tsx")],
  outfile: output,
  bundle: true,
  format: "iife",
  globalName: "__xsecTrafficFrontend",
  platform: "browser",
  target: ["es2022"],
  jsx: "automatic",
  jsxImportSource: "preact",
  loader: { ".css": "text" },
  footer: { js: "export function activate(host){return __xsecTrafficFrontend.activate(host)}" },
  legalComments: "none",
  minifyIdentifiers: false,
  minifySyntax: true,
  minifyWhitespace: true,
  sourcemap: false,
});
