"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, ChevronDown, ChevronUp, Code2, Copy, Database, Eye, GripVertical, Layers3, Loader2, PlusCircle, RefreshCcw, Rocket, Save, ShieldCheck, Smartphone, Sparkles, Trash2 } from "lucide-react";
import { ExperienceSimulator, type SimulatorAppearance, type SimulatorShell } from "@/components/qcos/experience-simulator";

interface Finding { level: "error" | "warning"; path: string; code: string; message: string }
interface EditorWidget { id: string; type: string; version: string; props: Record<string, unknown>; actions?: unknown[]; dataSource?: unknown }
interface EditorSection { id: string; name: string; order: number; enabled?: boolean; visible?: boolean; constraints: Record<string, unknown>; widgets: EditorWidget[] }
interface ReferenceTemplate { pageName: string; displayName: string; description: string; templateFamily: string; themeId?: number | null; experienceShell?: SimulatorShell; sections: EditorSection[] }
interface WidgetDefinition { name: string; version: string; description: string; requiredCapabilities: string[]; defaultProps: Record<string, unknown>; schema: { properties?: Record<string, { type?: string; enum?: unknown[] }> } }
interface StoredTemplate { id: number; page_name: string; description?: string; versions: Array<{ id: number; version_number: number; status: string; layouts: Array<{ name: string }> }> }

const API_ROOT = "/BuggyCxp/api/qcos";
const SHELL_PRESETS: Record<string, SimulatorAppearance> = {
  "Immersive commerce": { headerStyle: "immersive", moduleTabStyle: "arched_cards", searchStyle: "floating", navigationStyle: "edge_bar", contentDensity: "comfortable", cardStyle: "squircle", campaignMotion: "lively" },
  "Clean marketplace": { headerStyle: "clean", moduleTabStyle: "floating_cards", searchStyle: "outlined", navigationStyle: "edge_bar", contentDensity: "comfortable", cardStyle: "rounded", campaignMotion: "subtle" },
  "Compact catalog": { headerStyle: "compact", moduleTabStyle: "segmented", searchStyle: "embedded", navigationStyle: "floating_dock", contentDensity: "compact", cardStyle: "soft_square", campaignMotion: "none" },
};
const MENU_DESTINATIONS = ["home_food", "home_quick_commerce", "category_directory", "category_listing", "reorder", "saved", "recently_viewed", "collection_listing", "cart"];

// Native option elements may contain text only; this keeps the existing editor markup hydration-safe.
function Plus(props: { className?: string }) { void props.className; return "+"; }

