import React, { useState, useEffect } from "react";
import { SportType, GameMode, MatchSettings as SettingsType, PlayerNames } from "../types";
import { Play, Settings2, Users, User, CircleHelp, Info, ChevronDown, Layers } from "lucide-react";
import { playSound } from "../utils/audio";

interface MatchSettingsProps {
  onStartMatch: (settings: SettingsType) => void;
}

export const MatchSettings: React.FC<MatchSettingsProps> = ({ onStartMatch }) => {
  const [sport, setSport] = useState<SportType>(SportType.TABLE_TENNIS);
  const [mode, setMode] = useState<GameMode>(GameMode.SINGLES);
  const [bestOfSets, setBestOfSets] = useState<number>(3);
  const [customNames, setCustomNames] = useState<boolean>(false);
  const [targetPoints, setTargetPoints] = useState<number>(11);
  const [deuceEnabled, setDeuceEnabled] = useState<boolean>(true);
  const [deuceMaxPoints, setDeuceMaxPoints] = useState<number>(99);

  // Player Names State
  const [playerA1, setPlayerA1] = useState("Pemain A1");
  const [playerA2, setPlayerA2] = useState("Pemain A2");
  const [playerB1, setPlayerB1] = useState("Pemain B1");
  const [playerB2, setPlayerB2] = useState("Pemain B2");
  const [teamAName, setTeamAName] = useState("TIM A");
  const [teamBName, setTeamBName] = useState("TIM B");

  // Sync default target points when sport changes
  useEffect(() => {
    setTargetPoints(11);
    setDeuceMaxPoints(99); // No practical limit for Table Tennis
  }, [sport]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Prepare Player Names
    let teamA: string[] = [];
    let teamB: string[] = [];

    if (customNames) {
      if (mode === GameMode.SINGLES) {
        teamA = [playerA1.trim() || "Pemain A"];
        teamB = [playerB1.trim() || "Pemain B"];
      } else {
        teamA = [playerA1.trim() || "Pemain A1", playerA2.trim() || "Pemain A2"];
        teamB = [playerB1.trim() || "Pemain B1", playerB2.trim() || "Pemain B2"];
      }
    } else {
      if (mode === GameMode.SINGLES) {
        teamA = ["Tim A"];
        teamB = ["Tim B"];
      } else {
        teamA = ["Tim A1", "Tim A2"];
        teamB = ["Tim B1", "Tim B2"];
      }
    }

    const settings: SettingsType = {
      sport,
      mode,
      targetPoints,
      bestOfSets,
      deuceEnabled,
      deuceMaxPoints,
      customNames,
      playerNames: {
        teamA,
        teamB,
        teamAName: customNames ? (teamAName.trim() || "TIM A") : "TIM A",
        teamBName: customNames ? (teamBName.trim() || "TIM B") : "TIM B",
      },
    };

    // Play sport whistle start sound
    playSound("whistle");
    onStartMatch(settings);
  };

  return (
    <form
      id="match-settings-form"
      onSubmit={handleSubmit}
      className="space-y-6 max-w-2xl mx-auto"
    >
      {/* PENGATURAN UTAMA: DROPDOWN CABANG OLAHRAGA, KATEGORI, DAN JUMLAH GAME */}
      <div className="bg-white dark:bg-slate-900/40 p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-violet-500/10 text-violet-600 dark:text-violet-400 rounded-lg">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">Format & Kategori Pertandingan</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Pilih cabang olahraga, kategori tanding, dan jumlah game melalui menu dropdown</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* 1. Dropdown Pilihan Cabang Olahraga */}
          <div className="space-y-1.5">
            <label
              htmlFor="sport-select-dropdown"
              className="text-xs font-bold text-slate-700 dark:text-slate-300 font-mono tracking-wider uppercase flex items-center justify-between"
            >
              <span>Cabang Olahraga</span>
              <span className="text-base">🏓</span>
            </label>
            <div className="relative">
              <select
                id="sport-select-dropdown"
                value={sport}
                onChange={(e) => setSport(e.target.value as SportType)}
                className="w-full appearance-none bg-slate-50 dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 focus:border-violet-500 dark:focus:border-violet-500 rounded-xl px-3.5 py-2.5 pr-10 text-xs sm:text-sm font-bold text-slate-900 dark:text-white outline-none cursor-pointer transition-colors shadow-sm"
              >
                <option value={SportType.TABLE_TENNIS}>🏓 Tenis Meja (Pingpong)</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
                <ChevronDown className="w-4 h-4" />
              </div>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
              Standar ITTF: 11 Poin, Deuce selisih 2 poin
            </p>
          </div>

          {/* 2. Dropdown Pilihan Kategori Pertandingan */}
          <div className="space-y-1.5">
            <label
              htmlFor="mode-select-dropdown"
              className="text-xs font-bold text-slate-700 dark:text-slate-300 font-mono tracking-wider uppercase flex items-center justify-between"
            >
              <span>Kategori Pertandingan</span>
              <span className="text-slate-500">
                {mode === GameMode.SINGLES ? <User className="w-3.5 h-3.5" /> : <Users className="w-3.5 h-3.5" />}
              </span>
            </label>
            <div className="relative">
              <select
                id="mode-select-dropdown"
                value={mode}
                onChange={(e) => setMode(e.target.value as GameMode)}
                className="w-full appearance-none bg-slate-50 dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 focus:border-violet-500 dark:focus:border-violet-500 rounded-xl px-3.5 py-2.5 pr-10 text-xs sm:text-sm font-bold text-slate-900 dark:text-white outline-none cursor-pointer transition-colors shadow-sm"
              >
                <option value={GameMode.SINGLES}>👤 Tunggal (1 vs 1)</option>
                <option value={GameMode.DOUBLES}>👥 Ganda (2 vs 2)</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
                <ChevronDown className="w-4 h-4" />
              </div>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
              {mode === GameMode.SINGLES
                ? "Sistem perorangan 1 lawan 1"
                : "Sistem ganda 2 lawan 2"}
            </p>
          </div>

          {/* 3. Dropdown Pilihan Jumlah Game (Set) */}
          <div className="space-y-1.5">
            <label
              htmlFor="sets-select-dropdown"
              className="text-xs font-bold text-slate-700 dark:text-slate-300 font-mono tracking-wider uppercase flex items-center justify-between"
            >
              <span>Jumlah Game (Set)</span>
              <span className="text-[10px] px-1.5 py-0.2 bg-violet-500/10 text-violet-600 dark:text-violet-400 rounded font-mono">
                {bestOfSets === 1 ? "1 Set" : `Best of ${bestOfSets}`}
              </span>
            </label>
            <div className="relative">
              <select
                id="sets-select-dropdown"
                value={bestOfSets}
                onChange={(e) => setBestOfSets(Number(e.target.value))}
                className="w-full appearance-none bg-slate-50 dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 focus:border-violet-500 dark:focus:border-violet-500 rounded-xl px-3.5 py-2.5 pr-10 text-xs sm:text-sm font-bold text-slate-900 dark:text-white outline-none cursor-pointer transition-colors shadow-sm"
              >
                <option value={1}>1 Game Langsung (1 Game Selesai)</option>
                <option value={3}>Best of 3 Games (Menang 2 Game)</option>
                <option value={5}>Best of 5 Games (Menang 3 Game - Standar Resmi ITTF)</option>
                <option value={7}>Best of 7 Games (Menang 4 Game - Standar Olimpiade/Dunia)</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
                <ChevronDown className="w-4 h-4" />
              </div>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
              {bestOfSets === 1
                ? "Format 1 game langsung selesai (11 poin)"
                : `Aturan ITTF: Pemenang adalah yang pertama meraih ${Math.ceil(bestOfSets / 2)} kemenangan game`}
            </p>
          </div>
        </div>

        {/* Ringkasan Format Terpilih */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-50 dark:bg-slate-950/80 rounded-xl border border-slate-200/80 dark:border-slate-800 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-xl">🏓</span>
            <div>
              <span className="font-extrabold text-slate-900 dark:text-white">
                Tenis Meja
              </span>
              <span className="mx-1.5 text-slate-400">•</span>
              <span className="text-slate-600 dark:text-slate-300 font-medium">
                {mode === GameMode.SINGLES ? "Tunggal (1v1)" : "Ganda (2v2)"}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-lg font-mono text-[11px] font-bold bg-violet-500/10 text-violet-700 dark:text-violet-300 border border-violet-500/20">
              Target {targetPoints} Poin
            </span>
            <span className="px-2.5 py-1 rounded-lg font-mono text-[11px] font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
              {bestOfSets === 1 ? "1 Game Langsung" : `Best of ${bestOfSets} (Target ${Math.ceil(bestOfSets / 2)} Game)`}
            </span>
          </div>
        </div>
      </div>

      {/* Advanced Score Configurations */}
      <div className="p-5 bg-slate-50 dark:bg-slate-900/30 rounded-2xl border border-slate-200 dark:border-slate-800/80 space-y-4">
        <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 font-mono flex items-center gap-1.5 border-b border-slate-200 dark:border-slate-800/60 pb-2 mb-2">
          <Settings2 className="w-3.5 h-3.5 text-violet-500 dark:text-violet-400" />
          PENGATURAN SKOR & ATURAN JUS (DEUCE)
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Target score points */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 font-mono uppercase">
              Target Poin Set
            </label>
            <input
              type="number"
              min="1"
              max="99"
              value={targetPoints}
              onChange={(e) => setTargetPoints(Math.max(1, parseInt(e.target.value) || 0))}
              className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 focus:border-violet-500 dark:focus:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white font-mono font-bold outline-none shadow-sm"
            />
          </div>

          {/* Deuce rule toggle */}
          <div className="space-y-1.5 flex flex-col justify-end">
            <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 font-mono uppercase mb-1.5">
              Sistem Deuce (Jus)
            </span>
            <label className="relative flex items-center justify-between cursor-pointer p-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800/80 rounded-xl h-[38px] shadow-sm">
              <span className="text-xs font-medium text-slate-700 dark:text-slate-300">Aktifkan</span>
              <input
                type="checkbox"
                checked={deuceEnabled}
                onChange={(e) => setDeuceEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-8 h-4.5 bg-slate-200 dark:bg-slate-800 rounded-full peer peer-focus:ring-0 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-1.5 after:right-4 after:bg-slate-400 after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-violet-600 dark:peer-checked:bg-violet-500 peer-checked:after:bg-white peer-checked:after:border-transparent"></div>
            </label>
          </div>

          {/* Deuce points limit */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 font-mono uppercase flex items-center justify-between">
              <span>Batas Maksimal Poin</span>
              <span className="text-[9px] text-slate-400 dark:text-slate-500 lowercase">(ITTF: Bebas / 99)</span>
            </label>
            <input
              type="number"
              disabled={!deuceEnabled}
              min={targetPoints + 1}
              max="150"
              value={deuceMaxPoints}
              onChange={(e) => setDeuceMaxPoints(Math.max(targetPoints + 1, parseInt(e.target.value) || 0))}
              className={`w-full bg-white dark:bg-slate-950 border rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white font-mono font-bold outline-none shadow-sm ${
                deuceEnabled
                  ? "border-slate-300 dark:border-slate-800 focus:border-violet-500 dark:focus:border-slate-700 opacity-100"
                  : "border-slate-200 dark:border-slate-900 opacity-40 cursor-not-allowed"
              }`}
            />
          </div>
        </div>
      </div>

      {/* Player Names Section */}
      <div className="space-y-3.5">
        <div className="flex items-center justify-between">
          <label className="text-sm font-bold text-slate-700 dark:text-slate-300 font-mono tracking-wider uppercase">
            Nama Pemain / Tim
          </label>
          <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
            <input
              type="checkbox"
              checked={customNames}
              onChange={(e) => setCustomNames(e.target.checked)}
              className="rounded border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 text-violet-600 focus:ring-0"
            />
            Kustomisasi Nama Pemain & Tim
          </label>
        </div>

        {customNames ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-5 bg-slate-50 dark:bg-slate-900/30 rounded-2xl border border-slate-200 dark:border-slate-800/80 animate-fadeIn">
            {/* Team A configuration */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-amber-600 dark:text-amber-400 font-mono uppercase tracking-wider">
                Tim / Pemain A
              </h4>
              <div className="space-y-2">
                <div>
                  <label className="text-[10px] text-slate-600 dark:text-slate-400 font-mono font-medium block mb-1">Nama Tim A</label>
                  <input
                    type="text"
                    value={teamAName}
                    onChange={(e) => setTeamAName(e.target.value)}
                    placeholder="Contoh: TIM A, PB Garuda, dll"
                    className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 focus:border-violet-500 dark:focus:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white outline-none mb-2 shadow-sm"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-600 dark:text-slate-400 font-mono font-medium block mb-1">Pemain A1 (Servis Awal)</label>
                  <input
                    type="text"
                    value={playerA1}
                    onChange={(e) => setPlayerA1(e.target.value)}
                    placeholder="Nama Pemain"
                    className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 focus:border-violet-500 dark:focus:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white outline-none shadow-sm"
                    required
                  />
                </div>
                {mode === GameMode.DOUBLES && (
                  <div>
                    <label className="text-[10px] text-slate-600 dark:text-slate-400 font-mono font-medium block mb-1">Pemain A2</label>
                    <input
                      type="text"
                      value={playerA2}
                      onChange={(e) => setPlayerA2(e.target.value)}
                      placeholder="Nama Pemain Kedua"
                      className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 focus:border-violet-500 dark:focus:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white outline-none shadow-sm"
                      required
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Team B configuration */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-cyan-600 dark:text-cyan-400 font-mono uppercase tracking-wider">
                Tim / Pemain B
              </h4>
              <div className="space-y-2">
                <div>
                  <label className="text-[10px] text-slate-600 dark:text-slate-400 font-mono font-medium block mb-1">Nama Tim B</label>
                  <input
                    type="text"
                    value={teamBName}
                    onChange={(e) => setTeamBName(e.target.value)}
                    placeholder="Contoh: TIM B, PB Rajawali, dll"
                    className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 focus:border-violet-500 dark:focus:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white outline-none mb-2 shadow-sm"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-600 dark:text-slate-400 font-mono font-medium block mb-1">Pemain B1 (Penerima Awal)</label>
                  <input
                    type="text"
                    value={playerB1}
                    onChange={(e) => setPlayerB1(e.target.value)}
                    placeholder="Nama Pemain"
                    className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 focus:border-violet-500 dark:focus:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white outline-none shadow-sm"
                    required
                  />
                </div>
                {mode === GameMode.DOUBLES && (
                  <div>
                    <label className="text-[10px] text-slate-600 dark:text-slate-400 font-mono font-medium block mb-1">Pemain B2</label>
                    <input
                      type="text"
                      value={playerB2}
                      onChange={(e) => setPlayerB2(e.target.value)}
                      placeholder="Nama Pemain Kedua"
                      className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 focus:border-violet-500 dark:focus:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white outline-none shadow-sm"
                      required
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 bg-slate-100/70 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800/80 flex items-start gap-2.5 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            <Info className="w-4 h-4 text-slate-500 dark:text-slate-400 shrink-0 mt-0.5" />
            <span>
              Aplikasi akan menggunakan label bawaan yaitu <strong>TIM A</strong> vs <strong>TIM B</strong>. Anda dapat mengaktifkan &quot;Kustomisasi Nama Pemain & Tim&quot; di atas untuk mencatat nama asli pemain serta nama tim kustom.
            </span>
          </div>
        )}
      </div>

      {/* Start Button */}
      <button
        type="submit"
        className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold py-3.5 px-6 rounded-2xl shadow-xl shadow-indigo-500/20 active:scale-[0.99] transition-all flex items-center justify-center gap-2 text-sm font-mono cursor-pointer"
      >
        <Play className="w-4 h-4 fill-current" />
        MULAI PERTANDINGAN
      </button>
    </form>
  );
};
