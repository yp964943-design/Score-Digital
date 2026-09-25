import React from "react";
import { GameMode, SportType } from "../types";

interface CourtVisualizerProps {
  sport?: SportType;
  mode: GameMode;
  playerNames: { teamA: string[]; teamB: string[] };
  scoreA: number;
  scoreB: number;
  servingTeam: "A" | "B";
  servingPlayerIndex: number;
  receivingPlayerIndex: number;
  courtSides: { leftTeam: "A" | "B"; rightTeam: "A" | "B" };
}

export const CourtVisualizer: React.FC<CourtVisualizerProps> = ({
  mode,
  playerNames,
  scoreA,
  scoreB,
  servingTeam,
  servingPlayerIndex,
  receivingPlayerIndex,
  courtSides,
}) => {
  const isDoubles = mode === GameMode.DOUBLES;

  // Identify who is on the left side of the screen and who is on the right side of the screen
  const leftTeam = courtSides.leftTeam;
  const rightTeam = courtSides.rightTeam;

  const leftTeamNames = leftTeam === "A" ? playerNames.teamA : playerNames.teamB;
  const rightTeamNames = rightTeam === "A" ? playerNames.teamA : playerNames.teamB;

  // TABLE TENNIS VISUALIZATION
  // Table Tennis rules: Serves alternate every 2 points.
  // If score is deuce (10-10) or more (total points >= 20), serves alternate every 1 point.
  const totalPoints = scoreA + scoreB;
  const isDeuceMode = scoreA >= 10 && scoreB >= 10;
  const serveInterval = isDeuceMode ? 1 : 2;
  const servesCompletedInCurrentPeriod = totalPoints % serveInterval;
  const servesRemaining = serveInterval - servesCompletedInCurrentPeriod;

  return (
    <div id="table-tennis-court-container" className="flex flex-col items-center justify-center p-4 bg-white/80 dark:bg-slate-900/40 rounded-2xl border border-slate-200 dark:border-slate-800 backdrop-blur-sm shadow-md dark:shadow-none">
      <div className="text-xs font-mono text-slate-600 dark:text-slate-400 mb-3 flex items-center gap-2 font-bold">
        <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse"></span>
        VISUALISASI MEJA PINGPONG (TENIS MEJA)
      </div>

      {/* Table Tennis Table */}
      <div className="relative w-full max-w-lg aspect-[9/5] bg-emerald-800 rounded-lg border-4 border-white shadow-xl overflow-hidden flex items-center justify-between">
        {/* Center line (White dashed/solid line dividing the two serving halves) */}
        <div className="absolute top-0 bottom-0 left-0 right-0 border-t border-b border-dashed border-white/50 h-0 m-auto"></div>
        
        {/* Net (Vertical dividing line in the middle) */}
        <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-2 bg-slate-700/80 border-l border-r border-white/60 z-10 flex flex-col justify-between py-1">
          <div className="w-3 h-1 -ml-0.5 bg-slate-500 rounded-sm"></div>
          <div className="w-3 h-1 -ml-0.5 bg-slate-500 rounded-sm"></div>
        </div>

        {/* LEFT COURT SIDE */}
        {isDoubles ? (
          <div className="relative flex-1 h-full flex flex-col z-20">
            {/* SISI KIRI - TOP HALF (Left Court for left team) */}
            <div className="flex-1 w-full flex items-center justify-center p-1.5 relative border-b border-dashed border-white/20">
              {(() => {
                const partnerIdx = servingTeam === leftTeam ? (1 - servingPlayerIndex) : (1 - receivingPlayerIndex);
                const partnerName = leftTeamNames[partnerIdx] || `Pemain ${partnerIdx + 1}`;
                return (
                  <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full border bg-slate-900/95 border-slate-800 text-slate-400 text-[10px]">
                    <div className="w-4 h-4 rounded-full bg-slate-700 text-white text-[9px] font-bold flex items-center justify-center">
                      {partnerName.substring(0, 1).toUpperCase()}
                    </div>
                    <div className="font-medium truncate max-w-[75px]">{partnerName}</div>
                  </div>
                );
              })()}
            </div>

            {/* SISI KIRI - BOTTOM HALF (Right Court for left team - Service / Receive box) */}
            <div className={`flex-1 w-full flex items-center justify-center p-1.5 relative transition-colors duration-300 ${
              servingTeam === leftTeam
                ? "bg-amber-400/15"
                : "bg-cyan-500/10"
            }`}>
              {servingTeam === leftTeam ? (
                <span className="absolute bottom-1 left-2 bg-amber-400 text-slate-950 font-black text-[7.5px] px-1 rounded shadow uppercase">SERVIS KANAN</span>
              ) : (
                <span className="absolute bottom-1 left-2 bg-cyan-400 text-slate-950 font-black text-[7.5px] px-1 rounded shadow uppercase">RESERVE KANAN</span>
              )}

              {(() => {
                const activeIdx = servingTeam === leftTeam ? servingPlayerIndex : receivingPlayerIndex;
                const activeName = leftTeamNames[activeIdx] || `Pemain ${activeIdx + 1}`;
                const isActiveServer = servingTeam === leftTeam;
                return (
                  <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border transition-all ${
                    isActiveServer
                      ? "bg-amber-500/25 border-amber-400 text-amber-200 shadow-md scale-105"
                      : "bg-cyan-500/20 border-cyan-400 text-cyan-200"
                  } text-[11px]`}>
                    <div className={`w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center ${
                      isActiveServer ? "bg-amber-400 text-slate-950" : "bg-cyan-400 text-slate-950"
                    }`}>
                      {activeName.substring(0, 1).toUpperCase()}
                    </div>
                    <div className="font-bold truncate max-w-[80px]">{activeName}</div>
                    {isActiveServer && <span className="text-[10px]">🏓</span>}
                  </div>
                );
              })()}
            </div>
          </div>
        ) : (
          /* SINGLES LEFT SIDE */
          <div className="relative flex-1 h-full flex items-center justify-center p-2 z-20">
            {(() => {
              const isServing = servingTeam === leftTeam;
              const name = leftTeamNames[0] || "Pemain";
              return (
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border backdrop-blur-sm transition-all ${
                  isServing
                    ? "bg-amber-500/25 border-amber-400 text-amber-200 shadow-lg scale-105"
                    : "bg-slate-900/80 border-slate-700 text-slate-200"
                } text-xs`}>
                  <div className={`w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center ${
                    isServing ? "bg-amber-400 text-slate-950" : "bg-slate-700 text-white"
                  }`}>
                    {name.substring(0, 1).toUpperCase()}
                  </div>
                  <span className="font-bold truncate max-w-[100px]">{name}</span>
                  {isServing && <span className="text-xs">🏓</span>}
                </div>
              );
            })()}
          </div>
        )}

        {/* RIGHT COURT SIDE */}
        {isDoubles ? (
          <div className="relative flex-1 h-full flex flex-col z-20">
            {/* SISI KANAN - TOP HALF (Right Court for right team - diagonal to bottom left!) */}
            <div className={`flex-1 w-full flex items-center justify-center p-1.5 relative transition-colors duration-300 border-b border-dashed border-white/20 ${
              servingTeam === rightTeam
                ? "bg-amber-400/15"
                : "bg-cyan-500/10"
            }`}>
              {servingTeam === rightTeam ? (
                <span className="absolute top-1 right-2 bg-amber-400 text-slate-950 font-black text-[7.5px] px-1 rounded shadow uppercase">SERVIS KANAN</span>
              ) : (
                <span className="absolute top-1 right-2 bg-cyan-400 text-slate-950 font-black text-[7.5px] px-1 rounded shadow uppercase">RESERVE KANAN</span>
              )}

              {(() => {
                const activeIdx = servingTeam === rightTeam ? servingPlayerIndex : receivingPlayerIndex;
                const activeName = rightTeamNames[activeIdx] || `Pemain ${activeIdx + 1}`;
                const isActiveServer = servingTeam === rightTeam;
                return (
                  <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border transition-all ${
                    isActiveServer
                      ? "bg-amber-500/25 border-amber-400 text-amber-200 shadow-md scale-105"
                      : "bg-cyan-500/20 border-cyan-400 text-cyan-200"
                  } text-[11px]`}>
                    <div className={`w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center ${
                      isActiveServer ? "bg-amber-400 text-slate-950" : "bg-cyan-400 text-slate-950"
                    }`}>
                      {activeName.substring(0, 1).toUpperCase()}
                    </div>
                    <div className="font-bold truncate max-w-[80px]">{activeName}</div>
                    {isActiveServer && <span className="text-[10px]">🏓</span>}
                  </div>
                );
              })()}
            </div>

            {/* SISI KANAN - BOTTOM HALF (Left Court for right team) */}
            <div className="flex-1 w-full flex items-center justify-center p-1.5 relative">
              {(() => {
                const partnerIdx = servingTeam === rightTeam ? (1 - servingPlayerIndex) : (1 - receivingPlayerIndex);
                const partnerName = rightTeamNames[partnerIdx] || `Pemain ${partnerIdx + 1}`;
                return (
                  <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full border bg-slate-900/95 border-slate-800 text-slate-400 text-[10px]">
                    <div className="w-4 h-4 rounded-full bg-slate-700 text-white text-[9px] font-bold flex items-center justify-center">
                      {partnerName.substring(0, 1).toUpperCase()}
                    </div>
                    <div className="font-medium truncate max-w-[75px]">{partnerName}</div>
                  </div>
                );
              })()}
            </div>
          </div>
        ) : (
          /* SINGLES RIGHT SIDE */
          <div className="relative flex-1 h-full flex items-center justify-center p-2 z-20">
            {(() => {
              const isServing = servingTeam === rightTeam;
              const name = rightTeamNames[0] || "Pemain";
              return (
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border backdrop-blur-sm transition-all ${
                  isServing
                    ? "bg-amber-500/25 border-amber-400 text-amber-200 shadow-lg scale-105"
                    : "bg-slate-900/80 border-slate-700 text-slate-200"
                } text-xs`}>
                  <div className={`w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center ${
                    isServing ? "bg-amber-400 text-slate-950" : "bg-slate-700 text-white"
                  }`}>
                    {name.substring(0, 1).toUpperCase()}
                  </div>
                  <span className="font-bold truncate max-w-[100px]">{name}</span>
                  {isServing && <span className="text-xs">🏓</span>}
                </div>
              );
            })()}
          </div>
        )}
      </div>

      {/* Match Table Status Info & Service Rotation Tracker */}
      <div className="mt-3 w-full max-w-lg bg-slate-950/80 rounded-xl p-2.5 border border-slate-800 flex flex-col gap-1.5 text-center">
        <div className="flex items-center justify-between text-xs font-mono px-2">
          <div className="flex items-center gap-1.5 text-amber-400 font-bold">
            <span className="text-sm">🏓</span>
            <span>
              GILIRAN SERVIS: {servingTeam === "A" ? playerNames.teamAName || "TIM A" : playerNames.teamBName || "TIM B"}
            </span>
          </div>
          <div className="text-[11px] text-slate-400 font-mono">
            {isDeuceMode ? (
              <span className="text-red-400 font-bold animate-pulse">MODE DEUCE (1x SERVIS)</span>
            ) : (
              <span>Sisa servis giliran ini: <strong className="text-white font-bold">{servesRemaining}x</strong></span>
            )}
          </div>
        </div>

        <p className="text-[10px] text-slate-400 font-mono border-t border-slate-800/80 pt-1">
          {isDeuceMode
            ? "Skor ≥ 10-10: Servis bergantian setiap 1 poin"
            : `Servis bergantian setiap 2 poin (Siklus saat ini: ${scoreA + scoreB} poin dimainkan)`}
        </p>
        {isDoubles && (
          <p className="text-[10px] text-slate-400 leading-relaxed font-mono mt-0.5 border-t border-slate-800/40 pt-1">
            💡 <span className="text-amber-300">Mode Ganda</span>: Servis selalu dimulai dari SISI KANAN menyilang secara diagonal ke SISI KANAN penerima.
          </p>
        )}
        {(scoreA === 5 || scoreB === 5) && (
          <p className="text-[10px] text-amber-300 bg-amber-500/10 py-1 px-2 rounded-lg border border-amber-500/20 font-mono mt-0.5">
            🔄 <strong>Aturan ITTF</strong>: Pada game penentu, pemain berpindah sisi meja segera setelah salah satu pihak mencapai 5 poin.
          </p>
        )}
      </div>
    </div>
  );
};