export default function ExperienceStudio() {
  const [references, setReferences] = useState<ReferenceTemplate[]>([]);
  const [registry, setRegistry] = useState<WidgetDefinition[]>([]);
  const [stored, setStored] = useState<StoredTemplate[]>([]);
  const [selected, setSelected] = useState(0);
  const [source, setSource] = useState("");
  const [findings, setFindings] = useState<Finding[]>([]);
  const [busy, setBusy] = useState<"load" | "validate" | "save" | "bootstrap" | null>("load");
  const [notice, setNotice] = useState("");
  const [mode, setMode] = useState<"visual" | "json">("visual");
  const [selectedWidget, setSelectedWidget] = useState<{ section: number; widget: number } | null>(null);
  const [draggedSectionIndex, setDraggedSectionIndex] = useState<number | null>(null);

  const load = useCallback(async () => {
    setBusy("load");
    setNotice("");
    try {
      const response = await fetch(`${API_ROOT}/studio`, { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Unable to load Experience Studio");
      setReferences(payload.referenceTemplates || []);
      setRegistry(payload.registry || []);
      setStored(payload.templates || []);
      if (!source && payload.referenceTemplates?.[0]) setSource(JSON.stringify(payload.referenceTemplates[0], null, 2));
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Unable to load Experience Studio");
    } finally {
      setBusy(null);
    }
  }, [source]);

  useEffect(() => {
    const timer = window.setTimeout(() => { void load(); }, 0);
    return () => window.clearTimeout(timer);
    // Initial authenticated load only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const document = useMemo(() => {
    try { return JSON.parse(source) as ReferenceTemplate; } catch { return null; }
  }, [source]);

  function selectTemplate(index: number) {
    setSelected(index);
    setSource(JSON.stringify(references[index], null, 2));
    setFindings([]);
    setNotice("");
  }

  function mutateDocument(mutator: (draft: ReferenceTemplate) => void) {
    if (!document) return;
    const draft = structuredClone(document);
    mutator(draft);
    draft.sections.forEach((section, index) => { section.order = index; });
    setSource(JSON.stringify(draft, null, 2));
    setFindings([]);
  }

  function applyAppearance(preset: SimulatorAppearance) {
    mutateDocument((draft) => {
      if (draft.experienceShell) draft.experienceShell.appearance = structuredClone(preset);
    });
  }

  function updateAppearance<Key extends keyof SimulatorAppearance>(key: Key, value: SimulatorAppearance[Key]) {
    mutateDocument((draft) => {
      if (draft.experienceShell?.appearance) draft.experienceShell.appearance[key] = value;
    });
  }

  function moveSection(index: number, direction: -1 | 1) {
    mutateDocument((draft) => {
      const target = index + direction;
      if (target < 0 || target >= draft.sections.length) return;
      [draft.sections[index], draft.sections[target]] = [draft.sections[target], draft.sections[index]];
    });
  }

  function handleDropSection(targetIndex: number) {
    if (draggedSectionIndex === null || draggedSectionIndex === targetIndex) return;
    mutateDocument((draft) => {
      const [moved] = draft.sections.splice(draggedSectionIndex, 1);
      draft.sections.splice(targetIndex, 0, moved);
    });
    setDraggedSectionIndex(null);
  }

  function toggleSectionVisibility(index: number) {
    mutateDocument((draft) => {
      const section = draft.sections[index];
      const currentVisible = section.enabled !== false && section.visible !== false;
      const nextVisible = !currentVisible;
      section.enabled = nextVisible;
      section.visible = nextVisible;
      if (!section.constraints) section.constraints = {};
      section.constraints.enabled = nextVisible;
      section.constraints.visible = nextVisible;
    });
  }

  function removeWidget(sectionIndex: number, widgetIndex: number) {
    mutateDocument((draft) => { draft.sections[sectionIndex].widgets.splice(widgetIndex, 1); });
    setSelectedWidget(null);
  }

  function addWidget(sectionIndex: number, type: string) {
    const definition = registry.find((item) => item.name === type);
    if (!definition) return;
    mutateDocument((draft) => { draft.sections[sectionIndex].widgets.push({ id: `${type}_${Date.now()}`, type, version: definition.version, props: structuredClone(definition.defaultProps), actions: [] }); });
  }

  function addSection() {
    mutateDocument((draft) => draft.sections.push({ id: `section_${Date.now()}`, name: "New section", order: draft.sections.length, constraints: {}, widgets: [] }));
  }

  function duplicateWidget(sectionIndex: number, widgetIndex: number) {
    mutateDocument((draft) => {
      const copy = structuredClone(draft.sections[sectionIndex].widgets[widgetIndex]);
      copy.id = `${copy.type}_${Date.now()}`;
      draft.sections[sectionIndex].widgets.splice(widgetIndex + 1, 0, copy);
    });
  }

  function updateSelectedProps(raw: string) {
    if (!selectedWidget) return;
    try {
      const props = JSON.parse(raw) as Record<string, unknown>;
      mutateDocument((draft) => { draft.sections[selectedWidget.section].widgets[selectedWidget.widget].props = props; });
      setNotice("");
    } catch { setNotice("Widget properties must be a valid JSON object."); }
  }

  function updateSelectedProperty(key: string, value: unknown) {
    if (!selectedWidget) return;
    mutateDocument((draft) => { draft.sections[selectedWidget.section].widgets[selectedWidget.widget].props[key] = value; });
  }

  async function validate() {
    setBusy("validate"); setNotice("");
    try {
      const parsed: unknown = JSON.parse(source);
      const response = await fetch(`${API_ROOT}/studio/validate`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(parsed) });
      const payload = await response.json();
      setFindings(payload.findings || []);
      setNotice(payload.success ? "Document is compatible and ready to save." : "Resolve validation errors before saving.");
      return Boolean(payload.success);
    } catch (error) {
      setFindings([{ level: "error", path: "$", code: "INVALID_JSON", message: error instanceof Error ? error.message : "Invalid JSON" }]);
      return false;
    } finally { setBusy(null); }
  }

  async function save() {
    if (!(await validate())) return;
    setBusy("save");
    try {
      const response = await fetch(`${API_ROOT}/studio`, { method: "POST", headers: { "Content-Type": "application/json" }, body: source });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Unable to save draft");
      setNotice(`Draft v${payload.data.version.version_number} saved. Review and approve it before production promotion.`);
      await load();
    } catch (error) { setNotice(error instanceof Error ? error.message : "Unable to save draft"); }
    finally { setBusy(null); }
  }

  async function bootstrap() {
    setBusy("bootstrap");
    try {
      const response = await fetch(`${API_ROOT}/studio/bootstrap`, { method: "POST" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Bootstrap failed");
      setNotice(`Registry ready: ${payload.widgets} widgets and ${payload.channels} release channels synchronized.`);
      await load();
    } catch (error) { setNotice(error instanceof Error ? error.message : "Bootstrap failed"); }
    finally { setBusy(null); }
  }

  async function publish() {
    if (!(await validate())) return;
    setBusy("save");
    setNotice("");
    try {
      // 1. Save draft first
      const saveRes = await fetch(`${API_ROOT}/studio`, { method: "POST", headers: { "Content-Type": "application/json" }, body: source });
      const savePayload = await saveRes.json();
      if (!saveRes.ok) throw new Error(savePayload.error || "Unable to save draft");

      const versionId = savePayload.data.version.id;

      // 2. Promote to prod channel using existing release infrastructure
      const promoteRes = await fetch(`${API_ROOT}/releases/promote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pageVersionId: versionId,
          channelCode: "prod",
          confirmation: "PUBLISH",
        }),
      });
      const promotePayload = await promoteRes.json();
      if (!promoteRes.ok) throw new Error(promotePayload.error || "Unable to publish to production");

      setNotice(`🚀 Published ${document?.displayName || document?.pageName} (v${savePayload.data.version.version_number}) to Production! Mobile app will receive updated layout immediately.`);
      await load();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Publish failed");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="p-6 max-w-[1500px] mx-auto space-y-6">
      <header className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-white flex items-center gap-3"><Layers3 className="w-8 h-8 text-indigo-400" /> Experience Studio <span className="text-xs px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">Persistent SDUI v1</span></h1>
          <p className="text-slate-400 text-sm mt-2">Author, validate, preview, version, approve and release mobile experiences compatible with the Flutter widget registry.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => void bootstrap()} disabled={busy !== null} className="px-4 py-2 rounded-xl border border-slate-700 text-slate-200 text-sm flex items-center gap-2"><Database className="w-4 h-4" /> Sync registry</button>
          <button onClick={() => void validate()} disabled={busy !== null} className="px-4 py-2 rounded-xl border border-indigo-500/40 text-indigo-300 text-sm flex items-center gap-2"><ShieldCheck className="w-4 h-4" /> Validate</button>
          <button onClick={() => void save()} disabled={busy !== null} className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold flex items-center gap-2 transition">{busy === "save" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save immutable draft</button>
          <button onClick={() => void publish()} disabled={busy !== null} className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold flex items-center gap-2 shadow-lg shadow-emerald-900/30 transition">{busy === "save" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Rocket className="w-4 h-4" />} Publish to Production</button>
        </div>
      </header>

      {notice && <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/10 px-4 py-3 text-sm text-indigo-200">{notice}</div>}

      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[{ label: "Reference families", value: references.length, icon: Smartphone }, { label: "Registered widgets", value: registry.length, icon: Sparkles }, { label: "Persisted pages", value: stored.length, icon: Database }, { label: "Validation findings", value: findings.length, icon: ShieldCheck }].map((metric) => <div key={metric.label} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4"><metric.icon className="w-5 h-5 text-indigo-400 mb-3" /><div className="text-2xl font-bold text-white">{metric.value}</div><div className="text-xs text-slate-400">{metric.label}</div></div>)}
      </section>

      <nav className="flex flex-wrap gap-2">
        {references.map((template, index) => <button key={template.pageName} onClick={() => selectTemplate(index)} className={`px-4 py-2 rounded-xl text-sm border ${selected === index ? "bg-indigo-500/15 border-indigo-500/50 text-indigo-200" : "border-slate-800 text-slate-400"}`}>{template.displayName}</button>)}
        <div className="ml-auto flex rounded-xl border border-slate-800 p-1"><button onClick={() => setMode("visual")} className={`px-3 py-1.5 rounded-lg text-xs flex gap-2 items-center ${mode === "visual" ? "bg-slate-800 text-white" : "text-slate-500"}`}><Eye className="w-3.5 h-3.5" /> Visual</button><button onClick={() => setMode("json")} className={`px-3 py-1.5 rounded-lg text-xs flex gap-2 items-center ${mode === "json" ? "bg-slate-800 text-white" : "text-slate-500"}`}><Code2 className="w-3.5 h-3.5" /> Contract</button></div>
      </nav>

      <main className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <section className="xl:col-span-8 rounded-3xl border border-slate-800 bg-slate-950/60 overflow-hidden min-h-[650px]">
          <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between"><div><h2 className="font-bold text-white">{document?.displayName || "Invalid document"}</h2><p className="text-xs text-slate-500">{document?.pageName} · {document?.templateFamily}</p></div><button onClick={() => void load()} className="text-slate-400"><RefreshCcw className="w-4 h-4" /></button></div>
          {mode === "json" ? <textarea value={source} onChange={(event) => setSource(event.target.value)} spellCheck={false} className="w-full min-h-[600px] bg-[#070a12] p-5 font-mono text-xs leading-6 text-emerald-200 outline-none resize-y" /> :
            <div className="p-6 grid md:grid-cols-[390px_1fr] gap-6">
              <ExperienceSimulator document={document} sourceLabel="Experience Studio draft" />
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white">Layout structure</h3>
                  <button onClick={addSection} className="text-xs text-indigo-300 flex items-center gap-1 hover:text-white">
                    <PlusCircle className="w-4 h-4" /> Add section
                  </button>
                </div>
                {document?.sections?.map((section, sectionIndex) => {
                  const isSectionEnabled = section.enabled !== false && section.visible !== false;
                  return (
                    <article
                      key={section.id}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData("text/plain", sectionIndex.toString());
                        setDraggedSectionIndex(sectionIndex);
                      }}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        const fromIndexStr = e.dataTransfer.getData("text/plain");
                        const fromIndex = parseInt(fromIndexStr, 10);
                        if (!isNaN(fromIndex)) handleDropSection(sectionIndex);
                      }}
                      className={`rounded-2xl border transition ${
                        isSectionEnabled ? "border-slate-800 bg-slate-900/50" : "border-amber-500/20 bg-amber-500/5 opacity-75"
                      } p-4`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          {/* Drag handle */}
                          <div
                            className="cursor-grab active:cursor-grabbing p-1.5 rounded-lg bg-slate-800/80 text-slate-400 hover:text-white flex-shrink-0"
                            title="Drag to reorder section"
                          >
                            <GripVertical className="w-4 h-4" />
                          </div>

                          {/* Visibility Checkbox */}
                          <label className="flex items-center gap-1.5 cursor-pointer select-none flex-shrink-0">
                            <input
                              type="checkbox"
                              checked={isSectionEnabled}
                              onChange={() => toggleSectionVisibility(sectionIndex)}
                              className="h-4 w-4 accent-emerald-500 rounded cursor-pointer"
                            />
                            <span className={`text-[11px] font-bold ${isSectionEnabled ? "text-emerald-400" : "text-amber-400"}`}>
                              {isSectionEnabled ? "Enabled" : "Disabled"}
                            </span>
                          </label>

                          {/* Section details */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 truncate max-w-[140px]">
                                {section.id}
                              </span>
                              <span className="text-[10px] text-slate-500">Order: {section.order}</span>
                            </div>
                            <input
                              aria-label="Section name"
                              value={section.name}
                              onChange={(event) =>
                                mutateDocument((draft) => {
                                  draft.sections[sectionIndex].name = event.target.value;
                                })
                              }
                              className="font-semibold text-white bg-transparent outline-none border-b border-transparent focus:border-indigo-500 text-xs mt-0.5 w-full"
                            />
                          </div>
                        </div>

                        {/* Order & Management Buttons */}
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button
                            aria-label="Move section up"
                            disabled={sectionIndex === 0}
                            onClick={() => moveSection(sectionIndex, -1)}
                            className="p-1 rounded-lg border border-slate-800 text-slate-400 hover:text-white disabled:opacity-30"
                          >
                            <ChevronUp className="w-4 h-4" />
                          </button>
                          <button
                            aria-label="Move section down"
                            disabled={sectionIndex === (document?.sections.length ?? 0) - 1}
                            onClick={() => moveSection(sectionIndex, 1)}
                            className="p-1 rounded-lg border border-slate-800 text-slate-400 hover:text-white disabled:opacity-30"
                          >
                            <ChevronDown className="w-4 h-4" />
                          </button>
                          <button
                            aria-label="Delete section"
                            onClick={() =>
                              mutateDocument((draft) => {
                                draft.sections.splice(sectionIndex, 1);
                              })
                            }
                            className="p-1 rounded-lg border border-slate-800 text-red-400 hover:text-red-300 hover:bg-red-500/10 ml-0.5"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Section Widgets */}
                      <div className="mt-3 space-y-2">
                        {section.widgets.map((item, widgetIndex) => (
                          <div
                            key={item.id}
                            className={`flex items-center justify-between rounded-lg border px-2 py-2 text-xs ${
                              selectedWidget?.section === sectionIndex && selectedWidget.widget === widgetIndex
                                ? "border-indigo-500 bg-indigo-500/10"
                                : "border-slate-700 bg-slate-950/40"
                            }`}
                          >
                            <button
                              onClick={() => setSelectedWidget({ section: sectionIndex, widget: widgetIndex })}
                              className="text-left flex-1 text-slate-300"
                            >
                              <span className="font-semibold text-slate-200">{item.type}</span>
                              <span className="text-[10px] text-indigo-400 ml-1.5">@{item.version}</span>
                              <span className="block text-[9px] text-slate-500 font-mono">{item.id}</span>
                            </button>
                            <button
                              aria-label="Duplicate widget"
                              onClick={() => duplicateWidget(sectionIndex, widgetIndex)}
                              className="p-1 text-slate-400 hover:text-white"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                            <button
                              aria-label="Delete widget"
                              onClick={() => removeWidget(sectionIndex, widgetIndex)}
                              className="p-1 text-red-400 hover:text-red-300"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                        <select
                          aria-label={`Add widget to ${section.name}`}
                          defaultValue=""
                          onChange={(event) => {
                            if (event.target.value) addWidget(sectionIndex, event.target.value);
                            event.target.value = "";
                          }}
                          className="w-full rounded-lg border border-dashed border-slate-700 bg-slate-950 px-2 py-2 text-xs text-slate-400"
                        >
                          <option value="">
                            <Plus className="w-3 h-3" /> Add registered widget...
                          </option>
                          {registry.map((item) => (
                            <option key={item.name} value={item.name}>
                              {item.name}@{item.version}
                            </option>
                          ))}
                        </select>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>}
        </section>

        <aside className="xl:col-span-4 space-y-5">
          {document?.experienceShell && <section className="rounded-2xl border border-emerald-500/25 bg-emerald-500/5 p-5">
            <div className="flex items-start justify-between gap-3"><div><h3 className="font-bold text-white">Mobile theme & navigation</h3><p className="mt-1 text-[10px] text-slate-500">Governed visual variants, tabs and native destinations.</p></div><span className="rounded-full border border-emerald-500/30 px-2 py-1 text-[9px] font-bold uppercase text-emerald-300">{document.experienceShell.module.replaceAll("_", " ")}</span></div>
            <div className="mt-4 grid grid-cols-3 gap-2">{Object.entries(SHELL_PRESETS).map(([name, preset]) => <button key={name} onClick={() => applyAppearance(preset)} className="rounded-xl border border-slate-700 bg-slate-950/60 p-2 text-left text-[9px] font-semibold text-slate-300 transition hover:border-emerald-500/50 hover:text-white">{name}</button>)}</div>
            {document.experienceShell.appearance && <div className="mt-4 grid grid-cols-2 gap-3">
              <ShellSelect label="Header" value={document.experienceShell.appearance.headerStyle} options={["immersive", "compact", "clean"]} onChange={(value) => updateAppearance("headerStyle", value as SimulatorAppearance["headerStyle"])} />
              <ShellSelect label="Module tabs" value={document.experienceShell.appearance.moduleTabStyle} options={["arched_cards", "floating_cards", "segmented"]} onChange={(value) => updateAppearance("moduleTabStyle", value as SimulatorAppearance["moduleTabStyle"])} />
              <ShellSelect label="Search" value={document.experienceShell.appearance.searchStyle} options={["floating", "outlined", "embedded"]} onChange={(value) => updateAppearance("searchStyle", value as SimulatorAppearance["searchStyle"])} />
              <ShellSelect label="Bottom menu" value={document.experienceShell.appearance.navigationStyle} options={["edge_bar", "floating_dock", "minimal"]} onChange={(value) => updateAppearance("navigationStyle", value as SimulatorAppearance["navigationStyle"])} />
              <ShellSelect label="Density" value={document.experienceShell.appearance.contentDensity} options={["comfortable", "compact"]} onChange={(value) => updateAppearance("contentDensity", value as SimulatorAppearance["contentDensity"])} />
              <ShellSelect label="Cards" value={document.experienceShell.appearance.cardStyle} options={["rounded", "squircle", "soft_square"]} onChange={(value) => updateAppearance("cardStyle", value as SimulatorAppearance["cardStyle"])} />
              <ShellSelect label="Campaign motion" value={document.experienceShell.appearance.campaignMotion} options={["none", "subtle", "lively"]} onChange={(value) => updateAppearance("campaignMotion", value as SimulatorAppearance["campaignMotion"])} />
            </div>}
            <div className="mt-5 border-t border-slate-800 pt-4"><div className="flex items-center justify-between"><h4 className="text-xs font-bold text-white">Dynamic menu tabs</h4><span className="text-[9px] text-slate-500">{document.experienceShell.menu.length}/6</span></div><div className="mt-2 space-y-2">{document.experienceShell.menu.map((item, index) => <div key={item.id} className="grid grid-cols-[1fr_1.35fr] gap-2 rounded-xl border border-slate-800 bg-slate-950/40 p-2"><input aria-label={`Menu ${index + 1} label key`} value={item.labelKey} onChange={(event) => mutateDocument((draft) => { if (draft.experienceShell) draft.experienceShell.menu[index].labelKey = event.target.value; })} className="min-w-0 rounded-lg border border-slate-800 bg-slate-950 px-2 py-1.5 text-[10px] text-white outline-none focus:border-emerald-500" /><select aria-label={`Menu ${index + 1} destination`} value={item.destination} onChange={(event) => mutateDocument((draft) => { if (draft.experienceShell) draft.experienceShell.menu[index].destination = event.target.value; })} className="min-w-0 rounded-lg border border-slate-800 bg-slate-950 px-2 py-1.5 text-[10px] text-slate-300 outline-none focus:border-emerald-500">{MENU_DESTINATIONS.map((destination) => <option key={destination}>{destination}</option>)}</select></div>)}</div></div>
            <p className="mt-3 text-[10px] text-slate-500">Colors and media remain governed by Theme Studio and Media Library. Price, stock, ETA and cart truth remain native.</p>
          </section>}
          {selectedWidget && document?.sections[selectedWidget.section]?.widgets[selectedWidget.widget] && (() => { const activeWidget = document.sections[selectedWidget.section].widgets[selectedWidget.widget]; const definition = registry.find((item) => item.name === activeWidget.type); return <section className="rounded-2xl border border-indigo-500/30 bg-indigo-500/5 p-5"><h3 className="font-bold text-white">Widget inspector</h3><p className="text-xs text-slate-500 mt-1">{activeWidget.type} · {definition?.description}</p><div className="mt-4 space-y-3">{Object.entries(definition?.schema.properties || {}).map(([key, rule]) => <PropertyControl key={key} name={key} rule={rule} value={activeWidget.props[key]} onChange={(value) => updateSelectedProperty(key, value)} />)}</div><details className="mt-4"><summary className="text-xs text-indigo-300 cursor-pointer">Advanced JSON</summary><textarea key={`${selectedWidget.section}-${selectedWidget.widget}-${source.length}`} defaultValue={JSON.stringify(activeWidget.props, null, 2)} onBlur={(event) => updateSelectedProps(event.target.value)} className="w-full h-40 mt-3 rounded-xl bg-slate-950 border border-slate-800 p-3 font-mono text-xs text-emerald-200" /></details><p className="text-[10px] text-slate-500 mt-2">Fields are generated from the registry contract and validated before saving.</p></section>; })()}
          <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5"><h3 className="font-bold text-white flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-emerald-400" /> Publish readiness</h3><div className="mt-4 space-y-2">{findings.length === 0 ? <p className="text-xs text-slate-400">Run validation before saving or approval.</p> : findings.map((finding, index) => <div key={`${finding.code}-${index}`} className={`rounded-xl border p-3 text-xs ${finding.level === "error" ? "border-red-500/30 bg-red-500/10 text-red-200" : "border-amber-500/30 bg-amber-500/10 text-amber-200"}`}>{finding.level === "error" ? <AlertTriangle className="w-4 h-4 inline mr-2" /> : <CheckCircle2 className="w-4 h-4 inline mr-2" />}<strong>{finding.code}</strong><div className="mt-1 opacity-80">{finding.path}: {finding.message}</div></div>)}</div></section>
          <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5"><h3 className="font-bold text-white">Persisted versions</h3><div className="mt-4 space-y-2">{stored.map((template) => <div key={template.id} className="rounded-xl border border-slate-800 p-3"><div className="text-sm text-white">{template.page_name}</div><div className="text-xs text-slate-500 mt-1">{template.versions[0] ? `v${template.versions[0].version_number} · ${template.versions[0].status}` : "No versions"}</div></div>)}{stored.length === 0 && <p className="text-xs text-slate-500">No persisted pages yet. Save a reference template as the first immutable draft.</p>}</div></section>
          <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5"><h3 className="font-bold text-white">Compatibility registry</h3><div className="mt-3 max-h-64 overflow-auto space-y-2">{registry.map((item) => <div key={item.name} className="flex justify-between text-xs border-b border-slate-800 pb-2"><span className="text-slate-300">{item.name}</span><span className="text-indigo-400">v{item.version}</span></div>)}</div></section>
        </aside>
      </main>
    </div>
  );
}

function PropertyControl({ name, rule, value, onChange }: { name: string; rule: { type?: string; enum?: unknown[] }; value: unknown; onChange: (value: unknown) => void }) {
  const label = name.replace(/([A-Z])/g, " $1").replace(/^./, (letter) => letter.toUpperCase());
  if (rule.enum) return <label className="block text-xs text-slate-400">{label}<select value={String(value ?? "")} onChange={(event) => onChange(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-950 p-2 text-white">{rule.enum.map((option) => <option key={String(option)} value={String(option)}>{String(option)}</option>)}</select></label>;
  if (rule.type === "boolean") return <label className="flex items-center justify-between text-xs text-slate-400"><span>{label}</span><input type="checkbox" checked={Boolean(value)} onChange={(event) => onChange(event.target.checked)} className="h-4 w-4 accent-indigo-500" /></label>;
  if (rule.type === "number" || rule.type === "integer") return <label className="block text-xs text-slate-400">{label}<input type="number" value={Number(value ?? 0)} onChange={(event) => onChange(rule.type === "integer" ? Number.parseInt(event.target.value, 10) : Number(event.target.value))} className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-950 p-2 text-white" /></label>;
  if (rule.type === "array") return <label className="block text-xs text-slate-400">{label}<input value={Array.isArray(value) ? value.join(", ") : ""} onChange={(event) => onChange(event.target.value.split(",").map((item) => item.trim()).filter(Boolean))} className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-950 p-2 text-white" /><span className="text-[9px] text-slate-600">Comma-separated values</span></label>;
  return <label className="block text-xs text-slate-400">{label}<input value={String(value ?? "")} onChange={(event) => onChange(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-950 p-2 text-white" /></label>;
}

function ShellSelect({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) {
  return <label className="block text-[10px] text-slate-500">{label}<select value={value} onChange={(event) => onChange(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-950 px-2 py-2 text-[10px] text-white outline-none focus:border-emerald-500">{options.map((option) => <option key={option} value={option}>{option.replaceAll("_", " ")}</option>)}</select></label>;
}
