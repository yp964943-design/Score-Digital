import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { MatchSettings, LiveMatchState, SetScore, UndoState, SportType, GameMode, PlayerNames } from "../types";
import { CourtVisualizer } from "./CourtVisualizer";
import { AppLogo } from "./AppLogo";
import {
  playSound,
  announceScoreIndonesian,
  speakCustomText,
  setMasterAudioVolume,
  getMasterAudioVolume,
  setSpeechRate,
  getSpeechRate,
  SoundEffectType,
} from "../utils/audio";
import {
  RotateCcw,
  ArrowLeftRight,
  Volume2,
  VolumeX,
  Volume1,
  Play,
  Pause,
  Save,
  ChevronLeft,
  Square,
  AlertTriangle,
  Undo2,
  Mic,
  MicOff,
  Plus,
  Minus,
  CheckCircle,
  Pencil,
  X,
  Sparkles,
  Award,
  Trophy,
  Crown,
  FastForward,
  Flame,
  Zap,
  PartyPopper,
  Sliders,
  Megaphone,
  Radio,
  Check,
} from "lucide-react";

interface ScoreBoardProps {
  settings: MatchSettings;
  onFinishMatch: (historyEntry: { sets: SetScore[]; winner: "A" | "B"; durationSeconds: number }) => void;
  onExit: () => void;
}

