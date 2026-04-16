#!/usr/bin/env bun
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "fs";
import { homedir } from "os";
import { join } from "path";

const CONFIG_DIR = join(homedir(), ".config", "opencode");
const TUI_CONFIG = join(CONFIG_DIR, "tui.json");
const OPENCODE_CONFIG = join(CONFIG_DIR, "opencode.json");
const PLUGIN_NAME = "@lcken/session-sidebar-oc";

function readJson(path: string): Record<string, unknown> {
  if (!existsSync(path)) return {};
  try {
    return JSON.parse(readFileSync(path, "utf-8"));
  } catch {
    return {};
  }
}

function writeJson(path: string, data: Record<string, unknown>) {
  if (!existsSync(CONFIG_DIR)) {
    mkdirSync(CONFIG_DIR, { recursive: true });
  }
  writeFileSync(path, JSON.stringify(data, null, 2) + "\n");
}

function install() {
  console.log("Installing @lcken/session-sidebar-oc...\n");
  
  const tui = readJson(TUI_CONFIG);
  tui.plugins = tui.plugins || {};
  (tui.plugins as Record<string, unknown>)["session-sidebar"] = {
    source: `node_modules/${PLUGIN_NAME}/dist/tui.js`
  };
  writeJson(TUI_CONFIG, tui);
  console.log("✓ Updated ~/.config/opencode/tui.json");
  
  const opencode = readJson(OPENCODE_CONFIG);
  opencode.plugins = opencode.plugins || {};
  (opencode.plugins as Record<string, unknown>)["session-sidebar-events"] = {
    source: `node_modules/${PLUGIN_NAME}/dist/index.js`
  };
  writeJson(OPENCODE_CONFIG, opencode);
  console.log("✓ Updated ~/.config/opencode/opencode.json");
  
  console.log("\n✅ Done! Restart OpenCode to see the session sidebar.");
}

function uninstall() {
  console.log("Uninstalling @lcken/session-sidebar-oc...\n");
  
  const tui = readJson(TUI_CONFIG);
  if ((tui.plugins as Record<string, unknown>)?.["session-sidebar"]) {
    delete (tui.plugins as Record<string, unknown>)["session-sidebar"];
    writeJson(TUI_CONFIG, tui);
    console.log("✓ Removed from ~/.config/opencode/tui.json");
  }
  
  const opencode = readJson(OPENCODE_CONFIG);
  if ((opencode.plugins as Record<string, unknown>)?.["session-sidebar-events"]) {
    delete (opencode.plugins as Record<string, unknown>)["session-sidebar-events"];
    writeJson(OPENCODE_CONFIG, opencode);
    console.log("✓ Removed from ~/.config/opencode/opencode.json");
  }
  
  console.log("\n✅ Done!");
}

const [command] = process.argv.slice(2);

switch (command) {
  case "install":
  case undefined:
    install();
    break;
  case "uninstall":
    uninstall();
    break;
  default:
    console.log(`
Usage:
  bunx @lcken/session-sidebar-oc install    Install plugin
  bunx @lcken/session-sidebar-oc uninstall  Uninstall plugin
`);
}
