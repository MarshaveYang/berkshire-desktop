import { create } from "zustand";

export interface SkillPublic {
  id: string;
  name: string;
  subtitle: string;
  icon: string;
  argHint: string;
  usageHint: string;
  supportsMulti: boolean;
  description: string;
}

export interface ReportSummary {
  id: string;
  skill_id: string;
  skill_name: string;
  ticker: string;
  title: string;
  status: "pending" | "running" | "done" | "error";
  provider: string;
  model: string;
  tokens_input: number;
  tokens_output: number;
  created_at: string;
  updated_at: string;
}

export type WindowKind = "reportsFolder" | "skillInfo" | "reportViewer";

export interface OpenWindow {
  id: string; // 唯一 key，比如 `report-${reportId}` / `skill-${skillId}` / 'reportsFolder'
  kind: WindowKind;
  title: string;
  payload?: any;
  zIndex: number;
}

interface AppState {
  authenticated: boolean | null; // null = 还没检查过
  setAuthenticated: (v: boolean) => void;

  skills: SkillPublic[];
  setSkills: (s: SkillPublic[]) => void;

  activeSkillId: string | null;
  setActiveSkillId: (id: string) => void;

  reports: ReportSummary[];
  setReports: (r: ReportSummary[]) => void;
  upsertReport: (r: ReportSummary) => void;

  windows: OpenWindow[];
  topZ: number;
  openWindow: (w: Omit<OpenWindow, "zIndex">) => void;
  closeWindow: (id: string) => void;
  focusWindow: (id: string) => void;

  generating: boolean;
  setGenerating: (v: boolean) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  authenticated: null,
  setAuthenticated: (v) => set({ authenticated: v }),

  skills: [],
  setSkills: (s) => set({ skills: s }),

  activeSkillId: null,
  setActiveSkillId: (id) => set({ activeSkillId: id }),

  reports: [],
  setReports: (r) => set({ reports: r }),
  upsertReport: (r) =>
    set((state) => {
      const idx = state.reports.findIndex((x) => x.id === r.id);
      if (idx === -1) return { reports: [r, ...state.reports] };
      const next = [...state.reports];
      next[idx] = r;
      return { reports: next };
    }),

  windows: [],
  topZ: 10,
  openWindow: (w) =>
    set((state) => {
      const exists = state.windows.find((x) => x.id === w.id);
      const nextZ = state.topZ + 1;
      if (exists) {
        return {
          topZ: nextZ,
          windows: state.windows.map((x) =>
            x.id === w.id ? { ...x, ...w, zIndex: nextZ } : x
          )
        };
      }
      return { topZ: nextZ, windows: [...state.windows, { ...w, zIndex: nextZ }] };
    }),
  closeWindow: (id) => set((state) => ({ windows: state.windows.filter((w) => w.id !== id) })),
  focusWindow: (id) =>
    set((state) => {
      const nextZ = state.topZ + 1;
      return {
        topZ: nextZ,
        windows: state.windows.map((w) => (w.id === id ? { ...w, zIndex: nextZ } : w))
      };
    }),

  generating: false,
  setGenerating: (v) => set({ generating: v })
}));
