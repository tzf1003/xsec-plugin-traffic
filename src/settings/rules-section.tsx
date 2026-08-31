import { useEffect, useState } from "preact/hooks";
import { deleteRule, loadRules, saveRule, toggleRule } from "../api/settings";
import type { PassiveRule, PluginHost } from "../types";
import { Button, Check, Dialog, Field, Notice, Spinner } from "../ui/primitives";

const EMPTY_RULE: PassiveRule = { rule_id: "", severity: "medium", pattern: "", enabled: true };

export function RulesSection({ host }: { host: PluginHost }) {
  const [rules, setRules] = useState<PassiveRule[]>();
  const [draft, setDraft] = useState<PassiveRule>(EMPTY_RULE);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const [deleteId, setDeleteId] = useState<string>();
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    let active = true; setLoading(true); setError(undefined);
    void loadRules(host).then((value) => { if (active) setRules(value); })
      .catch((reason) => { if (active) setError(`读取被动规则失败：${String(reason)}`); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [host, revision]);
  const reload = async () => { setRules(await loadRules(host)); };
  const save = async () => {
    if (!draft.rule_id.trim() || !draft.pattern.trim()) { setError("请输入规则 ID 和正则表达式"); return; }
    setBusy(true); setError(undefined);
    try { await saveRule(host, { ...draft, rule_id: draft.rule_id.trim() }); await reload(); setDraft(EMPTY_RULE); }
    catch (reason) { setError(`保存被动规则失败：${String(reason)}`); }
    finally { setBusy(false); }
  };
  const toggle = async (rule: PassiveRule, enabled: boolean) => {
    setBusy(true); setError(undefined);
    try { await toggleRule(host, rule.rule_id, enabled); await reload(); }
    catch (reason) { setError(`更新被动规则失败：${String(reason)}`); }
    finally { setBusy(false); }
  };
  const remove = async () => {
    if (!deleteId) return; setBusy(true); setError(undefined);
    try { await deleteRule(host, deleteId); await reload(); setDeleteId(undefined); }
    catch (reason) { setError(`删除被动规则失败：${String(reason)}`); }
    finally { setBusy(false); }
  };
  return <section className="settings-section"><header><div><h2>被动检测规则</h2><p>保存后应用于之后捕获的流量。</p></div></header>
    {error ? <Notice action={!rules ? <Button onClick={() => setRevision((value) => value + 1)}>重新读取</Button> : null} onClose={() => setError(undefined)}>{error}</Notice> : null}
    <div className="rule-form"><Field label="规则 ID"><input value={draft.rule_id} onInput={(event) => setDraft({ ...draft, rule_id: event.currentTarget.value })} /></Field><Field label="严重级别"><select value={draft.severity} onChange={(event) => setDraft({ ...draft, severity: event.currentTarget.value as PassiveRule["severity"] })}><option value="low">low</option><option value="medium">medium</option><option value="high">high</option><option value="critical">critical</option></select></Field><Field className="rule-pattern-field" label="正则表达式"><input value={draft.pattern} onInput={(event) => setDraft({ ...draft, pattern: event.currentTarget.value })} /></Field><Check checked={draft.enabled} onChange={(enabled) => setDraft({ ...draft, enabled })}>启用</Check><Button tone="primary" disabled={busy} onClick={() => void save()}>保存</Button></div>
    {loading ? <Spinner label="正在读取被动规则…" /> : null}
    {rules ? <div className="rule-table-wrap"><table className="rule-table"><thead><tr><th>启用</th><th>规则 ID</th><th>严重</th><th>正则</th><th>操作</th></tr></thead><tbody>{rules.map((rule) => <tr key={rule.rule_id}><td><Check checked={rule.enabled} disabled={busy} onChange={(enabled) => void toggle(rule, enabled)}><span className="sr-only">启用 {rule.rule_id}</span></Check></td><td><code>{rule.rule_id}</code></td><td>{rule.severity}</td><td className="rule-pattern" title={rule.pattern}>{rule.pattern}</td><td><Button tone="ghost" onClick={() => setDraft(rule)}>编辑</Button><Button tone="ghost" icon="trash" onClick={() => setDeleteId(rule.rule_id)}>删除</Button></td></tr>)}</tbody></table></div> : null}
    {deleteId ? <Dialog title="删除被动规则？" width={440} onClose={() => setDeleteId(undefined)} footer={<><Button onClick={() => setDeleteId(undefined)}>取消</Button><Button tone="danger" disabled={busy} onClick={() => void remove()}>删除</Button></>}><p>规则 <code>{deleteId}</code> 将从被动检测中移除。</p></Dialog> : null}
  </section>;
}
