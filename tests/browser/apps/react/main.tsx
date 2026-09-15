import {
  StrictMode,
  useActionState,
  useEffect,
  useMemo,
  useState,
} from "react";
import { createRoot } from "react-dom/client";
import type { ClientEvents, SubscriptionEvents } from "centrifuge";
import { useCentrifuge } from "simulcast-centrifugo/react";
import { SimulcastDevtools } from "simulcast-devtools/react";
import {
  RealtimeProvider,
  useChannel,
  useChannelStatus,
  useConnectionState,
} from "simulcast-react";
import { createClient } from "../../shared/createClient";
import { inspect } from "../../shared/inspection";
import "../../shared/styles.css";

const parameters = new URLSearchParams(location.search);
const initialUser = parameters.get("user") ?? "browser-test";
const isPlayground = parameters.has("devtools");
const scenarios = [
  { label: "Happy path", flags: [] },
  { label: "Token refresh", flags: ["refresh"] },
  { label: "Invalid token", flags: ["invalid"] },
];
const activeFlags = ["refresh", "invalid"].filter((flag) =>
  parameters.has(flag),
);
const isCurrentScenario = (flags: string[]) =>
  flags.length === activeFlags.length &&
  flags.every((flag) => activeFlags.includes(flag));
const scenarioHref = (user: string, flags: string[]) => {
  const next = new URLSearchParams({ devtools: "", user });
  for (const flag of flags) {
    next.set(flag, "");
  }
  return `?${next.toString().replaceAll("=&", "&").replace(/=$/, "")}`;
};
const Publisher = ({ user }: { user: string }) => {
  const [result, publish, pending] = useActionState(
    async (_previous: string, form: FormData) => {
      const text = form.get("message");
      const channel = form.get("channel");

      if (typeof text !== "string" || text.trim() === "") {
        return "Enter a message first.";
      }

      return fetch("/test-api/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channel, data: { text } }),
      })
        .then((response) => {
          if (!response.ok) {
            return "The local server could not publish this message.";
          }

          return "Published. Both consumers receive the same message.";
        })
        .catch(() => "The local server is unavailable.");
    },
    "",
  );

  return (
    <form action={publish}>
      <label>
        Test message{" "}
        <input
          name="message"
          defaultValue="Hello from the realtime playground"
          required
        />
      </label>
      <label>
        Channel{" "}
        <select name="channel">
          <option value={`private:${user}`}>private:{user}</option>
          <option value={`private:${user}-alerts`}>
            private:{user}-alerts
          </option>
        </select>
      </label>
      <button type="submit" disabled={pending}>
        {pending ? "Publishing…" : "Publish message"}
      </button>
      <p role="status">{result}</p>
    </form>
  );
};

const Consumer = ({ channel, name }: { channel: string; name: string }) => {
  const [messages, setMessages] = useState<string[]>([]);
  useChannel<{ text: string }>(channel, (message) =>
    setMessages((previous) => [...previous, message.text]),
  );
  return <output data-testid={name}>{JSON.stringify(messages)}</output>;
};

const Session = ({ user }: { user: string }) => {
  const channel = `private:${user}`;
  const [first, setFirst] = useState(true);
  const [second, setSecond] = useState(true);
  const [alerts, setAlerts] = useState(false);
  const [recoveries, setRecoveries] = useState<
    Array<{ wasRecovering: boolean; recovered: boolean }>
  >([]);
  const [error, setError] = useState("");
  const connection = useConnectionState();
  const status = useChannelStatus(channel);
  const client = useCentrifuge();

  useEffect(() => {
    if (client === null) return;
    const handleDisconnected: ClientEvents["disconnected"] = ({ reason }) =>
      setError(reason);
    client.on("disconnected", handleDisconnected);
    return () => {
      client.off("disconnected", handleDisconnected);
    };
  }, [client]);

  // Recovery metadata lives on the native subscription the core opened for this channel.
  useEffect(() => {
    if (client === null) return;
    if (status.state === "detached") return;
    const subscription = client.getSubscription(channel);
    if (subscription === null) return;
    const handleSubscribed: SubscriptionEvents["subscribed"] = ({
      wasRecovering,
      recovered,
    }) => {
      setRecoveries((previous) => [...previous, { wasRecovering, recovered }]);
    };
    subscription.on("subscribed", handleSubscribed);
    return () => {
      subscription.off("subscribed", handleSubscribed);
    };
  }, [client, channel, status.state]);

  return (
    <section>
      <output data-testid="connection">{connection}</output>
      <output data-testid="channel">{status.state}</output>
      <output data-testid="client">
        {client === null ? "inactive" : "active"}
      </output>
      <output data-testid="error">{error}</output>
      <output data-testid="recoveries">{JSON.stringify(recoveries)}</output>
      <label>
        <input
          type="checkbox"
          checked={first}
          onChange={(event) => setFirst(event.target.checked)}
        />
        First consumer
      </label>
      <label>
        <input
          type="checkbox"
          checked={second}
          onChange={(event) => setSecond(event.target.checked)}
        />
        Second consumer
      </label>
      {isPlayground ? (
        <label>
          <input
            type="checkbox"
            checked={alerts}
            onChange={(event) => setAlerts(event.target.checked)}
          />
          Alerts channel
        </label>
      ) : null}
      {first ? <Consumer channel={channel} name="first" /> : null}
      {second ? <Consumer channel={channel} name="second" /> : null}
      {alerts ? <Consumer channel={`${channel}-alerts`} name="alerts" /> : null}
    </section>
  );
};

const Application = () => {
  const [user, setUser] = useState(initialUser);
  const [enabled, setEnabled] = useState(true);
  const [mounted, setMounted] = useState(true);
  const [diagnostics, setDiagnostics] = useState("");
  const client = useMemo(() => createClient(user), [user]);
  return (
    <main className={isPlayground ? "playground" : undefined}>
      <header>
        <h1>
          {isPlayground ? "Simulcast playground" : "Simulcast browser tests"}
        </h1>
        {isPlayground ? (
          <nav aria-label="Scenarios">
            {scenarios.map((scenario) => (
              <a
                key={scenario.label}
                href={scenarioHref(user, scenario.flags)}
                aria-current={
                  isCurrentScenario(scenario.flags) ? "page" : undefined
                }
              >
                {scenario.label}
              </a>
            ))}
          </nav>
        ) : null}
      </header>
      {isPlayground ? <Publisher user={user} /> : null}
      <label>
        User
        <input
          aria-label="User"
          value={user}
          onChange={(event) => setUser(event.target.value)}
        />
      </label>
      <label>
        <input
          type="checkbox"
          checked={enabled}
          onChange={(event) => setEnabled(event.target.checked)}
        />
        Session enabled
      </label>
      <label>
        <input
          type="checkbox"
          checked={mounted}
          onChange={(event) => setMounted(event.target.checked)}
        />
        Provider mounted
      </label>
      <button onClick={() => setDiagnostics(inspect())}>
        Inspect resources
      </button>
      <output data-testid="diagnostics">{diagnostics}</output>
      {mounted ? (
        <RealtimeProvider client={client} session={{ enabled }}>
          <Session user={user} />
          {isPlayground ? (
            <SimulcastDevtools initialIsOpen maxEvents={100} />
          ) : null}
        </RealtimeProvider>
      ) : null}
    </main>
  );
};

const root = document.getElementById("root");
if (root === null) throw new Error("Missing test app root");
createRoot(root).render(
  <StrictMode>
    <Application />
  </StrictMode>,
);
