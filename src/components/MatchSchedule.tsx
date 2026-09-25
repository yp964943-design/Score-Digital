import React, { useState, useMemo } from "react";
import {
  ScheduledMatch,
  ScheduleStatus,
  SportType,
  GameMode,
  MatchSettings as SettingsType,
} from "../types";
import {
  Calendar,
  Clock,
  Plus,
  Play,
  Pencil,
  Trash2,
  Search,
  Filter,
  MapPin,
  Trophy,
  CheckCircle2,
  AlertCircle,
  X,
  Printer,
  Copy,
  Check,
  RefreshCw,
  Users,
  User,
  SlidersHorizontal,
  ChevronDown,
} from "lucide-react";

interface MatchScheduleProps {
  schedules: ScheduledMatch[];
  onAddSchedule: (schedule: Omit<ScheduledMatch, "id">) => void;
  onUpdateSchedule: (schedule: ScheduledMatch) => void;
  onDeleteSchedule: (id: string) => void;
  onResetDefaultSchedules: () => void;
  onStartMatchFromSchedule: (schedule: ScheduledMatch) => void;
}

export const defaultScheduleItems: Omit<ScheduledMatch, "id">[] = [
  {
    datetime: new Date(Date.now() + 1000 * 60 * 30).toISOString().slice(0, 16), // 30 mins from now
    court: "Meja 1 (Arena Utama)",
    sport: SportType.TABLE_TENNIS,
    mode: GameMode.DOUBLES,
    targetPoints: 11,
    bestOfSets: 5,
    deuceEnabled: true,
    playerNames: {
      teamAName: "Spin Masters",
      teamA: ["Kevin Sanjaya", "Marcus Gideon"],
      teamBName: "Top Smash Duo",
      teamB: ["Mohammad Ahsan", "Hendra Setiawan"],
    },
    stage: "Final Ganda",
    status: ScheduleStatus.UPCOMING,
    notes: "Partai puncak perebutan piala bergilir Tenis Meja ScoreArena.",
  },
  {
    datetime: new Date(Date.now() + 1000 * 60 * 90).toISOString().slice(0, 16), // 1.5 hours from now
    court: "Meja 2 (Arena A)",
    sport: SportType.TABLE_TENNIS,
    mode: GameMode.SINGLES,
    targetPoints: 11,
    bestOfSets: 5,
    deuceEnabled: true,
    playerNames: {
      teamAName: "Fast Attack",
      teamA: ["Fajar Nugraha"],
      teamBName: "Smash Pro",
      teamB: ["Rian Pratama"],
    },
    stage: "Semifinal Tunggal",
    status: ScheduleStatus.UPCOMING,
    notes: "Perebutan tiket ke babak grand final tenis meja.",
  },
  {
    datetime: new Date(Date.now() - 1000 * 60 * 45).toISOString().slice(0, 16), // 45 mins ago
    court: "Meja 3 (Arena B)",
    sport: SportType.TABLE_TENNIS,
    mode: GameMode.SINGLES,
    targetPoints: 11,
    bestOfSets: 3,
    deuceEnabled: true,
    playerNames: {
      teamAName: "Top Spin Putri A",
      teamA: ["Gregoria Mariska"],
      teamBName: "Loop Putri B",
      teamB: ["Putri Kusuma Wardani"],
    },
    stage: "Babak 8 Besar",
    status: ScheduleStatus.IN_PROGRESS,
    notes: "Sedang berlangsung sengit di meja 3.",
  },
  {
    datetime: new Date(Date.now() - 1000 * 60 * 180).toISOString().slice(0, 16), // 3 hours ago
    court: "Meja 4 (Arena C)",
    sport: SportType.TABLE_TENNIS,
    mode: GameMode.DOUBLES,
    targetPoints: 11,
    bestOfSets: 3,
    deuceEnabled: true,
    playerNames: {
      teamAName: "Bintang Perkasa",
      teamA: ["Anton", "Budi"],
      teamBName: "Cahaya Mulia",
      teamB: ["Citra", "Dewi"],
    },
    stage: "Babak Penyisihan",
    status: ScheduleStatus.COMPLETED,
    notes: "Pertandingan telah usai dengan sportif.",
  },
];

