/**
 * Session Sidebar Plugin for OpenCode TUI
 * 
 * Displays a list of sessions in the sidebar with real-time status indicators:
 * - ? (yellow) - Needs interaction (pending permission/question)
 * - ● (green)  - Busy (task running)
 * - ✓ (blue)   - Completed (task finished, awaiting user acknowledgment)
 * - ○ (gray)   - Idle
 * 
 * Current session is highlighted with yellow background.
 * Click to switch sessions.
 */
/** @jsxImportSource @opentui/solid */
import type { TuiPlugin, TuiPluginApi } from "@opencode-ai/plugin/tui";
import { createSignal, For, onMount, onCleanup } from "solid-js";

interface SessionInfo {
  id: string;
  title: string;
  updated: number;
}

async function fetchSessionList(): Promise<SessionInfo[]> {
  const proc = Bun.spawn(
    ["opencode", "session", "list", "--format", "json", "-n", "20"],
    { stdout: "pipe", stderr: "pipe" }
  );
  const output = await new Response(proc.stdout).text();
  if (!output.trim()) return [];
  try {
    return JSON.parse(output) as SessionInfo[];
  } catch {
    return [];
  }
}

function formatRelativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days}d`;
  if (hours > 0) return `${hours}h`;
  if (minutes > 0) return `${minutes}m`;
  return "now";
}

function SessionListView(props: { api: TuiPluginApi; session_id: string }) {
  const [sessions, setSessions] = createSignal<SessionInfo[]>([]);
  const [currentId, setCurrentId] = createSignal<string>(props.session_id);
  const [tick, setTick] = createSignal(0);
  const [completedSessions, setCompletedSessions] = createSignal<Set<string>>(new Set());
  const theme = () => props.api.theme.current;

  onMount(async () => {
    setSessions(await fetchSessionList());
    
    const rerender = () => setTick(t => t + 1);
    
    const handleStatusChange = (data: unknown) => {
      const d = data as { status?: { type?: string }; session_id?: string };
      if (d?.status?.type === "idle" && d?.session_id) {
        setCompletedSessions(prev => new Set(prev).add(d.session_id!));
      }
      rerender();
    };
    
    const subscriptions = [
      props.api.event.on("session.status" as any, handleStatusChange),
      props.api.event.on("permission.asked" as any, rerender),
      props.api.event.on("permission.replied" as any, rerender),
      props.api.event.on("question.asked" as any, rerender),
      props.api.event.on("question.replied" as any, rerender),
    ];
    
    onCleanup(() => subscriptions.forEach(unsub => unsub()));
  });

  const getSessionStatus = (sessionId: string) => {
    const status = props.api.state.session.status(sessionId);
    const permissions = props.api.state.session.permission(sessionId);
    const questions = props.api.state.session.question(sessionId);
    const needsInteraction = (permissions?.length ?? 0) > 0 || (questions?.length ?? 0) > 0;
    const isCompleted = completedSessions().has(sessionId);
    
    return { status, needsInteraction, isCompleted };
  };

  const getStatusIndicator = (sessionId: string): { symbol: string; color: string } => {
    tick();
    const isActive = sessionId === currentId();
    
    if (isActive) {
      return { symbol: "●", color: theme().text };
    }
    
    const { status, needsInteraction, isCompleted } = getSessionStatus(sessionId);
    
    if (needsInteraction) return { symbol: "?", color: theme().warning };
    if (status?.type === "busy") return { symbol: "●", color: theme().success };
    if (isCompleted) return { symbol: "✓", color: theme().info };
    return { symbol: "○", color: theme().textMuted };
  };

  const handleSessionClick = (sessionId: string) => {
    setCurrentId(sessionId);
    setCompletedSessions(prev => {
      const next = new Set(prev);
      next.delete(sessionId);
      return next;
    });
    props.api.route.navigate("session", { sessionID: sessionId });
  };

  return (
    <box>
      <box flexDirection="row" gap={1}>
        <text fg={theme().text}><b>Sessions</b></text>
      </box>
      <For each={sessions()}>
        {(session) => {
          const title = session.title?.slice(0, 22) || "Untitled";
          const isActive = session.id === currentId();
          const indicator = getStatusIndicator(session.id);
          
          return (
            <box 
              flexDirection="row" 
              gap={1}
              paddingLeft={1}
              bg={isActive ? theme().warning : undefined}
              onMouseDown={() => handleSessionClick(session.id)}
            >
              <text fg={indicator.color}>{indicator.symbol}</text>
              <text fg={isActive ? theme().text : theme().textMuted}>
                {isActive ? <b>{title}</b> : title}
              </text>
              <text fg={isActive ? theme().text : theme().textMuted}>
                {formatRelativeTime(session.updated)}
              </text>
            </box>
          );
        }}
      </For>
    </box>
  );
}

const tui: TuiPlugin = async (api) => {
  api.slots.register({
    id: "session-sidebar",
    slots: {
      sidebar_content(_ctx: unknown, props: { session_id: string }) {
        return <SessionListView api={api} session_id={props.session_id} />;
      },
    },
  });
};

export default { id: "session-sidebar", tui };
