const Z_INDEX_DEVTOOLS = 99_999;

/** Scoped by the shadow root, so selectors stay short and host styles never leak in. */
export const styles = `
:host {
  --bg: #0e1218; --raised: #141a23; --hover: #1a212c; --border: #252d3a; --text: #e6ebf2; --muted: #8592a6;
  --accent: #5ad8ff; --accent-text: #a9ecff; --ok: #3fd99a; --warn: #f0b653; --error: #ff7d8c;
  --font: 12px/1.5 ui-sans-serif, system-ui, -apple-system, sans-serif; --mono: 11px/1.5 ui-monospace, SFMono-Regular, Menlo, monospace;
  color-scheme: dark; color: var(--text); font: var(--font); text-align: left;
}
@media (prefers-color-scheme: light) {
  :host {
    --bg: #ffffff; --raised: #f5f7fa; --hover: #eceff4; --border: #dde3ec; --text: #1a2230; --muted: #647084;
    --accent: #0a84c7; --accent-text: #075985; --ok: #15803d; --warn: #b45309; --error: #dc2626; color-scheme: light;
  }
}
*, *::before, *::after { box-sizing: border-box; }
button, input { font: inherit; color: inherit; letter-spacing: normal; }
button { cursor: pointer; border: 1px solid var(--border); border-radius: 8px; background: var(--raised); padding: 5px 11px; transition: background 120ms, border-color 120ms; }
button:hover { background: var(--hover); }
:is(button, input, summary, [tabindex]):focus-visible { outline: 2px solid var(--accent); outline-offset: -2px; }
p { margin: 0; }
code, pre { font: var(--mono); background: none; padding: 0; }
.brand-icon { flex-shrink: 0; color: var(--accent); }
.dot { display: inline-block; flex-shrink: 0; width: 7px; height: 7px; border-radius: 50%; background: var(--muted); }
.dot[data-state="connected"], .dot[data-state="subscribed"] { background: var(--ok); box-shadow: 0 0 0 3px color-mix(in srgb, var(--ok) 18%, transparent); }
.dot[data-state="connecting"], .dot[data-state="subscribing"] { background: var(--warn); animation: pulse 1.2s ease-in-out infinite; }
.dot[data-state="error"] { background: var(--error); box-shadow: 0 0 0 3px color-mix(in srgb, var(--error) 25%, transparent); }
@keyframes pulse { 50% { opacity: 0.35; } }
.launcher { position: fixed; z-index: ${Z_INDEX_DEVTOOLS}; right: 20px; bottom: 20px; display: inline-flex; align-items: center; gap: 10px; border-radius: 999px; padding: 9px 15px 9px 12px; background: color-mix(in srgb, var(--bg) 92%, transparent); backdrop-filter: blur(10px); box-shadow: 0 12px 32px -12px #000c, inset 0 1px 0 color-mix(in srgb, var(--text) 8%, transparent); font-weight: 500; transition: transform 120ms, background 120ms; }
.launcher:hover { transform: translateY(-1px); }
.panel { container-type: inline-size; position: fixed; z-index: ${Z_INDEX_DEVTOOLS}; left: 16px; right: 16px; bottom: 16px; max-height: calc(100dvh - 24px); display: flex; flex-direction: column; overflow: hidden; border: 1px solid var(--border); border-radius: 14px; background: color-mix(in srgb, var(--bg) 94%, transparent); backdrop-filter: blur(16px); box-shadow: 0 28px 80px -24px #000d; }
.panel[data-position="right"] { top: 16px; left: auto; max-width: calc(100vw - 24px); padding-left: 8px; }
.resize { flex-shrink: 0; height: 8px; cursor: row-resize; touch-action: none; background: var(--raised); border-bottom: 1px solid var(--border); }
.resize::after { content: ""; display: block; width: 40px; height: 3px; margin: 2px auto 0; border-radius: 2px; background: var(--border); }
.resize[data-position="right"] { position: absolute; top: 0; bottom: 0; left: 0; width: 8px; height: auto; cursor: col-resize; border-bottom: 0; border-right: 1px solid var(--border); }
.resize[data-position="right"]::after { width: 3px; height: 40px; margin: 0; position: absolute; top: 50%; left: 2px; transform: translateY(-50%); }
.resize:hover::after, .resize:focus-visible::after { background: var(--accent); }
.header { display: flex; align-items: center; gap: 10px; min-height: 42px; padding: 4px 14px; border-bottom: 1px solid var(--border); font-size: 13px; }
.label { padding: 1px 7px; border-radius: 999px; background: var(--raised); color: var(--muted); font-size: 10px; text-transform: uppercase; letter-spacing: 1px; }
.session { min-width: 0; margin-left: 4px; color: var(--muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.connection { display: inline-flex; align-items: center; gap: 8px; margin-left: auto; padding: 3px 10px 3px 9px; border: 1px solid var(--border); border-radius: 999px; font: var(--mono); white-space: nowrap; }
.connection[data-state="connected"] { border-color: color-mix(in srgb, var(--ok) 40%, transparent); color: var(--ok); }
.connection[data-state="connecting"] { border-color: color-mix(in srgb, var(--warn) 40%, transparent); color: var(--warn); }
.icon-button { display: inline-flex; padding: 5px; border: 0; background: transparent; color: var(--muted); }
.icon-button:hover { color: var(--text); background: var(--hover); }
.body { flex: 1; min-height: 0; display: grid; grid-template-columns: 260px minmax(0, 1fr); }
.channels { display: block; overflow: auto; padding: 8px; border-right: 1px solid var(--border); }
.channel { display: flex; align-items: center; flex-wrap: wrap; gap: 6px; width: 100%; margin: 0 0 2px; padding: 7px 10px; border-color: transparent; background: transparent; text-align: left; }
.channel[aria-pressed="true"] { background: color-mix(in srgb, var(--accent) 12%, transparent); border-color: color-mix(in srgb, var(--accent) 30%, transparent); color: var(--accent-text); }
.channel-name { display: flex; align-items: center; gap: 9px; overflow-wrap: anywhere; font: var(--mono); }
.channel small { width: 100%; color: var(--muted); font-size: 10px; }
.channel .error { color: var(--error); overflow-wrap: anywhere; }
.count { margin-left: auto; padding: 0 6px; border-radius: 999px; background: var(--hover); font-size: 10px; font-variant-numeric: tabular-nums; }
.channel-empty { padding: 18px 10px; color: var(--muted); font-size: 11px; }
.main { min-height: 0; display: flex; flex-direction: column; }
.toolbar { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; padding: 8px 12px 6px; }
.toolbar input[type="search"] { flex: 1; min-width: 160px; height: 30px; border: 1px solid var(--border); border-radius: 8px; padding: 6px 10px; background: var(--bg); }
.toolbar input::placeholder { color: var(--muted); }
.toolbar button[aria-pressed="true"] { border-color: var(--warn); color: var(--warn); }
.capture { display: flex; align-items: center; gap: 6px; margin: 0 4px; white-space: nowrap; cursor: pointer; }
.capture input { margin: 0; width: 13px; height: 13px; accent-color: var(--accent); }
.total { color: var(--muted); font-size: 10px; font-variant-numeric: tabular-nums; white-space: nowrap; }
.kinds { display: flex; flex-wrap: wrap; gap: 6px; padding: 0 12px 8px; border-bottom: 1px solid var(--border); }
.chip { display: inline-flex; align-items: center; gap: 6px; padding: 2px 9px 2px 8px; border-radius: 999px; background: transparent; font-size: 11px; }
.chip::before { content: ""; width: 6px; height: 6px; border-radius: 50%; background: var(--muted); }
.chip[data-kind="PUBLICATION"]::before { background: var(--ok); }
.chip[data-kind="LIFECYCLE"]::before { background: var(--accent); }
.chip[data-kind="ERROR"]::before { background: var(--error); }
.chip[aria-pressed="true"] { background: color-mix(in srgb, var(--accent) 12%, transparent); border-color: color-mix(in srgb, var(--accent) 30%, transparent); color: var(--accent-text); }
.chip .count { margin-left: 0; background: color-mix(in srgb, var(--text) 8%, transparent); }
.events { flex: 1; min-height: 0; overflow: auto; overscroll-behavior: contain; }
.event { border-bottom: 1px solid var(--border); }
.event summary { display: grid; grid-template-columns: 84px 140px minmax(0, 1fr) minmax(0, 2fr) 10px; gap: 12px; align-items: center; padding: 7px 14px; cursor: pointer; list-style: none; font: var(--mono); }
.event summary::-webkit-details-marker { display: none; }
.event summary:hover { background: var(--hover); }
.event summary > * { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.event time { color: var(--muted); font-size: 10px; font-variant-numeric: tabular-nums; }
.event-type { color: var(--accent-text); }
.event-channel { color: var(--muted); }
.event-summary { color: var(--muted); }
.event[data-kind="PUBLICATION"] { box-shadow: inset 2px 0 0 var(--ok); }
.event[data-kind="PUBLICATION"] .event-type { color: var(--ok); font-weight: 500; }
.event[data-kind="PUBLICATION"] .event-summary { color: var(--text); }
.event[data-kind="RUNTIME"] .event-type { color: var(--muted); }
.event[data-kind="ERROR"] { box-shadow: inset 2px 0 0 var(--error); }
.event[data-kind="ERROR"] :is(.event-type, .event-summary) { color: var(--error); }
.expand { color: var(--muted); transition: transform 120ms; }
details[open] .expand { transform: rotate(180deg); }
.context { position: relative; background: color-mix(in srgb, var(--bg) 60%, black); }
.context pre { margin: 0; padding: 12px 80px 12px 20px; overflow: auto; max-height: 260px; color: var(--text); line-height: 1.6; }
.copy { position: absolute; top: 8px; right: 12px; padding: 3px 10px; font-size: 11px; }
.empty { margin: auto; padding: 30px; max-width: 420px; text-align: center; color: var(--muted); }
.empty strong { display: block; margin-bottom: 8px; font-weight: 500; color: var(--text); }
.empty button { margin-top: 14px; }
/* Only the fixed panel box follows the viewport. Everything inside follows the panel width. */
@media (max-width: 650px) {
  .panel { left: 6px; right: 6px; bottom: 6px; max-height: calc(100dvh - 12px); }
}
@container (max-width: 650px) {
  .header { gap: 8px; padding: 4px 10px; }
  .label, .session { display: none; }
  .body { grid-template-columns: minmax(0, 1fr); grid-template-rows: 110px minmax(0, 1fr); }
  .channels { border-right: 0; border-bottom: 1px solid var(--border); }
  /* No room for the channel column at phone width. It is still in the sidebar and the expanded context. */
  .event summary { grid-template-columns: 82px 90px minmax(0, 1fr) 10px; gap: 6px; padding: 7px 9px; }
  .event-channel { display: none; }
}
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation: none !important; transition: none !important; }
}
`;
