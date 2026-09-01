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
  charset: "utf8",
  jsx: "automatic",
  jsxImportSource: "preact",
  loader: { ".css": "text" },
  footer: {
    js: "export function activate(host){const controller=__xsecTrafficFrontend.activate(host);return{mount(root,context){return controller.mount(root,context)},update(context){return controller.update(context)},dispose(){return controller.dispose()}}}",
  },
  legalComments: "none",
  minifyIdentifiers: false,
  minifySyntax: true,
  minifyWhitespace: true,
  sourcemap: false,
});
