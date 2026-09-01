import { build } from "esbuild";
import { mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const output = resolve("plugins/com.xsec.workspace.traffic/com.xsec.desktop/frontend/index.js");
// Factory reads this boundary statically, so keep each lifecycle delegate explicit.
const frontendFooter = `/** Activate the Traffic frontend and expose its host lifecycle. */
export function activate(host){
  const controller=__xsecTrafficFrontend.activate(host);
  return{
    /** Mount the active Traffic surface. */
    mount(root,context){return controller.mount(root,context)},
    /** Update the active Traffic context. */
    update(context){return controller.update(context)},
    /** Dispose the active Traffic surface. */
    dispose(){return controller.dispose()}
  };
}`;
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
  footer: { js: frontendFooter },
  legalComments: "none",
  minifyIdentifiers: false,
  minifySyntax: true,
  minifyWhitespace: true,
  sourcemap: false,
});