export function MatchSchedule({
  schedules,
  onAddSchedule,
  onUpdateSchedule,
  onDeleteSchedule,
  onResetDefaultSchedules,
  onStartMatchFromSchedule,
}: MatchScheduleProps) {
  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [modeFilter, setModeFilter] = useState<"all" | GameMode>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | ScheduleStatus>("all");
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingScheduleId, setEditingScheduleId] = useState<string | null>(null);

  // Form State
  const [formDatetime, setFormDatetime] = useState(
    new Date(Date.now() + 1000 * 60 * 60).toISOString().slice(0, 16)
  );
  const [formCourt, setFormCourt] = useState("Meja 1");
  const [formSport, setFormSport] = useState<SportType>(SportType.TABLE_TENNIS);
  const [formMode, setFormMode] = useState<GameMode>(GameMode.DOUBLES);
  const [formTargetPoints, setFormTargetPoints] = useState(11);
  const [formBestOfSets, setFormBestOfSets] = useState(3);
  const [formDeuceEnabled, setFormDeuceEnabled] = useState(true);
  const [formStage, setFormStage] = useState("Babak Penyisihan");
  const [formStatus, setFormStatus] = useState<ScheduleStatus>(ScheduleStatus.UPCOMING);
  const [formNotes, setFormNotes] = useState("");

  // Team & Player names
  const [formTeamAName, setFormTeamAName] = useState("Tim Garuda");
  const [formPlayerA1, setFormPlayerA1] = useState("Pemain A1");
  const [formPlayerA2, setFormPlayerA2] = useState("Pemain A2");
  const [formTeamBName, setFormTeamBName] = useState("Tim Rajawali");
  const [formPlayerB1, setFormPlayerB1] = useState("Pemain B1");
  const [formPlayerB2, setFormPlayerB2] = useState("Pemain B2");

  // Copy Feedback
  const [copiedSuccess, setCopiedSuccess] = useState(false);

  // Quick Open Add Modal
  const openAddModal = () => {
    setEditingScheduleId(null);
    setFormDatetime(new Date(Date.now() + 1000 * 60 * 30).toISOString().slice(0, 16));
    setFormCourt("Meja 1");
    setFormSport(SportType.TABLE_TENNIS);
    setFormMode(GameMode.DOUBLES);
    setFormTargetPoints(11);
    setFormBestOfSets(3);
    setFormDeuceEnabled(true);
    setFormStage("Babak Penyisihan");
    setFormStatus(ScheduleStatus.UPCOMING);
    setFormNotes("");
    setFormTeamAName("Tim Garuda");
    setFormPlayerA1("Pemain A1");
    setFormPlayerA2("Pemain A2");
    setFormTeamBName("Tim Rajawali");
    setFormPlayerB1("Pemain B1");
    setFormPlayerB2("Pemain B2");
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const openEditModal = (item: ScheduledMatch) => {
    setEditingScheduleId(item.id);
    setFormDatetime(item.datetime);
    setFormCourt(item.court);
    setFormSport(item.sport);
    setFormMode(item.mode);
    setFormTargetPoints(item.targetPoints);
    setFormBestOfSets(item.bestOfSets);
    setFormDeuceEnabled(item.deuceEnabled);
    setFormStage(item.stage || "");
    setFormStatus(item.status);
    setFormNotes(item.notes || "");
    setFormTeamAName(item.playerNames.teamAName || "Tim A");
    setFormPlayerA1(item.playerNames.teamA[0] || "Pemain A1");
    setFormPlayerA2(item.playerNames.teamA[1] || "");
    setFormTeamBName(item.playerNames.teamBName || "Tim B");
    setFormPlayerB1(item.playerNames.teamB[0] || "Pemain B1");
    setFormPlayerB2(item.playerNames.teamB[1] || "");
    setIsModalOpen(true);
  };

  // Sport change handler inside form to adjust target points automatically
  const handleSportChangeInForm = (newSport: SportType) => {
    setFormSport(newSport);
    setFormTargetPoints(11);
  };

  // Submit form (Add or Edit)
  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();

    const teamA = [formPlayerA1.trim() || "Pemain A1"];
    if (formMode === GameMode.DOUBLES) {
      teamA.push(formPlayerA2.trim() || "Pemain A2");
    }

    const teamB = [formPlayerB1.trim() || "Pemain B1"];
    if (formMode === GameMode.DOUBLES) {
      teamB.push(formPlayerB2.trim() || "Pemain B2");
    }

    const scheduleData: Omit<ScheduledMatch, "id"> = {
      datetime: formDatetime,
      court: formCourt.trim() || "Arena",
      sport: formSport,
      mode: formMode,
      targetPoints: formTargetPoints,
      bestOfSets: formBestOfSets,
      deuceEnabled: formDeuceEnabled,
      stage: formStage.trim() || undefined,
      status: formStatus,
      notes: formNotes.trim() || undefined,
      playerNames: {
        teamAName: formTeamAName.trim() || "Tim A",
        teamBName: formTeamBName.trim() || "Tim B",
        teamA,
        teamB,
      },
    };

    if (editingScheduleId) {
      onUpdateSchedule({
        ...scheduleData,
        id: editingScheduleId,
      });
    } else {
      onAddSchedule(scheduleData);
    }

    setIsModalOpen(false);
  };

  // Quick Status Toggle
  const handleQuickStatusChange = (schedule: ScheduledMatch, newStatus: ScheduleStatus) => {
    onUpdateSchedule({
      ...schedule,
      status: newStatus,
    });
  };

  // Copy schedule list to clipboard
  const handleCopySchedule = () => {
    if (schedules.length === 0) return;

    let text = `🏓 JADWAL PERTANDINGAN SCOREARENA (TENIS MEJA) 🏓\n`;
    text += `Diperbarui: ${new Date().toLocaleString("id-ID")}\n\n`;

    filteredSchedules.forEach((item, idx) => {
      const modeName = item.mode === GameMode.SINGLES ? "Tunggal" : "Ganda";
      const teamA = item.playerNames.teamAName
        ? `${item.playerNames.teamAName} (${item.playerNames.teamA.join(" & ")})`
        : item.playerNames.teamA.join(" & ");
      const teamB = item.playerNames.teamBName
        ? `${item.playerNames.teamBName} (${item.playerNames.teamB.join(" & ")})`
        : item.playerNames.teamB.join(" & ");

      text += `${idx + 1}. [${item.court}] ${item.stage ? `[${item.stage}] ` : ""}Tenis Meja (${modeName})\n`;
      text += `   ${teamA} VS ${teamB}\n`;
      text += `   Status: ${getStatusLabel(item.status)}\n\n`;
    });

    navigator.clipboard.writeText(text).then(() => {
      setCopiedSuccess(true);
      setTimeout(() => setCopiedSuccess(false), 2500);
    });
  };

  // Helper for Status Label
  function getStatusLabel(status: ScheduleStatus) {
    switch (status) {
      case ScheduleStatus.UPCOMING:
        return "Akan Datang";
      case ScheduleStatus.IN_PROGRESS:
        return "Sedang Berlangsung";
      case ScheduleStatus.COMPLETED:
        return "Selesai";
      case ScheduleStatus.CANCELLED:
        return "Dibatalkan";
      default:
        return status;
    }
  }

  // Filter and Search Logic
  const filteredSchedules = useMemo(() => {
    return schedules
      .filter((item) => {
        // Mode filter
        if (modeFilter !== "all" && item.mode !== modeFilter) return false;

        // Status filter
        if (statusFilter !== "all" && item.status !== statusFilter) return false;

        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const courtMatch = item.court.toLowerCase().includes(q);
          const stageMatch = (item.stage || "").toLowerCase().includes(q);
          const notesMatch = (item.notes || "").toLowerCase().includes(q);
          const teamANameMatch = (item.playerNames.teamAName || "").toLowerCase().includes(q);
          const teamBNameMatch = (item.playerNames.teamBName || "").toLowerCase().includes(q);
          const playersAMatch = item.playerNames.teamA.some((p) => p.toLowerCase().includes(q));
          const playersBMatch = item.playerNames.teamB.some((p) => p.toLowerCase().includes(q));

          return (
            courtMatch ||
            stageMatch ||
            notesMatch ||
            teamANameMatch ||
            teamBNameMatch ||
            playersAMatch ||
            playersBMatch
          );
        }

        return true;
      })
      .sort((a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime());
  }, [schedules, modeFilter, statusFilter, searchQuery]);

  // Statistics
  const upcomingCount = schedules.filter((s) => s.status === ScheduleStatus.UPCOMING).length;
  const inProgressCount = schedules.filter((s) => s.status === ScheduleStatus.IN_PROGRESS).length;
  const completedCount = schedules.filter((s) => s.status === ScheduleStatus.COMPLETED).length;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white/90 dark:bg-slate-900/60 p-5 rounded-3xl border border-slate-200 dark:border-slate-800/80 shadow-sm backdrop-blur-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-violet-600/10 dark:bg-violet-500/20 text-violet-600 dark:text-violet-400 border border-violet-500/20">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Tabel Jadwal Pertandingan
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Kelola jadwal, lapangan, pemain, dan mulai pertandingan langsung ke papan skor digital.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={openAddModal}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs font-mono shadow-md hover:shadow-lg shadow-violet-600/20 transition-all cursor-pointer"
            title="Tambah jadwal pertandingan baru"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Jadwal</span>
          </button>

          <button
            onClick={handleCopySchedule}
            disabled={schedules.length === 0}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold font-mono border border-slate-200 dark:border-slate-700 transition-all cursor-pointer"
            title="Salin ringkasan teks jadwal untuk WhatsApp/pengumuman"
          >
            {copiedSuccess ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
            <span>{copiedSuccess ? "Tersalin!" : "Salin Jadwal"}</span>
          </button>

          <button
            onClick={onResetDefaultSchedules}
            className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700 transition-all cursor-pointer"
            title="Muat Ulang Contoh Jadwal"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* QUICK STATS PILLS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white/80 dark:bg-slate-900/40 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center gap-3">
          <div className="w-2.5 h-8 rounded-full bg-slate-400"></div>
          <div>
            <p className="text-[10px] text-slate-500 font-mono uppercase font-bold">Total Terjadwal</p>
            <p className="text-base font-black text-slate-900 dark:text-white font-mono">{schedules.length}</p>
          </div>
        </div>

        <div className="bg-white/80 dark:bg-slate-900/40 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center gap-3">
          <div className="w-2.5 h-8 rounded-full bg-amber-500"></div>
          <div>
            <p className="text-[10px] text-amber-600 dark:text-amber-400 font-mono uppercase font-bold">Akan Datang</p>
            <p className="text-base font-black text-slate-900 dark:text-white font-mono">{upcomingCount}</p>
          </div>
        </div>

        <div className="bg-white/80 dark:bg-slate-900/40 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center gap-3">
          <div className="w-2.5 h-8 rounded-full bg-emerald-500 animate-pulse"></div>
          <div>
            <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono uppercase font-bold">Berlangsung</p>
            <p className="text-base font-black text-slate-900 dark:text-white font-mono">{inProgressCount}</p>
          </div>
        </div>

        <div className="bg-white/80 dark:bg-slate-900/40 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center gap-3">
          <div className="w-2.5 h-8 rounded-full bg-blue-500"></div>
          <div>
            <p className="text-[10px] text-blue-600 dark:text-blue-400 font-mono uppercase font-bold">Selesai</p>
            <p className="text-base font-black text-slate-900 dark:text-white font-mono">{completedCount}</p>
          </div>
        </div>
      </div>

      {/* FILTER & SEARCH BAR */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white/70 dark:bg-slate-900/30 p-3 rounded-2xl border border-slate-200 dark:border-slate-800/60">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari pemain, tim, lapangan, atau babak..."
            className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:border-violet-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Mode/Format Filter */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
            <button
              onClick={() => setModeFilter("all")}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                modeFilter === "all"
                  ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm font-bold"
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              Semua Format
            </button>
            <button
              onClick={() => setModeFilter(GameMode.SINGLES)}
              className={`px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                modeFilter === GameMode.SINGLES
                  ? "bg-white dark:bg-slate-800 text-cyan-600 dark:text-cyan-400 shadow-sm font-bold"
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <span>👤</span> Tunggal
            </button>
            <button
              onClick={() => setModeFilter(GameMode.DOUBLES)}
              className={`px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                modeFilter === GameMode.DOUBLES
                  ? "bg-white dark:bg-slate-800 text-cyan-600 dark:text-cyan-400 shadow-sm font-bold"
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <span>👥</span> Ganda
            </button>
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 outline-none cursor-pointer"
          >
            <option value="all">Semua Status</option>
            <option value={ScheduleStatus.UPCOMING}>Akan Datang</option>
            <option value={ScheduleStatus.IN_PROGRESS}>Sedang Berlangsung</option>
            <option value={ScheduleStatus.COMPLETED}>Selesai</option>
            <option value={ScheduleStatus.CANCELLED}>Dibatalkan</option>
          </select>
        </div>
      </div>

      {/* SCHEDULE TABLE */}
      <div className="bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800/90 rounded-3xl shadow-lg overflow-hidden backdrop-blur-sm">
        {filteredSchedules.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
              <Calendar className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
              Tidak ada jadwal yang sesuai filter
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Coba sesuaikan kata kunci pencarian atau klik &quot;Tambah Jadwal&quot; untuk membuat jadwal pertandingan baru.
            </p>
            <button
              onClick={openAddModal}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-violet-600 text-white text-xs font-bold font-mono shadow cursor-pointer mt-2"
            >
              <Plus className="w-3.5 h-3.5" /> Buat Jadwal Baru
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[760px]">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/60 text-[11px] font-mono text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4 font-bold">Lapangan</th>
                  <th className="py-3.5 px-4 font-bold">Kategori & Babak</th>
                  <th className="py-3.5 px-4 font-bold">Pertandingan (Tim A vs Tim B)</th>
                  <th className="py-3.5 px-4 font-bold">Format</th>
                  <th className="py-3.5 px-4 font-bold">Status</th>
                  <th className="py-3.5 px-4 font-bold text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 text-xs">
                {filteredSchedules.map((schedule) => {
                  return (
                    <tr
                      key={schedule.id}
                      className="hover:bg-slate-50/90 dark:hover:bg-slate-800/30 transition-colors group"
                    >
                      {/* LAPANGAN */}
                      <td className="py-4 px-4 align-top">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-50 dark:bg-violet-950/40 text-violet-900 dark:text-violet-200 border border-violet-200 dark:border-violet-800/60 shadow-xs">
                          <MapPin className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400 shrink-0" />
                          <span className="font-extrabold text-xs sm:text-sm font-mono">
                            {schedule.court}
                          </span>
                        </div>
                      </td>

                      {/* KATEGORI & BABAK */}
                      <td className="py-4 px-4 align-top">
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-1.5">
                            <span className="text-base">🏓</span>
                            <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold font-mono uppercase tracking-wider bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border border-cyan-500/20">
                              Tenis Meja
                            </span>
                          </div>
                          <div className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1">
                            {schedule.mode === GameMode.DOUBLES ? (
                              <Users className="w-3 h-3 text-slate-400" />
                            ) : (
                              <User className="w-3 h-3 text-slate-400" />
                            )}
                            <span>{schedule.mode === GameMode.DOUBLES ? "Ganda" : "Tunggal"}</span>
                          </div>
                          {schedule.stage && (
                            <div className="text-[10px] font-mono text-violet-600 dark:text-violet-400 font-bold">
                              🏆 {schedule.stage}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* PERTANDINGAN (TIM A vs TIM B) */}
                      <td className="py-4 px-4 align-top max-w-[280px]">
                        <div className="space-y-2">
                          {/* Tim A */}
                          <div className="flex items-start gap-2">
                            <span className="w-2 h-2 rounded-full bg-amber-500 mt-1.5 shrink-0"></span>
                            <div>
                              <p className="font-extrabold text-slate-900 dark:text-white text-xs leading-tight">
                                {schedule.playerNames.teamAName || "Tim A"}
                              </p>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                                {schedule.playerNames.teamA.join(" & ")}
                              </p>
                            </div>
                          </div>

                          {/* VS Badge */}
                          <div className="pl-4">
                            <span className="text-[9px] font-mono font-black text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                              VS
                            </span>
                          </div>

                          {/* Tim B */}
                          <div className="flex items-start gap-2">
                            <span className="w-2 h-2 rounded-full bg-cyan-500 mt-1.5 shrink-0"></span>
                            <div>
                              <p className="font-extrabold text-slate-900 dark:text-white text-xs leading-tight">
                                {schedule.playerNames.teamBName || "Tim B"}
                              </p>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                                {schedule.playerNames.teamB.join(" & ")}
                              </p>
                            </div>
                          </div>

                          {schedule.notes && (
                            <p className="text-[10px] text-slate-400 italic pt-1 border-t border-slate-100 dark:border-slate-800">
                              &ldquo;{schedule.notes}&rdquo;
                            </p>
                          )}
                        </div>
                      </td>

                      {/* FORMAT */}
                      <td className="py-4 px-4 align-top">
                        <div className="space-y-1 font-mono text-[11px]">
                          <div className="font-bold text-slate-800 dark:text-slate-200">
                            Target {schedule.targetPoints} Poin
                          </div>
                          <div className="text-slate-500">
                            Best of {schedule.bestOfSets} Set
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {schedule.deuceEnabled ? "⚡ Jus Aktif" : "Tanpa Jus"}
                          </div>
                        </div>
                      </td>

                      {/* STATUS */}
                      <td className="py-4 px-4 align-top">
                        <div className="space-y-1.5">
                          <div className="relative inline-block">
                            {schedule.status === ScheduleStatus.UPCOMING && (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold font-mono bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20">
                                <Clock className="w-3 h-3" />
                                Akan Datang
                              </span>
                            )}
                            {schedule.status === ScheduleStatus.IN_PROGRESS && (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold font-mono bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                                Sedang Main
                              </span>
                            )}
                            {schedule.status === ScheduleStatus.COMPLETED && (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold font-mono bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20">
                                <CheckCircle2 className="w-3 h-3" />
                                Selesai
                              </span>
                            )}
                            {schedule.status === ScheduleStatus.CANCELLED && (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold font-mono bg-slate-500/10 text-slate-500 border border-slate-500/20">
                                <AlertCircle className="w-3 h-3" />
                                Dibatalkan
                              </span>
                            )}
                          </div>

                          {/* Quick change dropdown */}
                          <div>
                            <select
                              value={schedule.status}
                              onChange={(e) =>
                                handleQuickStatusChange(schedule, e.target.value as ScheduleStatus)
                              }
                              className="text-[10px] font-mono bg-transparent border-b border-dashed border-slate-300 dark:border-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 outline-none cursor-pointer"
                              title="Ubah status pertandingan"
                            >
                              <option value={ScheduleStatus.UPCOMING}>Ubah: Akan Datang</option>
                              <option value={ScheduleStatus.IN_PROGRESS}>Ubah: Berlangsung</option>
                              <option value={ScheduleStatus.COMPLETED}>Ubah: Selesai</option>
                              <option value={ScheduleStatus.CANCELLED}>Ubah: Dibatalkan</option>
                            </select>
                          </div>
                        </div>
                      </td>

                      {/* AKSI CEPAT */}
                      <td className="py-4 px-4 align-top text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* MULAI PERTANDINGAN LANGSUNG KE PAPAN SKOR */}
                          <button
                            onClick={() => onStartMatchFromSchedule(schedule)}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-mono text-[11px] font-bold shadow-md hover:shadow-emerald-500/20 transition-all cursor-pointer group-hover:scale-105"
                            title="Buka pertandingan ini langsung di papan skor digital"
                          >
                            <Play className="w-3 h-3 fill-current" />
                            <span>Mulai Skor</span>
                          </button>

                          {/* EDIT */}
                          <button
                            onClick={() => openEditModal(schedule)}
                            className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                            title="Edit jadwal"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>

                          {/* DELETE */}
                          <button
                            onClick={() => {
                              if (window.confirm("Hapus jadwal pertandingan ini?")) {
                                onDeleteSchedule(schedule.id);
                              }
                            }}
                            className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-red-500/10 text-slate-400 hover:text-red-500 border border-slate-200 dark:border-slate-700 hover:border-red-500/20 transition-colors cursor-pointer"
                            title="Hapus jadwal"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL FORM TAMBAH / EDIT JADWAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-violet-600/10 dark:bg-violet-500/20 text-violet-600 dark:text-violet-400 border border-violet-500/20">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                    {editingScheduleId ? "Edit Jadwal Pertandingan" : "Tambah Jadwal Pertandingan Baru"}
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                    Lengkapi rincian pertandingan untuk agenda turnamen
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form Body */}
            <form onSubmit={handleSubmitForm} className="p-5 space-y-4 overflow-y-auto">
              {/* Row 1: Sport & Mode Selector (Dropdowns) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 font-mono uppercase block mb-1">
                    Cabang Olahraga
                  </label>
                  <div className="relative">
                    <select
                      value={formSport}
                      onChange={(e) => handleSportChangeInForm(e.target.value as SportType)}
                      className="w-full appearance-none bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-violet-500 rounded-xl px-3 py-2 pr-9 text-xs text-slate-900 dark:text-white font-bold outline-none cursor-pointer"
                    >
                      <option value={SportType.TABLE_TENNIS}>🏓 Tenis Meja (Pingpong)</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-slate-400">
                      <ChevronDown className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 font-mono uppercase block mb-1">
                    Kategori Permainan
                  </label>
                  <div className="relative">
                    <select
                      value={formMode}
                      onChange={(e) => setFormMode(e.target.value as GameMode)}
                      className="w-full appearance-none bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-violet-500 rounded-xl px-3 py-2 pr-9 text-xs text-slate-900 dark:text-white font-bold outline-none cursor-pointer"
                    >
                      <option value={GameMode.SINGLES}>👤 Tunggal (1 vs 1)</option>
                      <option value={GameMode.DOUBLES}>👥 Ganda (2 vs 2)</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-slate-400">
                      <ChevronDown className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Row 2: Date/Time & Court & Stage */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 font-mono uppercase block mb-1">
                    Waktu Pertandingan
                  </label>
                  <input
                    type="datetime-local"
                    value={formDatetime}
                    onChange={(e) => setFormDatetime(e.target.value)}
                    required
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-violet-500 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 font-mono uppercase block mb-1">
                    Meja Pertandingan
                  </label>
                  <input
                    type="text"
                    value={formCourt}
                    onChange={(e) => setFormCourt(e.target.value)}
                    placeholder="Contoh: Meja 1, Meja 2"
                    required
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-violet-500 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 font-mono uppercase block mb-1">
                    Babak / Babak Pertandingan
                  </label>
                  <input
                    type="text"
                    value={formStage}
                    onChange={(e) => setFormStage(e.target.value)}
                    placeholder="Contoh: Babak 8 Besar, Final"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-violet-500 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white outline-none"
                  />
                </div>
              </div>

              {/* Row 3: Tim A & Tim B Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                {/* TIM A */}
                <div className="bg-amber-500/5 p-3.5 rounded-2xl border border-amber-500/20 space-y-2">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                    <h4 className="text-xs font-bold text-amber-700 dark:text-amber-400 font-mono uppercase">
                      Tim / Pemain A
                    </h4>
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 dark:text-slate-400 font-mono block mb-0.5">
                      Nama Tim A
                    </label>
                    <input
                      type="text"
                      value={formTeamAName}
                      onChange={(e) => setFormTeamAName(e.target.value)}
                      placeholder="Nama Tim A"
                      className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 dark:text-white outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 dark:text-slate-400 font-mono block mb-0.5">
                      Pemain A1 {formMode === GameMode.DOUBLES && "(Servis Pertama)"}
                    </label>
                    <input
                      type="text"
                      value={formPlayerA1}
                      onChange={(e) => setFormPlayerA1(e.target.value)}
                      placeholder="Nama Pemain A1"
                      required
                      className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 dark:text-white outline-none focus:border-amber-500"
                    />
                  </div>
                  {formMode === GameMode.DOUBLES && (
                    <div>
                      <label className="text-[10px] text-slate-500 dark:text-slate-400 font-mono block mb-0.5">
                        Pemain A2
                      </label>
                      <input
                        type="text"
                        value={formPlayerA2}
                        onChange={(e) => setFormPlayerA2(e.target.value)}
                        placeholder="Nama Pemain A2"
                        className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 dark:text-white outline-none focus:border-amber-500"
                      />
                    </div>
                  )}
                </div>

                {/* TIM B */}
                <div className="bg-cyan-500/5 p-3.5 rounded-2xl border border-cyan-500/20 space-y-2">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-cyan-500"></span>
                    <h4 className="text-xs font-bold text-cyan-700 dark:text-cyan-400 font-mono uppercase">
                      Tim / Pemain B
                    </h4>
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 dark:text-slate-400 font-mono block mb-0.5">
                      Nama Tim B
                    </label>
                    <input
                      type="text"
                      value={formTeamBName}
                      onChange={(e) => setFormTeamBName(e.target.value)}
                      placeholder="Nama Tim B"
                      className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 dark:text-white outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 dark:text-slate-400 font-mono block mb-0.5">
                      Pemain B1 {formMode === GameMode.DOUBLES && "(Penerima Servis)"}
                    </label>
                    <input
                      type="text"
                      value={formPlayerB1}
                      onChange={(e) => setFormPlayerB1(e.target.value)}
                      placeholder="Nama Pemain B1"
                      required
                      className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 dark:text-white outline-none focus:border-cyan-500"
                    />
                  </div>
                  {formMode === GameMode.DOUBLES && (
                    <div>
                      <label className="text-[10px] text-slate-500 dark:text-slate-400 font-mono block mb-0.5">
                        Pemain B2
                      </label>
                      <input
                        type="text"
                        value={formPlayerB2}
                        onChange={(e) => setFormPlayerB2(e.target.value)}
                        placeholder="Nama Pemain B2"
                        className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 dark:text-white outline-none focus:border-cyan-500"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Row 4: Game Format Settings & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 font-mono uppercase block mb-1">
                    Target Poin / Set
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="50"
                    value={formTargetPoints}
                    onChange={(e) => setFormTargetPoints(parseInt(e.target.value) || 21)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white font-mono outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 font-mono uppercase block mb-1">
                    Format Set (Best of)
                  </label>
                  <select
                    value={formBestOfSets}
                    onChange={(e) => setFormBestOfSets(parseInt(e.target.value) || 3)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white font-mono outline-none cursor-pointer"
                  >
                    <option value={1}>1 Game Langsung (1 Game Selesai)</option>
                    <option value={3}>Best of 3 Games (Menang 2 Game)</option>
                    <option value={5}>Best of 5 Games (Menang 3 Game - Standar ITTF)</option>
                    <option value={7}>Best of 7 Games (Menang 4 Game - Standar ITTF)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 font-mono uppercase block mb-1">
                    Status Jadwal
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as ScheduleStatus)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white font-mono outline-none cursor-pointer"
                  >
                    <option value={ScheduleStatus.UPCOMING}>Akan Datang</option>
                    <option value={ScheduleStatus.IN_PROGRESS}>Sedang Berlangsung</option>
                    <option value={ScheduleStatus.COMPLETED}>Selesai</option>
                    <option value={ScheduleStatus.CANCELLED}>Dibatalkan</option>
                  </select>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 font-mono uppercase block mb-1">
                  Catatan Pertandingan (Opsional)
                </label>
                <input
                  type="text"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Contoh: Wasit: Pak Joko, Perebutan Juara Grup B"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white outline-none"
                />
              </div>

              {/* Modal Footer Buttons */}
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold font-mono shadow-md cursor-pointer transition-all"
                >
                  {editingScheduleId ? "Simpan Perubahan" : "Tambahkan Jadwal"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
