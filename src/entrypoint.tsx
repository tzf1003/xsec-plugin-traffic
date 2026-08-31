import { render } from "preact";
import { PluginApp } from "./plugin-app";
import { parseContext } from "./context";
import { styles } from "./styles/index";
import type { PluginContext, PluginHost } from "./types";

type Controller = {
  mount(root: HTMLElement, context: unknown): void;
  update(context: unknown): void;
  dispose(): void;
};

export function activate(host: PluginHost): Controller {
  if (host.apiVersion !== 2) throw new Error(`不支持的 Frontend API：${host.apiVersion}`);
  console.debug("traffic.frontend.activate", { apiVersion: host.apiVersion });
  let root: HTMLElement | undefined;
  let current: PluginContext | undefined;
  const draw = () => {
    if (!root || !current) return;
    render(<PluginApp host={host} context={current} />, root);
  };
  return {
    mount(nextRoot, context) {
      root = nextRoot;
      current = parseContext(context);
      console.info("traffic.frontend.mount", {
        contextKind: current.kind,
        toolKind: current.kind === "workspace-tool" ? current.tool.kind : undefined,
      });
      const style = document.createElement("style");
      style.dataset.xsecTrafficStyles = "";
      style.textContent = styles;
      root.before(style);
      draw();
    },
    update(context) {
      current = parseContext(context);
      console.debug("traffic.frontend.update", {
        contextKind: current.kind,
        visible: current.kind === "workspace-tool" ? current.visible : undefined,
      });
      draw();
    },
    dispose() {
      console.debug("traffic.frontend.dispose");
      if (root) render(null, root);
      document.querySelector("style[data-xsec-traffic-styles]")?.remove();
      root = undefined;
      current = undefined;
    },
  };
}
