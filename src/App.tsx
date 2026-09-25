import React, { useState, useEffect } from "react";
import {
  SportType,
  GameMode,
  MatchSettings as SettingsType,
  MatchHistoryEntry,
  SetScore,
  ScheduledMatch,
  ScheduleStatus,
} from "./types";
import { MatchSettings } from "./components/MatchSettings";
import { ScoreBoard } from "./components/ScoreBoard";
import { HistoryList } from "./components/HistoryList";
import { RulesInfo } from "./components/RulesInfo";
import { ThemeToggle } from "./components/ThemeToggle";
import { MatchSchedule, defaultScheduleItems } from "./components/MatchSchedule";
import { AppLogo } from "./components/AppLogo";
import { Calendar, BookOpen, Settings, BarChart2, Activity, Clock } from "lucide-react";

export default function App() {
  const [activeTab, setActiveTab] = useState<"setup" | "schedule" | "history" | "rules">("setup");
  const [activeMatch, setActiveMatch] = useState<SettingsType | null>(null);
  const [activeScheduleId, setActiveScheduleId] = useState<string | null>(null);
  const [matchHistory, setMatchHistory] = useState<MatchHistoryEntry[]>([]);
  const [schedules, setSchedules] = useState<ScheduledMatch[]>([]);

  // Load history & schedules from local storage on mount
  useEffect(() => {
    try {
      const storedHistory = localStorage.getItem("sports_scoreboard_history");
      if (storedHistory) {
        const parsedHistory = JSON.parse(storedHistory);
        if (Array.isArray(parsedHistory)) {
          const filtered = parsedHistory.filter((m) => m.sport !== SportType.BADMINTON);
          setMatchHistory(filtered);
        }
      }
    } catch (e) {
      console.error("Failed to load match history from localStorage:", e);
    }

    try {
      const storedSchedules = localStorage.getItem("sports_scoreboard_schedules");
      if (storedSchedules) {
        const parsed = JSON.parse(storedSchedules);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const filtered = parsed.filter((item) => item.sport !== SportType.BADMINTON);
          if (filtered.length > 0) {
            setSchedules(filtered);
          } else {
            initDefaultSchedules();
          }
        } else {
          initDefaultSchedules();
        }
      } else {
        initDefaultSchedules();
      }
    } catch (e) {
      console.error("Failed to load match schedules from localStorage:", e);
      initDefaultSchedules();
    }
  }, []);

  const initDefaultSchedules = () => {
    const initial: ScheduledMatch[] = defaultScheduleItems.map((item, idx) => ({
      ...item,
      id: `sched_init_${idx + 1}_${Date.now()}`,
    }));
    setSchedules(initial);
    try {
      localStorage.setItem("sports_scoreboard_schedules", JSON.stringify(initial));
    } catch (e) {
      console.error("Failed to save initial schedules:", e);
    }
  };

  // Save history to local storage
  const saveHistory = (newHistory: MatchHistoryEntry[]) => {
    setMatchHistory(newHistory);
    try {
      localStorage.setItem("sports_scoreboard_history", JSON.stringify(newHistory));
    } catch (e) {
      console.error("Failed to save match history to localStorage:", e);
    }
  };

  // Save schedules to local storage
  const saveSchedules = (newSchedules: ScheduledMatch[]) => {
    setSchedules(newSchedules);
    try {
      localStorage.setItem("sports_scoreboard_schedules", JSON.stringify(newSchedules));
    } catch (e) {
      console.error("Failed to save match schedules to localStorage:", e);
    }
  };

  // Schedule Management Handlers
  const handleAddSchedule = (scheduleData: Omit<ScheduledMatch, "id">) => {
    const newSchedule: ScheduledMatch = {
      ...scheduleData,
      id: `sched_${Date.now()}_${Math.random().toString(36).substr(2, 7)}`,
    };
    const updated = [newSchedule, ...schedules];
    saveSchedules(updated);
  };

  const handleUpdateSchedule = (updatedSchedule: ScheduledMatch) => {
    const updated = schedules.map((item) =>
      item.id === updatedSchedule.id ? updatedSchedule : item
    );
    saveSchedules(updated);
  };

  const handleDeleteSchedule = (id: string) => {
    const updated = schedules.filter((item) => item.id !== id);
    saveSchedules(updated);
  };

  const handleResetDefaultSchedules = () => {
    initDefaultSchedules();
  };

  // Start match directly from schedule
  const handleStartMatchFromSchedule = (scheduledMatch: ScheduledMatch) => {
    // Mark as in-progress in schedule
    const updated = schedules.map((item) =>
      item.id === scheduledMatch.id
        ? { ...item, status: ScheduleStatus.IN_PROGRESS }
        : item
    );
    saveSchedules(updated);

    setActiveScheduleId(scheduledMatch.id);

    const settings: SettingsType = {
      sport: scheduledMatch.sport,
      mode: scheduledMatch.mode,
      targetPoints: scheduledMatch.targetPoints,
      bestOfSets: scheduledMatch.bestOfSets,
      deuceEnabled: scheduledMatch.deuceEnabled,
      deuceMaxPoints: 99,
      customNames: true,
      playerNames: scheduledMatch.playerNames,
    };

    setActiveMatch(settings);
  };

  // Handle Starting a Match manually
  const handleStartMatch = (settings: SettingsType) => {
    setActiveScheduleId(null);
    setActiveMatch(settings);
  };

  // Handle Completing a Match
  const handleFinishMatch = (result: {
    sets: SetScore[];
    winner: "A" | "B";
    durationSeconds: number;
    playerNames?: { teamA: string[]; teamB: string[] };
  }) => {
    if (!activeMatch) return;

    const newEntry: MatchHistoryEntry = {
      id: `match_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      date: new Date().toISOString(),
      sport: activeMatch.sport,
      mode: activeMatch.mode,
      playerNames: result.playerNames || activeMatch.playerNames,
      sets: result.sets,
      winner: result.winner,
      durationSeconds: result.durationSeconds,
    };

    const updatedHistory = [newEntry, ...matchHistory];
    saveHistory(updatedHistory);

    // If match was linked to a schedule, mark that schedule as COMPLETED
    if (activeScheduleId) {
      const updatedSchedules = schedules.map((s) =>
        s.id === activeScheduleId ? { ...s, status: ScheduleStatus.COMPLETED } : s
      );
      saveSchedules(updatedSchedules);
      setActiveScheduleId(null);
    }

    setActiveMatch(null);
    setActiveTab("history"); // Redirect to history to view the completed card!
  };

  // Delete Individual Entry
  const handleDeleteEntry = (id: string) => {
    const updated = matchHistory.filter((entry) => entry.id !== id);
    saveHistory(updated);
  };

  // Clear All Entries
  const handleClearAllHistory = () => {
    saveHistory([]);
  };

  // Statistics Calculation
  const totalMatches = matchHistory.length;
  const singlesCount = matchHistory.filter((m) => m.mode === GameMode.SINGLES).length;
  const doublesCount = matchHistory.filter((m) => m.mode === GameMode.DOUBLES).length;
  const upcomingSchedulesCount = schedules.filter(
    (s) => s.status === ScheduleStatus.UPCOMING || s.status === ScheduleStatus.IN_PROGRESS
  ).length;

  return (
    <div
      id="app-root"
      className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 font-sans selection:bg-violet-500/30 selection:text-violet-900 dark:selection:text-violet-200 transition-colors duration-200 relative overflow-x-hidden"
    >
      {/* BACKGROUND DECORATIVE GLOW */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/10 dark:bg-indigo-500/5 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-violet-500/10 dark:bg-violet-500/5 rounded-full blur-3xl pointer-events-none"></div>

      {/* MAIN CONTAINER */}
      <div className="relative max-w-5xl mx-auto px-4 py-6 sm:py-8 sm:px-6 lg:px-8">
        {/* APP HEADER */}
        {!activeMatch && (
          <header className="mb-8 text-center sm:text-left flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 dark:border-slate-900 pb-6">
            <div className="flex items-center justify-center sm:justify-start gap-3">
              <AppLogo size="lg" />
              <div>
                <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
                  ScoreArena
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-mono">
                  Pencatat Skor Tenis Meja Profesional • ITTF
                </p>
              </div>
            </div>

            {/* Header Actions: Navigation Tabs & Theme Toggle */}
            <div className="flex flex-wrap items-center justify-center sm:justify-end gap-2.5">
              <nav className="flex bg-white/90 dark:bg-slate-900/60 p-1 rounded-xl border border-slate-200 dark:border-slate-800/80 shadow-sm dark:shadow-none">
                <button
                  onClick={() => setActiveTab("setup")}
                  className={`flex items-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    activeTab === "setup"
                      ? "bg-slate-100 dark:bg-slate-800 text-slate-950 dark:text-white shadow-sm font-bold"
                      : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  <Settings className="w-3.5 h-3.5" />
                  Skor Baru
                </button>
                <button
                  onClick={() => setActiveTab("schedule")}
                  className={`flex items-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    activeTab === "schedule"
                      ? "bg-slate-100 dark:bg-slate-800 text-slate-950 dark:text-white shadow-sm font-bold"
                      : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  Jadwal
                  {upcomingSchedulesCount > 0 && (
                    <span className="ml-1 px-1.5 py-0.2 bg-amber-500 text-slate-950 font-black text-[9px] rounded-full">
                      {upcomingSchedulesCount}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setActiveTab("history")}
                  className={`flex items-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    activeTab === "history"
                      ? "bg-slate-100 dark:bg-slate-800 text-slate-950 dark:text-white shadow-sm font-bold"
                      : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5" />
                  Riwayat
                  {totalMatches > 0 && (
                    <span className="ml-1 px-1.5 py-0.2 bg-violet-500 text-white dark:text-slate-950 font-black text-[9px] rounded-full">
                      {totalMatches}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setActiveTab("rules")}
                  className={`flex items-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    activeTab === "rules"
                      ? "bg-slate-100 dark:bg-slate-800 text-slate-950 dark:text-white shadow-sm font-bold"
                      : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  Aturan
                </button>
              </nav>

              {/* Theme Switcher in Main Header */}
              <ThemeToggle variant="default" />
            </div>
          </header>
        )}

        {/* ACTIVE LIVE MATCH OVERLAY MODE */}
        {activeMatch ? (
          <div className="animate-fadeIn">
            <ScoreBoard
              settings={activeMatch}
              onFinishMatch={handleFinishMatch}
              onExit={() => setActiveMatch(null)}
            />
          </div>
        ) : (
          /* STANDARD DASHBOARD TABS */
          <main className="space-y-6">
            {/* Summary Statistics Panel (Only on main setup page) */}
            {activeTab === "setup" && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 bg-white/80 dark:bg-slate-900/20 border border-slate-200 dark:border-slate-900 p-4 rounded-2xl shadow-sm dark:shadow-none">
                {/* Total games */}
                <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-200/80 dark:border-slate-800/40">
                  <div className="p-2 bg-violet-500/10 text-violet-600 dark:text-violet-400 rounded-lg">
                    <BarChart2 className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 font-bold font-mono uppercase">Total Sesi</p>
                    <p className="text-sm font-extrabold text-slate-900 dark:text-white font-mono">{totalMatches} Game</p>
                  </div>
                </div>

                {/* Kategori Tunggal */}
                <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-200/80 dark:border-slate-800/40">
                  <div className="p-2 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 rounded-lg">
                    <span className="text-sm">👤</span>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 font-bold font-mono uppercase">Tunggal (1v1)</p>
                    <p className="text-sm font-extrabold text-slate-900 dark:text-white font-mono">{singlesCount} Sesi</p>
                  </div>
                </div>

                {/* Kategori Ganda */}
                <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-200/80 dark:border-slate-800/40">
                  <div className="p-2 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-lg">
                    <span className="text-sm">👥</span>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 font-bold font-mono uppercase">Ganda (2v2)</p>
                    <p className="text-sm font-extrabold text-slate-900 dark:text-white font-mono">{doublesCount} Sesi</p>
                  </div>
                </div>

                {/* Jadwal Terdaftar */}
                <button
                  onClick={() => setActiveTab("schedule")}
                  className="flex items-center gap-3 p-3 bg-amber-500/5 hover:bg-amber-500/10 dark:bg-amber-500/10 dark:hover:bg-amber-500/15 rounded-xl border border-amber-500/20 text-left transition-colors cursor-pointer"
                >
                  <div className="p-2 bg-amber-500/15 text-amber-600 dark:text-amber-400 rounded-lg">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[10px] text-amber-700 dark:text-amber-400 font-bold font-mono uppercase">Jadwal Main</p>
                    <p className="text-sm font-extrabold text-slate-900 dark:text-white font-mono flex items-center gap-1">
                      <span>{upcomingSchedulesCount} Agenda</span>
                      <span className="text-[10px] font-normal text-amber-600 underline ml-0.5">Lihat &rarr;</span>
                    </p>
                  </div>
                </button>
              </div>
            )}

            {/* TAB CONTENTS */}
            <div className="animate-fadeIn">
              {activeTab === "setup" && (
                <div className="space-y-6">
                  {/* Active Setup card */}
                  <div className="bg-white/90 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-2xl backdrop-blur-sm">
                    <div className="max-w-md mx-auto text-center mb-6 space-y-1">
                      <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Mulai Pertandingan Baru</h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Atur preferensi permainan, klik mulai, dan gunakan layar sebagai papan skor langsung.</p>
                    </div>
                    <MatchSettings onStartMatch={handleStartMatch} />
                  </div>
                </div>
              )}

              {activeTab === "schedule" && (
                <MatchSchedule
                  schedules={schedules}
                  onAddSchedule={handleAddSchedule}
                  onUpdateSchedule={handleUpdateSchedule}
                  onDeleteSchedule={handleDeleteSchedule}
                  onResetDefaultSchedules={handleResetDefaultSchedules}
                  onStartMatchFromSchedule={handleStartMatchFromSchedule}
                />
              )}

              {activeTab === "history" && (
                <HistoryList
                  history={matchHistory}
                  onDeleteEntry={handleDeleteEntry}
                  onClearAll={handleClearAllHistory}
                />
              )}

              {activeTab === "rules" && <RulesInfo />}
            </div>
          </main>
        )}

        {/* GLOBAL APP FOOTER */}
        {!activeMatch && (
          <footer className="mt-16 pt-6 border-t border-slate-200 dark:border-slate-900 text-center text-[11px] text-slate-500 font-mono">
            <p>ScoreArena • Aplikasi Papan Skor Digital Tenis Meja</p>
            <p className="mt-1 text-slate-400 dark:text-slate-600">Disimpan secara lokal di browser Anda • Mendukung pengumuman suara & switch tema terang/gelap</p>
          </footer>
        )}
      </div>
    </div>
  );
}

