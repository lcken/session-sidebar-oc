/**
 * Session Sidebar Event Handler
 * 
 * Forwards session-related events to the TUI plugin for real-time updates.
 */
import type { Plugin } from "@opencode-ai/plugin";

const TRACKED_EVENTS = [
  "permission.asked",
  "permission.replied",
  "question.asked",
  "question.replied",
  "session.status",
  "session.idle",
] as const;

const plugin: Plugin = async () => {
  return {
    event: async ({ event }) => {
      if (TRACKED_EVENTS.includes(event.type as typeof TRACKED_EVENTS[number])) {
        (globalThis as any).__sessionSidebarVersion = ((globalThis as any).__sessionSidebarVersion ?? 0) + 1;
      }
    },
  };
};

export default plugin;
