import { Show, createMemo, createSignal } from "solid-js";
import { RealtimeProvider } from "@priemskiyyy/simulcast-solid";
import { createClient } from "../../shared/createClient";
import { inspect } from "../../shared/inspection";
import { Session } from "./Session";
import "../../shared/styles.css";

export const Application = () => {
  const [user, setUser] = createSignal(
    new URLSearchParams(location.search).get("user") ?? "browser-test",
  );
  const [enabled, setEnabled] = createSignal(true);
  const [mounted, setMounted] = createSignal(true);
  const [diagnostics, setDiagnostics] = createSignal("");
  const client = createMemo(() => createClient(user()));

  return (
    <main>
      <header>
        <h1>Simulcast browser tests</h1>
      </header>
      <label>
        User
        <input
          aria-label="User"
          value={user()}
          onInput={(event) => setUser(event.currentTarget.value)}
        />
      </label>
      <label>
        <input
          type="checkbox"
          checked={enabled()}
          onChange={(event) => setEnabled(event.currentTarget.checked)}
        />
        Session enabled
      </label>
      <label>
        <input
          type="checkbox"
          checked={mounted()}
          onChange={(event) => setMounted(event.currentTarget.checked)}
        />
        Provider mounted
      </label>
      <button type="button" onClick={() => setDiagnostics(inspect())}>
        Inspect resources
      </button>
      <output data-testid="diagnostics">{diagnostics()}</output>
      <Show when={mounted()}>
        <RealtimeProvider client={client()} session={{ enabled: enabled() }}>
          <Session user={user()} />
        </RealtimeProvider>
      </Show>
    </main>
  );
};