export const ScoreBoard: React.FC<ScoreBoardProps> = ({ settings, onFinishMatch, onExit }) => {
  const isBadminton = settings.sport === SportType.BADMINTON;
  const isTableTennis = settings.sport === SportType.TABLE_TENNIS;
  const isDoubles = settings.mode === GameMode.DOUBLES;

  // Aturan pemenang set:
  // Tenis meja: best of 3 -> menang 3 set; best of 5 -> menang 5 set; best of 1 -> menang 1 set
  // Bulu tangkis / standar: best of 3 -> menang 2 set; best of 5 -> menang 3 set; best of 1 -> 1 set
  // Sesuai Aturan Resmi ITTF:
  // Best of 1 -> 1 kemenangan game
  // Best of 3 -> 2 kemenangan game
  // Best of 5 -> 3 kemenangan game (Standar resmi ITTF)
  // Best of 7 -> 4 kemenangan game (Standar Olimpiade & Kejuaraan Dunia ITTF)
  const targetSetsToWin = settings.bestOfSets === 1 ? 1 : Math.ceil(settings.bestOfSets / 2);

  // Sound and Voice Settings
  const [audioEnabled, setAudioEnabled] = useState<boolean>(true);
  const [speechEnabled, setSpeechEnabled] = useState<boolean>(true);
  const [masterVolume, setMasterVolume] = useState<number>(0.8);
  const [speechSpeed, setSpeechSpeed] = useState<number>(1.0);
  const [isAudioModalOpen, setIsAudioModalOpen] = useState<boolean>(false);
  const [isAnnouncingAnim, setIsAnnouncingAnim] = useState<boolean>(false);

  // Local state for editable player names
  const [playerNames, setPlayerNames] = useState<PlayerNames>(settings.playerNames);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [tempPlayerA1, setTempPlayerA1] = useState<string>(settings.playerNames.teamA[0] || "");
  const [tempPlayerA2, setTempPlayerA2] = useState<string>(settings.playerNames.teamA[1] || "");
  const [tempPlayerB1, setTempPlayerB1] = useState<string>(settings.playerNames.teamB[0] || "");
  const [tempPlayerB2, setTempPlayerB2] = useState<string>(settings.playerNames.teamB[1] || "");
  const [tempTeamAName, setTempTeamAName] = useState<string>(settings.playerNames.teamAName || "TIM A");
  const [tempTeamBName, setTempTeamBName] = useState<string>(settings.playerNames.teamBName || "TIM B");

  const openEditModal = () => {
    setTempPlayerA1(playerNames.teamA[0] || "");
    setTempPlayerA2(playerNames.teamA[1] || "");
    setTempPlayerB1(playerNames.teamB[0] || "");
    setTempPlayerB2(playerNames.teamB[1] || "");
    setTempTeamAName(playerNames.teamAName || "TIM A");
    setTempTeamBName(playerNames.teamBName || "TIM B");
    setIsEditModalOpen(true);
  };

  const saveEditedNames = () => {
    const nextA = isDoubles 
      ? [tempPlayerA1.trim() || "Pemain A1", tempPlayerA2.trim() || "Pemain A2"] 
      : [tempPlayerA1.trim() || "Pemain A"];
    const nextB = isDoubles 
      ? [tempPlayerB1.trim() || "Pemain B1", tempPlayerB2.trim() || "Pemain B2"] 
      : [tempPlayerB1.trim() || "Pemain B"];
    
    setPlayerNames({
      teamA: nextA,
      teamB: nextB,
      teamAName: tempTeamAName.trim() || "TIM A",
      teamBName: tempTeamBName.trim() || "TIM B",
    });
    setIsEditModalOpen(false);
  };

  // Sync master volume and speech rate
  const handleVolumeChange = (newVol: number) => {
    setMasterVolume(newVol);
    setMasterAudioVolume(newVol);
    if (newVol > 0 && !audioEnabled) {
      setAudioEnabled(true);
    } else if (newVol === 0) {
      setAudioEnabled(false);
    }
  };

  const handleSpeechSpeedChange = (newSpeed: number) => {
    setSpeechSpeed(newSpeed);
    setSpeechRate(newSpeed);
  };

  // Match State
  const [state, setState] = useState<LiveMatchState>({
    currentSetIndex: 0,
    setScores: [],
    currentScoreA: 0,
    currentScoreB: 0,
    servingTeam: "A",
    servingPlayerIndex: 0, // A1
    receivingPlayerIndex: 0, // B1
    isMatchOver: false,
    courtSides: {
      leftTeam: "A",
      rightTeam: "B",
    },
    durationSeconds: 0,
    history: [],
  });

  // Timer Ref & State
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(true);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Transition Delay State between sets
  const [pendingTransition, setPendingTransition] = useState<{
    winner: "A" | "B";
    scoreA: number;
    scoreB: number;
    isMatchOver: boolean;
    countdown: number;
  } | null>(null);
  const [newSetIntro, setNewSetIntro] = useState<number | null>(null);
  const [hasNotifiedDeciding5, setHasNotifiedDeciding5] = useState<boolean>(false);

  // Instant Manual TTS Announcement
  const triggerManualScoreAnnouncement = () => {
    setIsAnnouncingAnim(true);
    setTimeout(() => setIsAnnouncingAnim(false), 2000);

    const isGamePointA = state.currentScoreA >= settings.targetPoints - 1 && state.currentScoreA > state.currentScoreB;
    const isGamePointB = state.currentScoreB >= settings.targetPoints - 1 && state.currentScoreB > state.currentScoreA;
    
    announceScoreIndonesian(
      state.currentScoreA,
      state.currentScoreB,
      playerNames.teamA,
      playerNames.teamB,
      settings.sport,
      state.servingTeam,
      settings.targetPoints,
      isGamePointA,
      isGamePointB,
      state.isMatchOver ? (state.currentScoreA > state.currentScoreB ? "A" : "B") : null,
      isDoubles,
      state.servingPlayerIndex,
      false,
      null,
      undefined,
      undefined,
      state.currentSetIndex
    );
  };

  // Start Timer
  useEffect(() => {
    if (isTimerRunning && !state.isMatchOver) {
      timerIntervalRef.current = setInterval(() => {
        setState((prev) => ({
          ...prev,
          durationSeconds: prev.durationSeconds + 1,
        }));
      }, 1000);
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    }

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [isTimerRunning, state.isMatchOver]);

  // Format Timer Duration MM:SS
  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Check Game/Set over and Match over rules
  const checkSetStatus = (scoreA: number, scoreB: number) => {
    const target = settings.targetPoints;
    const deuce = settings.deuceEnabled;
    const maxPoints = settings.deuceMaxPoints;

    let isSetOver = false;
    let setWinner: "A" | "B" | null = null;

    if (scoreA >= target || scoreB >= target) {
      if (deuce) {
        // Must win by 2 points lead
        const diff = Math.abs(scoreA - scoreB);
        if (diff >= 2) {
          isSetOver = true;
          setWinner = scoreA > scoreB ? "A" : "B";
        } else if (scoreA === maxPoints || scoreB === maxPoints) {
          // Reached absolute limit cap (e.g. 30 in badminton)
          isSetOver = true;
          setWinner = scoreA === maxPoints ? "A" : "B";
        }
      } else {
        // Direct sudden-death point (no deuce)
        isSetOver = true;
        setWinner = scoreA > scoreB ? "A" : "B";
      }
    }

    return { isSetOver, setWinner };
  };

  // Helper to push state to Undo stack
  const saveUndoState = (currentState: LiveMatchState): UndoState[] => {
    const snap: UndoState = {
      currentSetIndex: currentState.currentSetIndex,
      currentScoreA: currentState.currentScoreA,
      currentScoreB: currentState.currentScoreB,
      servingTeam: currentState.servingTeam,
      servingPlayerIndex: currentState.servingPlayerIndex,
      receivingPlayerIndex: currentState.receivingPlayerIndex,
      isMatchOver: currentState.isMatchOver,
      setScores: [...currentState.setScores],
    };
    return [...currentState.history, snap];
  };

  // Commit the set transition when the countdown reaches 0
  const commitSetTransition = () => {
    if (!pendingTransition) return;

    const { winner, scoreA, scoreB, isMatchOver } = pendingTransition;

    setState((prev) => {
      const newSetResult: SetScore = {
        scoreA,
        scoreB,
        winner,
      };
      const nextSetScores = [...prev.setScores, newSetResult];
      const nextHistory = saveUndoState(prev);

      if (isMatchOver) {
        if (audioEnabled) playSound("buzzer");
        return {
          ...prev,
          setScores: nextSetScores,
          isMatchOver: true,
          history: nextHistory,
        };
      } else {
        const nextSetIndex = prev.currentSetIndex + 1;
        if (audioEnabled) playSound("special");

        setNewSetIntro(nextSetIndex + 1);
        setTimeout(() => {
          setNewSetIntro(null);
        }, 3000);

        // Swap court sides on set transition (pindah lapangan)
        const nextCourtSides = {
          leftTeam: prev.courtSides.leftTeam === "A" ? "B" : "A",
          rightTeam: prev.courtSides.rightTeam === "A" ? "B" : "A",
        };

        return {
          ...prev,
          currentSetIndex: nextSetIndex,
          setScores: nextSetScores,
          currentScoreA: 0,
          currentScoreB: 0,
          servingTeam: winner, // Winner of previous set serves first
          servingPlayerIndex: 0,
          receivingPlayerIndex: 0,
          courtSides: nextCourtSides,
          history: nextHistory,
        };
      }
    });

    setHasNotifiedDeciding5(false);
    setPendingTransition(null);
  };

  // Countdown effect for set transition
  useEffect(() => {
    if (!pendingTransition) return;

    if (pendingTransition.countdown > 0) {
      const timer = setTimeout(() => {
        setPendingTransition((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            countdown: prev.countdown - 1,
          };
        });
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      commitSetTransition();
    }
  }, [pendingTransition?.countdown]);

  // Game / Point Logic
  const addPoint = (team: "A" | "B") => {
    if (state.isMatchOver || pendingTransition) return;

    const nextScoreA = team === "A" ? state.currentScoreA + 1 : state.currentScoreA;
    const nextScoreB = team === "B" ? state.currentScoreB + 1 : state.currentScoreB;
    const { isSetOver, setWinner } = checkSetStatus(nextScoreA, nextScoreB);

    if (isSetOver && setWinner) {
      if (audioEnabled) {
        playSound("clapping");
      }

      const newSetResult: SetScore = {
        scoreA: nextScoreA,
        scoreB: nextScoreB,
        winner: setWinner,
      };
      const nextSetScores = [...state.setScores, newSetResult];
      const setsWonA = nextSetScores.filter((s) => s.winner === "A").length;
      const setsWonB = nextSetScores.filter((s) => s.winner === "B").length;
      const isMatchOverAfterSet = setsWonA === targetSetsToWin || setsWonB === targetSetsToWin;

      setPendingTransition({
        winner: setWinner,
        scoreA: nextScoreA,
        scoreB: nextScoreB,
        isMatchOver: isMatchOverAfterSet,
        countdown: 10,
      });
    } else {
      if (audioEnabled) {
        const isGamePointA = nextScoreA >= settings.targetPoints - 1 && nextScoreA > nextScoreB;
        const isGamePointB = nextScoreB >= settings.targetPoints - 1 && nextScoreB > nextScoreA;
        if (isGamePointA || isGamePointB) {
          playSound("special");
        } else {
          playSound("point");
        }
      }
    }

    setState((prev) => {
      const nextHistory = saveUndoState(prev);
      let nextScoreA = prev.currentScoreA;
      let nextScoreB = prev.currentScoreB;
      let nextServingTeam = prev.servingTeam;
      let nextServingPlayer = prev.servingPlayerIndex;
      let nextReceivingPlayer = prev.receivingPlayerIndex;

      if (team === "A") {
        nextScoreA += 1;
      } else {
        nextScoreB += 1;
      }

      // --- BADMINTON SERVICE ROTATION LOGIC (BWF STANDARDS) ---
      if (isBadminton) {
        if (team === prev.servingTeam) {
          // Serving team won the point -> serving player rotates positions (singles just updates, doubles shifts courts)
          if (isDoubles) {
            // In doubles, only the serving team swaps positions when they score a point on their own serve.
            nextServingPlayer = prev.servingPlayerIndex === 0 ? 1 : 0;
          }
        } else {
          // Receiving team won the point -> "Pindah Servis" (Service over)
          nextServingTeam = team;
          
          if (isDoubles) {
            // In doubles, when receivers win a point, who serves?
            // The service is taken by whichever player of the receiving side is standing in the right or left court
            // based on the team's score being even/odd.
            const receiverScore = team === "A" ? nextScoreA : nextScoreB;
            // Even score -> Right court player serves. Odd score -> Left court player serves.
            nextServingPlayer = receiverScore % 2 === 0 ? 0 : 1;
          } else {
            nextServingPlayer = 0;
          }
        }

        // Determine receivers based on serve
        const currentServerScore = nextServingTeam === "A" ? nextScoreA : nextScoreB;
        nextReceivingPlayer = currentServerScore % 2 === 0 ? 0 : 1;

      } else {
        // --- TABLE TENNIS SERVICE ROTATION LOGIC (ITTF STANDARDS) ---
        // Serves rotate every 2 points. If deuce (>=10-10), rotates every 1 point.
        const totalPoints = nextScoreA + nextScoreB;
        const isDeuceMode = nextScoreA >= 10 && nextScoreB >= 10;
        const serveInterval = isDeuceMode ? 1 : 2;

        if (totalPoints % serveInterval === 0) {
          nextServingTeam = prev.servingTeam === "A" ? "B" : "A";
          if (isDoubles) {
            // 100% Accurate ITTF standard doubles rotation sequence:
            if (prev.servingTeam === "A" && prev.servingPlayerIndex === 0) {
              nextServingPlayer = 0;
              nextReceivingPlayer = 1;
            } else if (prev.servingTeam === "B" && prev.servingPlayerIndex === 0) {
              nextServingPlayer = 1;
              nextReceivingPlayer = 1;
            } else if (prev.servingTeam === "A" && prev.servingPlayerIndex === 1) {
              nextServingPlayer = 1;
              nextReceivingPlayer = 0;
            } else {
              nextServingPlayer = 0;
              nextReceivingPlayer = 0;
            }
          }
        }
      }

      // Indonesian TTS Audio Announcement
      if (speechEnabled) {
        const isGamePointA = nextScoreA >= settings.targetPoints - 1 && nextScoreA > nextScoreB;
        const isGamePointB = nextScoreB >= settings.targetPoints - 1 && nextScoreB > nextScoreA;
        const isServiceChanged = prev.servingTeam !== nextServingTeam;
        const rawScoreA = team === "A" ? prev.currentScoreA + 1 : prev.currentScoreA;
        const rawScoreB = team === "B" ? prev.currentScoreB + 1 : prev.currentScoreB;

        let nextIsMatchOver = prev.isMatchOver;
        if (isSetOver && setWinner) {
          const newSetResult: SetScore = {
            scoreA: nextScoreA,
            scoreB: nextScoreB,
            winner: setWinner,
          };
          const nextSetScores = [...prev.setScores, newSetResult];
          const setsWonA = nextSetScores.filter((s) => s.winner === "A").length;
          const setsWonB = nextSetScores.filter((s) => s.winner === "B").length;
          if (setsWonA === targetSetsToWin || setsWonB === targetSetsToWin) {
            nextIsMatchOver = true;
          }
        }

        announceScoreIndonesian(
          nextScoreA,
          nextScoreB,
          playerNames.teamA,
          playerNames.teamB,
          settings.sport,
          nextServingTeam,
          settings.targetPoints,
          isGamePointA,
          isGamePointB,
          nextIsMatchOver ? setWinner : null,
          isDoubles,
          nextServingPlayer,
          isServiceChanged,
          isSetOver ? setWinner : null,
          rawScoreA,
          rawScoreB,
          prev.currentSetIndex
        );
      }

      return {
        ...prev,
        currentScoreA: nextScoreA,
        currentScoreB: nextScoreB,
        servingTeam: nextServingTeam,
        servingPlayerIndex: nextServingPlayer,
        receivingPlayerIndex: nextReceivingPlayer,
        history: nextHistory,
      };
    });
  };

  // Subtract Point
  const subtractPoint = (team: "A" | "B") => {
    setPendingTransition(null);
    setState((prev) => {
      const currentScore = team === "A" ? prev.currentScoreA : prev.currentScoreB;
      if (currentScore === 0) return prev; // Cannot go below zero

      const nextHistory = saveUndoState(prev);
      return {
        ...prev,
        currentScoreA: team === "A" ? prev.currentScoreA - 1 : prev.currentScoreA,
        currentScoreB: team === "B" ? prev.currentScoreB - 1 : prev.currentScoreB,
        history: nextHistory,
      };
    });
    if (audioEnabled) playSound("fault");
  };

  // Undo Functionality
  const triggerUndo = () => {
    setPendingTransition(null);
    setState((prev) => {
      if (prev.history.length === 0) return prev;
      const lastIndex = prev.history.length - 1;
      const snap = prev.history[lastIndex];
      const newHistory = prev.history.slice(0, lastIndex);

      return {
        ...prev,
        currentSetIndex: snap.currentSetIndex,
        currentScoreA: snap.currentScoreA,
        currentScoreB: snap.currentScoreB,
        servingTeam: snap.servingTeam,
        servingPlayerIndex: snap.servingPlayerIndex,
        receivingPlayerIndex: snap.receivingPlayerIndex,
        isMatchOver: snap.isMatchOver,
        setScores: snap.setScores,
        history: newHistory,
      };
    });
    if (audioEnabled) playSound("fault");
  };

  // Reset current set score
  const triggerReset = () => {
    setPendingTransition(null);
    setHasNotifiedDeciding5(false);
    if (window.confirm("Apakah Anda yakin ingin menyetel ulang skor game ini kembali ke 0 - 0?")) {
      setState((prev) => {
        const nextHistory = saveUndoState(prev);
        return {
          ...prev,
          currentScoreA: 0,
          currentScoreB: 0,
          history: nextHistory,
        };
      });
      if (audioEnabled) playSound("whistle");
    }
  };

  // Switch Court Sides manual
  const triggerSideSwitch = () => {
    setState((prev) => ({
      ...prev,
      courtSides: {
        leftTeam: prev.courtSides.leftTeam === "A" ? "B" : "A",
        rightTeam: prev.courtSides.rightTeam === "A" ? "B" : "A",
      },
    }));
    if (audioEnabled) playSound("switch");
  };

  // Finish match / Save results
  const triggerFinishMatch = () => {
    let finalWinner: "A" | "B" = "A";
    const setsWonA = state.setScores.filter((s) => s.winner === "A").length;
    const setsWonB = state.setScores.filter((s) => s.winner === "B").length;

    if (setsWonA > setsWonB) {
      finalWinner = "A";
    } else if (setsWonB > setsWonA) {
      finalWinner = "B";
    } else {
      // In case they finish early, whoever has higher points in active set
      finalWinner = state.currentScoreA >= state.currentScoreB ? "A" : "B";
    }

    if (audioEnabled) {
      playSound("buzzer");
      setTimeout(() => playSound("clapping"), 600);
    }

    // Include the current unfinished set if it has scores and match is forced-finished
    let finalSets = [...state.setScores];
    if (!state.isMatchOver && (state.currentScoreA > 0 || state.currentScoreB > 0)) {
      finalSets.push({
        scoreA: state.currentScoreA,
        scoreB: state.currentScoreB,
        winner: state.currentScoreA > state.currentScoreB ? "A" : "B",
      });
    }

    onFinishMatch({
      sets: finalSets,
      winner: finalWinner,
      durationSeconds: state.durationSeconds,
      playerNames,
    });
  };

  // Determine game set header label (e.g. Set 1, Set 2, Set 3 (Penentu))
  const getSetLabel = () => {
    const activeSet = state.currentSetIndex + 1;
    if (settings.bestOfSets === 1) return "Set Utama";
    const setsWonA = state.setScores.filter((s) => s.winner === "A").length;
    const setsWonB = state.setScores.filter((s) => s.winner === "B").length;
    if (setsWonA === targetSetsToWin - 1 && setsWonB === targetSetsToWin - 1) {
      return `Set Penentu (Set ${activeSet})`;
    }
    return `Set ${activeSet}`;
  };

  const nameA = playerNames.teamA.join(" & ");
  const nameB = playerNames.teamB.join(" & ");

  const teamANameLabel = playerNames.teamAName || "TIM A";
  const teamBNameLabel = playerNames.teamBName || "TIM B";

  // Identify who is left and who is right for rendering
  const isLeftTeamA = state.courtSides.leftTeam === "A";
  const leftTeamTitle = isLeftTeamA ? teamANameLabel : teamBNameLabel;
  const rightTeamTitle = isLeftTeamA ? teamBNameLabel : teamANameLabel;
  const leftTeamSub = isLeftTeamA ? nameA : nameB;
  const rightTeamSub = isLeftTeamA ? nameB : nameA;

  const leftScore = isLeftTeamA ? state.currentScoreA : state.currentScoreB;
  const rightScore = isLeftTeamA ? state.currentScoreB : state.currentScoreA;

  const leftTeamKey: "A" | "B" = isLeftTeamA ? "A" : "B";
  const rightTeamKey: "A" | "B" = isLeftTeamA ? "B" : "A";

  const totalSetsWonA = state.setScores.filter((s) => s.winner === "A").length;
  const totalSetsWonB = state.setScores.filter((s) => s.winner === "B").length;

  const leftSetsWon = isLeftTeamA ? totalSetsWonA : totalSetsWonB;
  const rightSetsWon = isLeftTeamA ? totalSetsWonB : totalSetsWonA;

  return (
    <div id="live-scoreboard-play-panel" className="space-y-6">
      {/* Dynamic Animated Toast for New Set Start */}
      <AnimatePresence>
        {newSetIntro && (
          <motion.div
            initial={{ opacity: 0, y: -30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 450, damping: 25 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-50 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-600 text-white shadow-2xl border border-white/30 flex items-center gap-3.5 backdrop-blur-md"
          >
            <div className="w-8 h-8 rounded-full bg-white text-indigo-700 flex items-center justify-center font-black font-mono shadow">
              {newSetIntro}
            </div>
            <div>
              <div className="font-extrabold text-sm tracking-wide">SET {newSetIntro} RESMI DIMULAI!</div>
              <div className="text-[11px] text-indigo-100 flex items-center gap-1.5 font-medium">
                <ArrowLeftRight className="w-3.5 h-3.5" />
                <span>Pindah Lapangan • Pemenang set sebelumnya servis pertama</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Header Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white/80 dark:bg-slate-900/40 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 backdrop-blur-sm shadow-md dark:shadow-xl">
        {/* Navigation & Info */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              if (window.confirm("Keluar dari game yang sedang berlangsung? Skor saat ini akan hilang.")) {
                onExit();
              }
            }}
            className="flex items-center gap-1 py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-950/60 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all cursor-pointer font-mono text-xs font-bold"
            title="Keluar ke Menu Utama"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>KEMBALI</span>
          </button>
          <AppLogo size="sm" />
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">PERTANDINGAN AKTIF</h2>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-500/20 uppercase font-mono">
                🏓 Tenis Meja
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
              Standar ITTF • Target {settings.targetPoints} Poin • {isDoubles ? "Ganda" : "Tunggal"} • {settings.bestOfSets === 1 ? "1 Game Langsung" : `Best of ${settings.bestOfSets} (Target ${targetSetsToWin} Game)`}
            </p>
          </div>
        </div>

        {/* Timer & Play/Pause Controls & Audio Suite */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Instant Manual Score Announcer Button */}
          <button
            onClick={triggerManualScoreAnnouncement}
            className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-mono font-bold transition-all cursor-pointer ${
              isAnnouncingAnim
                ? "bg-violet-600 text-white border-violet-400 ring-2 ring-violet-500/40 shadow-lg shadow-violet-500/20 scale-105"
                : "bg-slate-100 dark:bg-slate-950/80 text-violet-700 dark:text-violet-300 hover:text-violet-900 dark:hover:text-white border-violet-300 dark:border-violet-500/30 hover:border-violet-400 dark:hover:border-violet-500/60 hover:bg-violet-50 dark:hover:bg-violet-950/30"
            }`}
            title="Umumkan skor saat ini menggunakan suara bahasa Indonesia"
          >
            <Megaphone className={`w-3.5 h-3.5 ${isAnnouncingAnim ? "animate-bounce" : "text-violet-600 dark:text-violet-400"}`} />
            <span>PANGGIL SKOR</span>
            {isAnnouncingAnim && (
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-violet-300"></span>
              </span>
            )}
          </button>

          {/* Audio Toggles & Quick Settings */}
          <div className="flex bg-slate-100 dark:bg-slate-950/80 rounded-xl p-1 border border-slate-200 dark:border-slate-800 items-center">
            <button
              onClick={() => setAudioEnabled(!audioEnabled)}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                audioEnabled ? "text-emerald-700 dark:text-emerald-400 bg-white dark:bg-slate-800 shadow-sm dark:shadow-none" : "text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
              title={audioEnabled ? "Efek suara lapangan aktif (klik untuk senyap)" : "Efek suara senyap (klik untuk aktif)"}
            >
              {audioEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
            <button
              onClick={() => setSpeechEnabled(!speechEnabled)}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                speechEnabled ? "text-violet-700 dark:text-violet-400 bg-white dark:bg-slate-800 shadow-sm dark:shadow-none" : "text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
              title={speechEnabled ? "Pengumuman suara TTS aktif (klik untuk senyap)" : "Pengumuman suara senyap (klik untuk aktif)"}
            >
              {speechEnabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
            </button>
            <button
              onClick={() => setIsAudioModalOpen(true)}
              className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-800 transition-colors cursor-pointer border-l border-slate-200 dark:border-slate-800/80 ml-0.5 pl-2"
              title="Buka Pengaturan Efek Suara & Pengumuman Bahasa Indonesia"
            >
              <Sliders className="w-4 h-4" />
            </button>
          </div>

          {/* Time Keeper */}
          <div className="bg-slate-100 dark:bg-slate-950/80 rounded-xl border border-slate-200 dark:border-slate-800/80 px-3.5 py-1.5 text-center font-mono flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">DURASI:</span>
            <span className="text-sm font-bold text-slate-900 dark:text-white tracking-wider">
              {formatTimer(state.durationSeconds)}
            </span>
            <button
              onClick={() => setIsTimerRunning(!isTimerRunning)}
              className="ml-1 p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
              title={isTimerRunning ? "Jeda Waktu" : "Mulai Waktu"}
            >
              {isTimerRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
            </button>
          </div>
        </div>
      </div>

      {/* Set Result History Bar */}
      {state.setScores.length > 0 && (
        <div className="bg-white/80 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 p-3 rounded-2xl flex items-center justify-center gap-3 text-xs shadow-sm dark:shadow-none">
          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 font-mono uppercase tracking-wider">Skor Set Sebelumnya:</span>
          <div className="flex gap-2">
            {state.setScores.map((set, idx) => (
              <span
                key={`set-badge-${idx}`}
                className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-mono font-bold text-slate-700 dark:text-slate-300"
              >
                Set {idx + 1}: <strong className="text-slate-900 dark:text-white">{set.scoreA}-{set.scoreB}</strong>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ITTF Rule 2.14.01 Deciding Game 5-point Side Change Banner */}
      {(() => {
        const setsWonA = state.setScores.filter((s) => s.winner === "A").length;
        const setsWonB = state.setScores.filter((s) => s.winner === "B").length;
        const isDecidingGame = targetSetsToWin > 1 && setsWonA === targetSetsToWin - 1 && setsWonB === targetSetsToWin - 1;
        const showDeciding5Alert = isDecidingGame && (state.currentScoreA >= 5 || state.currentScoreB >= 5) && !hasNotifiedDeciding5 && !state.isMatchOver && !pendingTransition;

        if (!showDeciding5Alert) return null;

        return (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-amber-50 dark:bg-amber-950/40 border-2 border-amber-400/80 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-amber-900 dark:text-amber-200 shadow-md"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">🏓</span>
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider font-mono flex items-center gap-1.5 text-amber-800 dark:text-amber-300">
                  <ArrowLeftRight className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  ATURAN ITTF 2.14: PINDAH SISI MEJA (POIN 5 SET PENENTUAN)
                </h4>
                <p className="text-[11px] text-amber-700 dark:text-amber-300 mt-0.5">
                  Pada set penentu, pemain wajib bertukar sisi meja saat pemain pertama mencapai 5 poin.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => {
                  triggerSideSwitch();
                  setHasNotifiedDeciding5(true);
                }}
                className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-mono text-xs font-bold shadow-md cursor-pointer transition-all flex items-center gap-1"
              >
                <ArrowLeftRight className="w-3.5 h-3.5" />
                Tukar Sisi Sekarang
              </button>
              <button
                onClick={() => setHasNotifiedDeciding5(true)}
                className="px-2.5 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-xs font-mono font-semibold text-amber-800 dark:text-amber-300 border border-amber-500/30 cursor-pointer"
              >
                Sudah / Tutup
              </button>
            </div>
          </motion.div>
        );
      })()}

      {/* SET TRANSITION BANNER WITH RICH ANIMATIONS */}
      <AnimatePresence>
        {pendingTransition && (
          <motion.div
            key="set-transition-overlay"
            initial={{ opacity: 0, scale: 0.92, y: -24, filter: "blur(6px)" }}
            animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, scale: 0.94, y: 20, filter: "blur(4px)" }}
            transition={{ type: "spring", stiffness: 380, damping: 26 }}
            className="bg-white/95 dark:bg-gradient-to-br dark:from-slate-900/95 dark:via-indigo-950/80 dark:to-slate-900/95 border-2 border-amber-400/70 p-6 md:p-8 rounded-3xl text-center shadow-2xl flex flex-col items-center justify-center gap-3 relative overflow-hidden backdrop-blur-xl"
          >
            {/* Animated radiant glow background */}
            <motion.div
              animate={{
                scale: [1, 1.25, 1],
                opacity: [0.15, 0.3, 0.15],
              }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -inset-10 bg-gradient-to-r from-amber-500/20 via-violet-500/25 to-cyan-500/20 rounded-full blur-3xl pointer-events-none"
            />

            {/* Confetti Particle Burst */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              {[
                { x: -120, y: -60, color: "#f59e0b", delay: 0 },
                { x: 130, y: -80, color: "#06b6d4", delay: 0.1 },
                { x: -80, y: 50, color: "#8b5cf6", delay: 0.2 },
                { x: 90, y: 60, color: "#10b981", delay: 0.15 },
                { x: -150, y: 10, color: "#ec4899", delay: 0.05 },
                { x: 140, y: 20, color: "#f43f5e", delay: 0.25 },
                { x: 0, y: -90, color: "#fbbf24", delay: 0.12 },
                { x: -40, y: -70, color: "#38bdf8", delay: 0.18 },
                { x: 50, y: -60, color: "#a855f7", delay: 0.22 },
              ].map((p, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, scale: 0, x: 0, y: 0, rotate: 0 }}
                  animate={{
                    opacity: [0, 1, 0.8, 0],
                    scale: [0, 1.2, 1, 0],
                    x: [0, p.x * 0.6, p.x],
                    y: [0, p.y * 0.7, p.y + 40],
                    rotate: [0, 180, 360],
                  }}
                  transition={{
                    duration: 2.2,
                    repeat: Infinity,
                    repeatDelay: 0.8,
                    delay: p.delay,
                    ease: "easeOut",
                  }}
                  className="absolute left-1/2 top-1/2 w-3 h-3 rounded-sm shadow-sm"
                  style={{ backgroundColor: p.color }}
                />
              ))}
            </div>

            {/* Header Badge */}
            <motion.div
              initial={{ scale: 0.8, y: -10 }}
              animate={{ scale: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 20, delay: 0.05 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-amber-500/20 border border-amber-400/40 text-amber-600 dark:text-amber-300 text-xs font-black tracking-widest uppercase shadow-md relative z-10"
            >
              <Sparkles className="w-4 h-4 text-amber-500 dark:text-amber-400 animate-spin" />
              <span>SET {state.currentSetIndex + 1} SELESAI</span>
              <Sparkles className="w-4 h-4 text-amber-500 dark:text-amber-400 animate-spin" />
            </motion.div>

            {/* Winner Announcement */}
            <div className="space-y-1 relative z-10">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="text-base md:text-lg font-medium text-slate-700 dark:text-slate-200"
              >
                Pemenang Set Ini:
              </motion.div>
              <motion.div
                initial={{ scale: 0.85, y: 8 }}
                animate={{ scale: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 400, damping: 18, delay: 0.15 }}
                className={`text-2xl md:text-3xl font-black tracking-tight ${
                  pendingTransition.winner === "A" ? "text-amber-600 dark:text-amber-400" : "text-cyan-600 dark:text-cyan-400"
                }`}
              >
                🏆 {pendingTransition.winner === "A" ? teamANameLabel : teamBNameLabel}
              </motion.div>
            </div>

            {/* Set Score Pill */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-3 px-5 py-2 rounded-2xl bg-slate-100 dark:bg-slate-950/90 border border-slate-200 dark:border-slate-700/80 shadow-inner relative z-10"
            >
              <span className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Skor Akhir Set:</span>
              <span className="text-xl md:text-2xl font-black font-mono text-slate-900 dark:text-white tracking-widest">
                <strong className={pendingTransition.winner === "A" ? "text-amber-600 dark:text-amber-400" : "text-slate-900 dark:text-white"}>
                  {pendingTransition.scoreA}
                </strong>
                {" - "}
                <strong className={pendingTransition.winner === "B" ? "text-cyan-600 dark:text-cyan-400" : "text-slate-900 dark:text-white"}>
                  {pendingTransition.scoreB}
                </strong>
              </span>
            </motion.div>

            {/* Field Swap Notice */}
            {!pendingTransition.isMatchOver && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="flex items-center justify-center gap-2 text-xs font-semibold text-violet-700 dark:text-violet-300 bg-violet-50 dark:bg-violet-950/40 border border-violet-200 dark:border-violet-800/50 px-4 py-1.5 rounded-xl relative z-10"
              >
                <motion.div
                  animate={{ rotate: [0, 180, 360], scale: [1, 1.2, 1] }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                >
                  <ArrowLeftRight className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" />
                </motion.div>
                <span>Pemain berpindah sisi lapangan untuk set berikutnya</span>
              </motion.div>
            )}

            {/* Countdown & Action Skip */}
            <div className="flex flex-col sm:flex-row items-center gap-3 mt-2 relative z-10">
              <div className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 font-bold uppercase">
                <span>{pendingTransition.isMatchOver ? "Menyiapkan hasil pertandingan" : "Memulai set berikutnya dalam"}</span>
                <motion.span
                  key={pendingTransition.countdown}
                  initial={{ scale: 1.4, rotate: -10 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 500, damping: 15 }}
                  className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-slate-950 flex items-center justify-center font-black text-sm shadow-md shadow-amber-500/40"
                >
                  {pendingTransition.countdown}
                </motion.span>
                <span>detik</span>
              </div>

              {/* Fast Forward / Skip Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={commitSetTransition}
                className="px-4 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/90 hover:bg-slate-200 dark:hover:bg-slate-700 text-amber-700 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-300 border border-amber-300 dark:border-amber-500/30 text-xs font-bold font-mono flex items-center gap-1.5 shadow-sm dark:shadow-md cursor-pointer transition-all"
                title="Lewati jeda dan mulai langsung"
              >
                <FastForward className="w-3.5 h-3.5" />
                {pendingTransition.isMatchOver ? "Lihat Hasil Akhir" : "Lanjut Sekarang"}
              </motion.button>
            </div>

            {/* Progress bar */}
            <div className="w-full max-w-sm bg-slate-200 dark:bg-slate-950 h-2 rounded-full mt-1 overflow-hidden border border-slate-300 dark:border-slate-800 relative z-10">
              <motion.div
                initial={{ width: "100%" }}
                animate={{ width: "0%" }}
                transition={{ duration: 10, ease: "linear" }}
                className="bg-gradient-to-r from-amber-400 via-violet-400 to-cyan-400 h-full shadow-sm shadow-amber-400/50"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MATCH OVER SPLASH COVER WITH DYNAMIC CELEBRATION */}
      <AnimatePresence>
        {state.isMatchOver ? (
          <motion.div
            key="match-over-screen"
            initial={{ opacity: 0, scale: 0.9, y: 30, filter: "blur(8px)" }}
            animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, scale: 0.92, filter: "blur(6px)" }}
            transition={{ type: "spring", stiffness: 350, damping: 24 }}
            className="bg-white/95 dark:bg-gradient-to-br dark:from-slate-900/95 dark:via-indigo-950/90 dark:to-slate-900/95 rounded-3xl border-2 border-amber-400/50 p-8 text-center shadow-2xl relative overflow-hidden space-y-6 backdrop-blur-xl"
          >
            {/* Top glowing rainbow border */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-400 via-violet-500 to-cyan-400 shadow-lg shadow-amber-500/50"></div>

            {/* Radiant Rotating Sunburst Background */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
              className="absolute -top-32 -left-32 w-96 h-96 bg-gradient-to-br from-amber-500/10 via-violet-500/10 to-transparent rounded-full blur-3xl pointer-events-none"
            />
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ duration: 35, repeat: Infinity, ease: "linear" }}
              className="absolute -bottom-32 -right-32 w-96 h-96 bg-gradient-to-tl from-cyan-500/10 via-pink-500/10 to-transparent rounded-full blur-3xl pointer-events-none"
            />

            {/* Floating Confetti Animation */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              {[
                { x: -160, y: -90, color: "#f59e0b", delay: 0 },
                { x: 180, y: -100, color: "#06b6d4", delay: 0.15 },
                { x: -120, y: 70, color: "#8b5cf6", delay: 0.3 },
                { x: 130, y: 80, color: "#10b981", delay: 0.2 },
                { x: -200, y: 0, color: "#ec4899", delay: 0.05 },
                { x: 210, y: -20, color: "#f43f5e", delay: 0.35 },
                { x: -40, y: -120, color: "#fbbf24", delay: 0.25 },
                { x: 60, y: -110, color: "#38bdf8", delay: 0.1 },
                { x: 0, y: 90, color: "#e879f9", delay: 0.4 },
              ].map((p, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, scale: 0, x: 0, y: 0, rotate: 0 }}
                  animate={{
                    opacity: [0, 1, 0.9, 0],
                    scale: [0, 1.4, 1.1, 0],
                    x: [0, p.x * 0.7, p.x],
                    y: [0, p.y * 0.8, p.y + 60],
                    rotate: [0, 270, 540],
                  }}
                  transition={{
                    duration: 2.8,
                    repeat: Infinity,
                    repeatDelay: 0.5,
                    delay: p.delay,
                    ease: "easeOut",
                  }}
                  className="absolute left-1/2 top-1/3 w-3.5 h-3.5 rounded-sm shadow-md"
                  style={{ backgroundColor: p.color }}
                />
              ))}
            </div>

            {/* Trophy Icon with Radiance */}
            <div className="relative inline-flex items-center justify-center">
              <motion.div
                animate={{
                  scale: [1, 1.3, 1],
                  opacity: [0.3, 0.6, 0.3],
                }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className="absolute inset-0 bg-amber-400/30 rounded-full blur-xl"
              />
              <motion.div
                initial={{ scale: 0, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 400, damping: 15, delay: 0.1 }}
                className="relative p-5 rounded-3xl bg-gradient-to-br from-amber-400 to-orange-500 text-slate-950 shadow-xl shadow-amber-500/30 border-2 border-amber-300"
              >
                <Trophy className="w-12 h-12 stroke-[2.2]" />
              </motion.div>
            </div>

            {/* Victory Titles */}
            <div className="space-y-2 relative z-10">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/15 border border-amber-400/30 text-amber-600 dark:text-amber-300 text-xs font-mono font-bold uppercase tracking-widest"
              >
                <Crown className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                <span>JUARA PERTANDINGAN</span>
                <Crown className="w-4 h-4 text-amber-500 dark:text-amber-400" />
              </motion.div>

              <motion.h2
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: "spring", stiffness: 350, damping: 20, delay: 0.25 }}
                className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight"
              >
                PERTANDINGAN SELESAI!
              </motion.h2>

              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-lg md:text-xl text-slate-700 dark:text-slate-200"
              >
                Pemenang:{" "}
                <strong className="text-amber-600 dark:text-amber-400 text-xl md:text-2xl font-black drop-shadow">
                  {state.setScores.filter((s) => s.winner === "A").length > state.setScores.filter((s) => s.winner === "B").length
                    ? `${teamANameLabel} (${nameA})`
                    : `${teamBNameLabel} (${nameB})`}
                </strong>
              </motion.div>
            </div>

            {/* Set Breakdown Card */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="bg-slate-50 dark:bg-slate-950/80 max-w-md mx-auto p-5 rounded-2xl border border-slate-200 dark:border-slate-800/90 shadow-xl space-y-3 relative z-10"
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                <span className="text-[11px] font-mono font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                  Ringkasan Kemenangan Set
                </span>
                <span className="text-[11px] font-mono text-slate-500 font-bold">
                  Durasi: {formatTimer(state.durationSeconds)}
                </span>
              </div>

              {/* Team A Row */}
              <div className="flex items-center justify-between text-sm text-slate-800 dark:text-slate-200 py-1">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
                  <span className="font-bold">{teamANameLabel}</span>
                  <span className="text-slate-500 text-xs">({nameA})</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-black text-amber-600 dark:text-amber-400 text-base">{totalSetsWonA} Set</span>
                  {totalSetsWonA > totalSetsWonB && (
                    <Award className="w-4 h-4 text-amber-500 dark:text-amber-400 fill-amber-400/20" />
                  )}
                </div>
              </div>

              {/* Team B Row */}
              <div className="flex items-center justify-between text-sm text-slate-800 dark:text-slate-200 py-1 border-t border-slate-200 dark:border-slate-900">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-400"></span>
                  <span className="font-bold">{teamBNameLabel}</span>
                  <span className="text-slate-500 text-xs">({nameB})</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-black text-cyan-600 dark:text-cyan-400 text-base">{totalSetsWonB} Set</span>
                  {totalSetsWonB > totalSetsWonA && (
                    <Award className="w-4 h-4 text-cyan-500 dark:text-cyan-400 fill-cyan-400/20" />
                  )}
                </div>
              </div>

              {/* Set by set details pills */}
              {state.setScores.length > 0 && (
                <div className="pt-2 border-t border-slate-200 dark:border-slate-800/80 flex flex-wrap items-center justify-center gap-2">
                  {state.setScores.map((set, idx) => (
                    <span
                      key={`final-set-${idx}`}
                      className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold border ${
                        set.winner === "A"
                          ? "bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-300"
                          : "bg-cyan-500/10 border-cyan-500/30 text-cyan-700 dark:text-cyan-300"
                      }`}
                    >
                      Set {idx + 1}: <strong>{set.scoreA}-{set.scoreB}</strong>
                    </span>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex flex-col sm:flex-row gap-3 justify-center pt-2 relative z-10"
            >
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={triggerFinishMatch}
                className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-sm font-mono flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/20 cursor-pointer"
              >
                <Save className="w-4 h-4 stroke-[2.5]" />
                SIMPAN KE RIWAYAT
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={onExit}
                className="px-6 py-3.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 hover:text-slate-950 dark:hover:text-white font-bold text-sm font-mono border border-slate-200 dark:border-slate-700 cursor-pointer transition-all"
              >
                KEMBALI KE MENU
              </motion.button>
            </motion.div>
          </motion.div>
        ) : (
        /* ACTIVE SCORING SCOREBOARD */
        <motion.div
          key={`set-cards-${state.currentSetIndex}-${state.courtSides.leftTeam}`}
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -20 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          {/* LEFT TEAM SCORECARD */}
          <div className="relative group">
            {/* Clickable Area to Add Point */}
            <div
              onClick={() => addPoint(leftTeamKey)}
              className="bg-white/90 dark:bg-slate-900/60 rounded-3xl border-2 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700/80 p-8 text-center flex flex-col justify-between h-[26rem] md:h-[30rem] shadow-lg hover:shadow-xl dark:shadow-none hover:bg-slate-50/80 dark:hover:bg-slate-900/80 transition-all select-none relative overflow-hidden active:scale-[0.99] cursor-pointer"
            >
              {/* Highlight background glow */}
              <div className={`absolute top-0 left-0 right-0 h-1.5 ${leftTeamKey === "A" ? "bg-amber-400" : "bg-cyan-400"}`}></div>

              {/* Server indicator in background */}
              {state.servingTeam === leftTeamKey && (
                <div className="absolute top-3 left-4 flex items-center gap-1.5 px-2.5 py-1 bg-amber-400 text-slate-950 rounded-full text-[10px] font-bold font-mono tracking-wide shadow animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-950"></span>
                  MELAKUKAN SERVIS
                </div>
              )}

              {/* Set counter display */}
              <div className="absolute top-3 right-4 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 text-xs font-black tracking-wider text-slate-700 dark:text-slate-200 shadow-sm flex items-center gap-2">
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">SET MENANG:</span>
                <span className={`text-xl font-black font-sans ${leftTeamKey === "A" ? "text-amber-600 dark:text-amber-400" : "text-cyan-600 dark:text-cyan-400"}`}>
                  {leftSetsWon} <span className="text-xs font-bold text-slate-400 dark:text-slate-500 font-mono">/ {targetSetsToWin}</span>
                </span>
              </div>

              {/* Team Name */}
              <div className="pt-6 flex flex-col items-center justify-center relative">
                <div className="flex items-center gap-1.5 px-6 max-w-full">
                  <h3 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white truncate leading-tight tracking-tight">{leftTeamTitle}</h3>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openEditModal();
                    }}
                    className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-950/40 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800/40 transition-colors cursor-pointer shrink-0"
                    title="Edit Nama"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                </div>
                <span className={`text-3xl md:text-4xl font-bold uppercase tracking-tight mt-2 truncate max-w-full px-6 ${leftTeamKey === "A" ? "text-amber-600 dark:text-amber-400" : "text-cyan-600 dark:text-cyan-400"}`}>
                  {leftTeamSub}
                </span>
              </div>

              {/* Massive Score Score */}
              <div className="my-1 flex items-center justify-center">
                <motion.span
                  key={leftScore}
                  initial={{ scale: 0.8, y: 15, filter: "blur(4px)" }}
                  animate={{ scale: 1, y: 0, filter: "blur(0px)" }}
                  transition={{ type: "spring", stiffness: 450, damping: 15 }}
                  className="text-[16rem] md:text-[20rem] font-black font-['Arial'] text-slate-900 dark:text-white tracking-tighter block select-none leading-none"
                >
                  {leftScore}
                </motion.span>
              </div>

              {/* Hint */}
              <div className="text-[11px] text-slate-400 dark:text-slate-500 font-mono tracking-wide uppercase flex items-center justify-center gap-1">
                <Plus className="w-3 h-3 text-slate-400 dark:text-slate-500" /> TAP UNTUK MENAMBAH POIN
              </div>
            </div>

            {/* Subtract Score Button underneath */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                subtractPoint(leftTeamKey);
              }}
              disabled={leftScore === 0}
              className={`absolute bottom-3 right-3 p-2 rounded-xl border transition-all flex items-center justify-center gap-1 font-mono text-[10px] font-bold z-10 cursor-pointer ${
                leftScore > 0
                  ? "bg-white dark:bg-slate-950 hover:bg-red-50 dark:hover:bg-red-500/10 text-red-600 dark:text-red-400 border-slate-200 dark:border-slate-800 hover:border-red-200 dark:hover:border-red-500/20 shadow-sm"
                  : "bg-slate-100/60 dark:bg-slate-950/20 text-slate-400 dark:text-slate-700 border-transparent cursor-not-allowed"
              }`}
              title="Kurangi 1 Poin"
            >
              <Minus className="w-3 h-3" />
              POIN -1
            </button>
          </div>

          {/* RIGHT TEAM SCORECARD */}
          <div className="relative group">
            {/* Clickable Area to Add Point */}
            <div
              onClick={() => addPoint(rightTeamKey)}
              className="bg-white/90 dark:bg-slate-900/60 rounded-3xl border-2 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700/80 p-8 text-center flex flex-col justify-between h-[26rem] md:h-[30rem] shadow-lg hover:shadow-xl dark:shadow-none hover:bg-slate-50/80 dark:hover:bg-slate-900/80 transition-all select-none relative overflow-hidden active:scale-[0.99] cursor-pointer"
            >
              {/* Highlight background glow */}
              <div className={`absolute top-0 left-0 right-0 h-1.5 ${rightTeamKey === "A" ? "bg-amber-400" : "bg-cyan-400"}`}></div>

              {/* Server indicator in background */}
              {state.servingTeam === rightTeamKey && (
                <div className="absolute top-3 left-4 flex items-center gap-1.5 px-2.5 py-1 bg-amber-400 text-slate-950 rounded-full text-[10px] font-bold font-mono tracking-wide shadow animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-950"></span>
                  MELAKUKAN SERVIS
                </div>
              )}

              {/* Set counter display */}
              <div className="absolute top-3 right-4 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 text-xs font-black tracking-wider text-slate-700 dark:text-slate-200 shadow-sm flex items-center gap-2">
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">SET MENANG:</span>
                <span className={`text-xl font-black font-sans ${rightTeamKey === "A" ? "text-amber-600 dark:text-amber-400" : "text-cyan-600 dark:text-cyan-400"}`}>
                  {rightSetsWon} <span className="text-xs font-bold text-slate-400 dark:text-slate-500 font-mono">/ {targetSetsToWin}</span>
                </span>
              </div>

              {/* Team Name */}
              <div className="pt-6 flex flex-col items-center justify-center relative">
                <div className="flex items-center gap-1.5 px-6 max-w-full">
                  <h3 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white truncate leading-tight tracking-tight">{rightTeamTitle}</h3>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openEditModal();
                    }}
                    className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-950/40 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800/40 transition-colors cursor-pointer shrink-0"
                    title="Edit Nama"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                </div>
                <span className={`text-3xl md:text-4xl font-bold uppercase tracking-tight mt-2 truncate max-w-full px-6 ${rightTeamKey === "A" ? "text-amber-600 dark:text-amber-400" : "text-cyan-600 dark:text-cyan-400"}`}>
                  {rightTeamSub}
                </span>
              </div>

              {/* Massive Score Score */}
              <div className="my-1 flex items-center justify-center">
                <motion.span
                  key={rightScore}
                  initial={{ scale: 0.8, y: 15, filter: "blur(4px)" }}
                  animate={{ scale: 1, y: 0, filter: "blur(0px)" }}
                  transition={{ type: "spring", stiffness: 450, damping: 15 }}
                  className="text-[16rem] md:text-[20rem] font-black font-['Arial'] text-slate-900 dark:text-white tracking-tighter block select-none leading-none"
                >
                  {rightScore}
                </motion.span>
              </div>

              {/* Hint */}
              <div className="text-[11px] text-slate-400 dark:text-slate-500 font-mono tracking-wide uppercase flex items-center justify-center gap-1">
                <Plus className="w-3 h-3 text-slate-400 dark:text-slate-500" /> TAP UNTUK MENAMBAH POIN
              </div>
            </div>

            {/* Subtract Score Button underneath */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                subtractPoint(rightTeamKey);
              }}
              disabled={rightScore === 0}
              className={`absolute bottom-3 right-3 p-2 rounded-xl border transition-all flex items-center justify-center gap-1 font-mono text-[10px] font-bold z-10 cursor-pointer ${
                rightScore > 0
                  ? "bg-white dark:bg-slate-950 hover:bg-red-50 dark:hover:bg-red-500/10 text-red-600 dark:text-red-400 border-slate-200 dark:border-slate-800 hover:border-red-200 dark:hover:border-red-500/20 shadow-sm"
                  : "bg-slate-100/60 dark:bg-slate-950/20 text-slate-400 dark:text-slate-700 border-transparent cursor-not-allowed"
              }`}
              title="Kurangi 1 Poin"
            >
              <Minus className="w-3 h-3" />
              POIN -1
            </button>
          </div>
        </motion.div>
      )}
      </AnimatePresence>

      {/* MID-CONTROL ACTION BAR */}
      {!state.isMatchOver && (
        <div className="flex flex-wrap items-center justify-center gap-3 bg-white/80 dark:bg-slate-950/60 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          {/* Set Tracker Label */}
          <div className="px-4 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 font-mono text-xs font-bold text-slate-800 dark:text-white mr-auto">
            🏁 {getSetLabel()}
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap gap-2.5">
            {/* Edit Names */}
            <button
              onClick={openEditModal}
              className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold font-mono bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 transition-all cursor-pointer shadow-sm dark:shadow-none"
              title="Edit nama tim dan nama pemain"
            >
              <Pencil className="w-3.5 h-3.5" />
              Edit Nama
            </button>

            {/* Undo */}
            <button
              onClick={triggerUndo}
              disabled={state.history.length === 0}
              className={`flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold font-mono border transition-all cursor-pointer ${
                state.history.length > 0
                  ? "bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-none"
                  : "bg-slate-100/50 dark:bg-slate-900/40 text-slate-400 dark:text-slate-600 border-transparent cursor-not-allowed"
              }`}
              title="Batalkan poin terakhir"
            >
              <Undo2 className="w-3.5 h-3.5" />
              Batal (Undo)
            </button>

            {/* Switch sides */}
            <button
              onClick={triggerSideSwitch}
              className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold font-mono bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 transition-all cursor-pointer shadow-sm dark:shadow-none"
              title="Pindah sisi lapangan kiri/kanan di layar"
            >
              <ArrowLeftRight className="w-3.5 h-3.5" />
              Pindah Lapangan
            </button>

            {/* Reset */}
            <button
              onClick={triggerReset}
              className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold font-mono bg-slate-100 dark:bg-slate-900 hover:bg-red-50 dark:hover:bg-red-500/10 text-red-600 dark:text-red-400 border border-slate-200 dark:border-slate-800 hover:border-red-200 dark:hover:border-red-500/20 transition-all cursor-pointer shadow-sm dark:shadow-none"
              title="Setel ulang skor game ini"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Ulang (Reset)
            </button>

            {/* Finish match prematurely */}
            <button
              onClick={() => {
                if (window.confirm("Selesaikan pertandingan sekarang secara paksa dan simpan hasil saat ini?")) {
                  triggerFinishMatch();
                }
              }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold font-mono bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md shadow-emerald-500/10 transition-all cursor-pointer"
              title="Selesaikan game & simpan"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
              Selesai & Simpan
            </button>
          </div>
        </div>
      )}

      {/* COURT GRAPHICS VISUALIZER PANEL */}
      <CourtVisualizer
        sport={settings.sport}
        mode={settings.mode}
        playerNames={playerNames}
        scoreA={state.currentScoreA}
        scoreB={state.currentScoreB}
        servingTeam={state.servingTeam}
        servingPlayerIndex={state.servingPlayerIndex}
        receivingPlayerIndex={state.receivingPlayerIndex}
        courtSides={state.courtSides}
      />

      {/* EDIT NAMES OVERLAY MODAL */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Pencil className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">Edit Nama Pemain / Tim</h3>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content Body */}
            <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
              {/* Team A names */}
              <div className="space-y-2.5">
                <h4 className="text-[11px] font-bold text-amber-600 dark:text-amber-400 font-mono uppercase tracking-wider">Tim / Pemain A</h4>
                <div className="space-y-2">
                  <div>
                    <label className="text-[10px] text-slate-500 dark:text-slate-400 font-mono block mb-1">Nama Tim A</label>
                    <input
                      type="text"
                      value={tempTeamAName}
                      onChange={(e) => setTempTeamAName(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-violet-500 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white outline-none"
                      placeholder="Nama Tim A"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 dark:text-slate-400 font-mono block mb-1">Pemain A1 {isDoubles && "(Servis Awal)"}</label>
                    <input
                      type="text"
                      value={tempPlayerA1}
                      onChange={(e) => setTempPlayerA1(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-violet-500 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white outline-none"
                      placeholder="Nama Pemain A1"
                    />
                  </div>
                  {isDoubles && (
                    <div>
                      <label className="text-[10px] text-slate-500 dark:text-slate-400 font-mono block mb-1">Pemain A2</label>
                      <input
                        type="text"
                        value={tempPlayerA2}
                        onChange={(e) => setTempPlayerA2(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-violet-500 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white outline-none"
                        placeholder="Nama Pemain A2"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Team B names */}
              <div className="space-y-2.5">
                <h4 className="text-[11px] font-bold text-cyan-600 dark:text-cyan-400 font-mono uppercase tracking-wider">Tim / Pemain B</h4>
                <div className="space-y-2">
                  <div>
                    <label className="text-[10px] text-slate-500 dark:text-slate-400 font-mono block mb-1">Nama Tim B</label>
                    <input
                      type="text"
                      value={tempTeamBName}
                      onChange={(e) => setTempTeamBName(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-violet-500 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white outline-none"
                      placeholder="Nama Tim B"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 dark:text-slate-400 font-mono block mb-1">Pemain B1 {isDoubles && "(Penerima Awal)"}</label>
                    <input
                      type="text"
                      value={tempPlayerB1}
                      onChange={(e) => setTempPlayerB1(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-violet-500 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white outline-none"
                      placeholder="Nama Pemain B1"
                    />
                  </div>
                  {isDoubles && (
                    <div>
                      <label className="text-[10px] text-slate-500 dark:text-slate-400 font-mono block mb-1">Pemain B2</label>
                      <input
                        type="text"
                        value={tempPlayerB2}
                        onChange={(e) => setTempPlayerB2(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-violet-500 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white outline-none"
                        placeholder="Nama Pemain B2"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="p-4 bg-slate-50 dark:bg-slate-950/60 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-all cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={saveEditedNames}
                className="px-4 py-2 rounded-xl text-xs font-bold font-mono bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-md shadow-indigo-500/10 cursor-pointer"
              >
                Simpan Nama
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AUDIO & VOICE SETTINGS MODAL */}
      {isAudioModalOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
            {/* Header */}
            <div className="flex items-center justify-between p-4 px-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-600 dark:text-violet-400">
                  <Sliders className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm">Pengaturan Audio & Suara Wasit</h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">Efek suara Web Audio & pengumuman TTS Bahasa Indonesia</p>
                </div>
              </div>
              <button
                onClick={() => setIsAudioModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-5 overflow-y-auto">
              {/* Volume Master Slider */}
              <div className="bg-slate-50 dark:bg-slate-950/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-800/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Volume2 className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                    <span className="text-xs font-bold text-slate-900 dark:text-white font-mono uppercase">Volume Utama</span>
                  </div>
                  <span className="text-xs font-mono font-bold text-violet-600 dark:text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded-lg border border-violet-500/20">
                    {Math.round(masterVolume * 100)}%
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => handleVolumeChange(masterVolume > 0 ? 0 : 0.8)}
                    className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 rounded transition-colors cursor-pointer"
                  >
                    {masterVolume === 0 ? <VolumeX className="w-4 h-4 text-red-500" /> : <Volume2 className="w-4 h-4 text-slate-600 dark:text-slate-300" />}
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={masterVolume}
                    onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                    className="w-full accent-violet-600 cursor-pointer h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none"
                  />
                </div>
              </div>

              {/* TTS Indonesian Announcement Section */}
              <div className="bg-slate-50 dark:bg-slate-950/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-800/80 space-y-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Mic className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white font-mono uppercase">Pengumuman Suara (TTS Bahasa Indonesia)</h4>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">Menyebutkan skor, giliran servis, dan jus otomatis</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSpeechEnabled(!speechEnabled)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                      speechEnabled ? "bg-violet-600" : "bg-slate-300 dark:bg-slate-800"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        speechEnabled ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>

                {/* Speech Speed Selector */}
                <div className="space-y-1.5 pt-1">
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 font-mono uppercase">Kecepatan Bicara Wasit</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: "0.8x Santai", val: 0.8 },
                      { label: "1.0x Normal", val: 1.0 },
                      { label: "1.2x Cepat", val: 1.2 },
                    ].map((item) => (
                      <button
                        key={`speed-${item.val}`}
                        type="button"
                        onClick={() => handleSpeechSpeedChange(item.val)}
                        className={`py-1.5 px-2 rounded-xl text-xs font-mono font-semibold border transition-all cursor-pointer ${
                          speechSpeed === item.val
                            ? "bg-violet-500/20 text-violet-700 dark:text-violet-300 border-violet-500/40"
                            : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:text-slate-900 dark:hover:text-white"
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Indonesian Voice Test Buttons */}
                <div className="space-y-1.5 pt-1">
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 font-mono uppercase">Uji Pengumuman Suara Bahasa Indonesia</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => speakCustomText("Pindah servis. Skor lima, tiga. Servis oleh Budi.")}
                      className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-[11px] font-mono text-slate-700 dark:text-slate-200 transition-all cursor-pointer shadow-sm dark:shadow-none"
                    >
                      <Megaphone className="w-3 h-3 text-emerald-500 dark:text-emerald-400" />
                      <span>Uji Poin Biasa</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => speakCustomText("Jus! Deuce! Skor dua puluh sama. Servis oleh Siti.")}
                      className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-[11px] font-mono text-slate-700 dark:text-slate-200 transition-all cursor-pointer shadow-sm dark:shadow-none"
                    >
                      <Zap className="w-3 h-3 text-amber-500 dark:text-amber-400" />
                      <span>Uji Panggilan Jus</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => speakCustomText("Game point untuk Tim Garuda! Skor dua puluh, sembilan belas.")}
                      className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-[11px] font-mono text-slate-700 dark:text-slate-200 transition-all cursor-pointer shadow-sm dark:shadow-none"
                    >
                      <Flame className="w-3 h-3 text-red-500 dark:text-red-400" />
                      <span>Uji Game Point</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => speakCustomText("Pertandingan selesai! Selamat kepada Tim Rajawali keluar sebagai juara!")}
                      className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-[11px] font-mono text-slate-700 dark:text-slate-200 transition-all cursor-pointer shadow-sm dark:shadow-none"
                    >
                      <Trophy className="w-3 h-3 text-yellow-500 dark:text-yellow-400" />
                      <span>Uji Juara</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Sound Effects Section */}
              <div className="bg-slate-50 dark:bg-slate-950/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-800/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Volume2 className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white font-mono uppercase">Efek Suara Lapangan (SFX)</h4>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">Peluit, bel point, tepuk tangan, dan buzzer arena</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAudioEnabled(!audioEnabled)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                      audioEnabled ? "bg-emerald-600" : "bg-slate-300 dark:bg-slate-800"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        audioEnabled ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>

                {/* SFX Tester Buttons */}
                <div className="space-y-1.5 pt-1">
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 font-mono uppercase">Uji Coba Efek Suara</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => playSound("whistle")}
                      className="py-1.5 px-2 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-[11px] font-mono text-slate-700 dark:text-slate-300 transition-all cursor-pointer shadow-sm dark:shadow-none"
                    >
                      🏸 Peluit
                    </button>
                    <button
                      type="button"
                      onClick={() => playSound("special")}
                      className="py-1.5 px-2 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-[11px] font-mono text-slate-700 dark:text-slate-300 transition-all cursor-pointer shadow-sm dark:shadow-none"
                    >
                      🔔 Bel Game
                    </button>
                    <button
                      type="button"
                      onClick={() => playSound("deuce")}
                      className="py-1.5 px-2 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-[11px] font-mono text-slate-700 dark:text-slate-300 transition-all cursor-pointer shadow-sm dark:shadow-none"
                    >
                      ⚡ Jus Tone
                    </button>
                    <button
                      type="button"
                      onClick={() => playSound("clapping")}
                      className="py-1.5 px-2 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-[11px] font-mono text-slate-700 dark:text-slate-300 transition-all cursor-pointer shadow-sm dark:shadow-none"
                    >
                      👏 Tepuk Tangan
                    </button>
                    <button
                      type="button"
                      onClick={() => playSound("buzzer")}
                      className="py-1.5 px-2 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-[11px] font-mono text-slate-700 dark:text-slate-300 transition-all cursor-pointer shadow-sm dark:shadow-none"
                    >
                      🚨 Buzzer
                    </button>
                    <button
                      type="button"
                      onClick={() => playSound("switch")}
                      className="py-1.5 px-2 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-[11px] font-mono text-slate-700 dark:text-slate-300 transition-all cursor-pointer shadow-sm dark:shadow-none"
                    >
                      🔄 Pindah Sisi
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="p-4 bg-slate-50 dark:bg-slate-950/60 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <button
                type="button"
                onClick={triggerManualScoreAnnouncement}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold font-mono bg-violet-600/15 text-violet-700 dark:text-violet-300 hover:bg-violet-600/25 border border-violet-500/30 transition-all cursor-pointer"
              >
                <Megaphone className="w-3.5 h-3.5" />
                <span>Panggil Skor Saat Ini</span>
              </button>

              <button
                type="button"
                onClick={() => setIsAudioModalOpen(false)}
                className="px-5 py-2 rounded-xl text-xs font-bold font-mono bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-md shadow-indigo-500/10 cursor-pointer"
              >
                Tutup & Terapkan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
