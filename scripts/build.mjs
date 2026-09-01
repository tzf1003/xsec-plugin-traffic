import { build } from "esbuild";
import { mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const output = resolve("plugins/com.xsec.workspace.traffic/com.xsec.desktop/frontend/index.js");
const activateDocumentation = `/**
 * Activate the Traffic frontend and expose its host lifecycle.
 * @param {object} host Desktop host bridge for the active plugin surface.
 * @returns {object} Explicit mount, update, and dispose lifecycle delegates.
 */`;

/** Build the explicit Traffic lifecycle exported by the generated frontend. */
function activate(host){
  const controller=__xsecTrafficFrontend.activate(host);
  return{
    /**
     * Mount the active Traffic surface into the supplied root and context.
     * @param {Element} root Host-owned element for the active surface.
     * @param {object} context Initial workspace-tool or settings-page context.
     */
    mount(root,context){return controller.mount(root,context)},
    /**
     * Update the active Traffic surface with the next host context.
     * @param {object} context Current workspace-tool or settings-page context.
     */
    update(context){return controller.update(context)},
    /** Dispose subscriptions, rendered content, and retained surface state. */
    dispose(){return controller.dispose()}
  };
}

// Factory reads this boundary statically, so preserve the named lifecycle source.
const frontendFooter = `${activateDocumentation}\nexport ${activate.toString()}`;
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
