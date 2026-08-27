// Sound and voice synthesis utility for Indonesian Scoreboard

let audioCtx: AudioContext | null = null;
let currentMasterVolume: number = 0.8;
let currentSpeechRate: number = 1.0;
let currentSpeechPitch: number = 1.0;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioCtx;
}

export function setMasterAudioVolume(volume: number) {
  currentMasterVolume = Math.max(0, Math.min(1, volume));
}

export function getMasterAudioVolume(): number {
  return currentMasterVolume;
}

export function setSpeechRate(rate: number) {
  currentSpeechRate = Math.max(0.5, Math.min(2.0, rate));
}

export function getSpeechRate(): number {
  return currentSpeechRate;
}

// Convert numbers into standard Indonesian sport vocabulary
export function numberToIndonesianWord(num: number, isScoreZeroAsKosong = true): string {
  if (num === 0) return isScoreZeroAsKosong ? "kosong" : "nol";
  
  const satuan = ["", "satu", "dua", "tiga", "empat", "lima", "enam", "tujuh", "delapan", "sembilan", "sepuluh", "sebelas"];
  
  if (num <= 11) return satuan[num];
  if (num < 20) return `${satuan[num - 10]} belas`;
  if (num < 100) {
    const puluhan = Math.floor(num / 10);
    const sisa = num % 10;
    return `${satuan[puluhan]} puluh${sisa > 0 ? ` ${satuan[sisa]}` : ""}`;
  }
  return num.toString();
}

// Play synthesized sound effects using Web Audio API
export type SoundEffectType = "point" | "special" | "buzzer" | "whistle" | "clapping" | "deuce" | "fault" | "switch";

export function playSound(type: SoundEffectType, volumeOverride?: number) {
  if (currentMasterVolume <= 0 && volumeOverride === undefined) return;
  const vol = volumeOverride !== undefined ? volumeOverride : currentMasterVolume;

  try {
    const ctx = getAudioContext();
    if (ctx.state === "suspended") {
      ctx.resume();
    }

    const now = ctx.currentTime;

    if (type === "clapping") {
      // Synthesize rich, realistic applause/clapping purely using Web Audio API
      const duration = 2.8;
      const numClaps = 55;
      
      const bufferSize = Math.floor(ctx.sampleRate * 0.12);
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      
      for (let i = 0; i < numClaps; i++) {
        const rand = Math.random();
        const clapTime = now + (rand * rand) * duration;
        
        const noise = ctx.createBufferSource();
        noise.buffer = noiseBuffer;
        
        const filter = ctx.createBiquadFilter();
        filter.type = "bandpass";
        filter.frequency.setValueAtTime(900 + Math.random() * 900, clapTime);
        filter.Q.setValueAtTime(2.8, clapTime);
        
        const noiseGain = ctx.createGain();
        const volumeMultiplier = Math.max(0.12, 1.0 - (clapTime - now) / duration);
        const noiseVol = (0.15 + Math.random() * 0.22) * volumeMultiplier * vol;
        
        noiseGain.gain.setValueAtTime(Math.max(0.001, noiseVol), clapTime);
        noiseGain.gain.exponentialRampToValueAtTime(0.0001, clapTime + 0.04 + Math.random() * 0.05);
        
        noise.connect(filter);
        filter.connect(noiseGain);
        noiseGain.connect(ctx.destination);
        
        noise.start(clapTime);
        noise.stop(clapTime + 0.12);

        // Warm cavity resonance
        if (Math.random() > 0.25) {
          const osc = ctx.createOscillator();
          const thumpGain = ctx.createGain();
          
          osc.type = "triangle";
          osc.frequency.setValueAtTime(140 + Math.random() * 80, clapTime);
          osc.frequency.exponentialRampToValueAtTime(65, clapTime + 0.03);
          
          const thumpVol = (0.07 + Math.random() * 0.1) * volumeMultiplier * vol;
          thumpGain.gain.setValueAtTime(Math.max(0.001, thumpVol), clapTime);
          thumpGain.gain.exponentialRampToValueAtTime(0.0001, clapTime + 0.035);
          
          osc.connect(thumpGain);
          thumpGain.connect(ctx.destination);
          
          osc.start(clapTime);
          osc.stop(clapTime + 0.04);
        }
      }
      return;
    }

    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    if (type === "point") {
      // High clean crisp chime for standard point scored
      osc.type = "sine";
      osc.frequency.setValueAtTime(660, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.12);
      gainNode.gain.setValueAtTime(0.2 * vol, now);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc.start(now);
      osc.stop(now + 0.15);
    } else if (type === "special") {
      // Dual harmonious bell chime for game point / match point
      osc.type = "triangle";
      osc.frequency.setValueAtTime(880, now);
      gainNode.gain.setValueAtTime(0.22 * vol, now);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      
      const osc2 = ctx.createOscillator();
      const gainNode2 = ctx.createGain();
      osc2.connect(gainNode2);
      gainNode2.connect(ctx.destination);
      osc2.type = "triangle";
      osc2.frequency.setValueAtTime(1174.66, now + 0.13); // D6
      gainNode2.gain.setValueAtTime(0.25 * vol, now + 0.13);
      gainNode2.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.start(now);
      osc.stop(now + 0.13);
      osc2.start(now + 0.13);
      osc2.stop(now + 0.35);
    } else if (type === "deuce") {
      // Suspenseful dual rising tone for Deuce / Jus
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.linearRampToValueAtTime(659.25, now + 0.18);
      gainNode.gain.setValueAtTime(0.18 * vol, now);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc.start(now);
      osc.stop(now + 0.25);
    } else if (type === "buzzer") {
      // Long arena match-end buzzer sound
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(160, now);
      osc.frequency.linearRampToValueAtTime(110, now + 0.65);
      gainNode.gain.setValueAtTime(0.28 * vol, now);
      gainNode.gain.linearRampToValueAtTime(0.001, now + 0.65);
      osc.start(now);
      osc.stop(now + 0.65);
    } else if (type === "whistle") {
      // Realistic sports referee whistle oscillation trill
      osc.type = "sine";
      osc.frequency.setValueAtTime(2550, now);
      osc.frequency.linearRampToValueAtTime(2700, now + 0.08);
      osc.frequency.linearRampToValueAtTime(2450, now + 0.18);
      osc.frequency.linearRampToValueAtTime(2650, now + 0.35);

      // Second harmonic for whistle air tube realism
      const oscHarmonic = ctx.createOscillator();
      const gainHarmonic = ctx.createGain();
      oscHarmonic.connect(gainHarmonic);
      gainHarmonic.connect(ctx.destination);
      oscHarmonic.type = "sine";
      oscHarmonic.frequency.setValueAtTime(5100, now);

      gainNode.gain.setValueAtTime(0.18 * vol, now);
      gainNode.gain.linearRampToValueAtTime(0.18 * vol, now + 0.28);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.42);

      gainHarmonic.gain.setValueAtTime(0.04 * vol, now);
      gainHarmonic.gain.exponentialRampToValueAtTime(0.001, now + 0.42);

      osc.start(now);
      osc.stop(now + 0.42);
      oscHarmonic.start(now);
      oscHarmonic.stop(now + 0.42);
    } else if (type === "fault") {
      // Short referee fault/service change cue
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(200, now + 0.15);
      gainNode.gain.setValueAtTime(0.15 * vol, now);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
      osc.start(now);
      osc.stop(now + 0.16);
    } else if (type === "switch") {
      // Swift whoosh sound for court side swap
      osc.type = "sine";
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.exponentialRampToValueAtTime(900, now + 0.12);
      osc.frequency.exponentialRampToValueAtTime(450, now + 0.22);
      gainNode.gain.setValueAtTime(0.12 * vol, now);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc.start(now);
      osc.stop(now + 0.25);
    }
  } catch (e) {
    console.error("Audio Context error:", e);
  }
}

// Speak any custom text in Indonesian
export function speakCustomText(
  text: string,
  options?: { rate?: number; pitch?: number; volume?: number }
) {
  if (typeof window === "undefined" || !window.speechSynthesis) return;

  try {
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "id-ID";

    const voices = window.speechSynthesis.getVoices();
    // Prioritize high-quality Indonesian voices
    const idVoice = voices.find(
      (v) =>
        v.lang === "id-ID" ||
        v.lang === "id_ID" ||
        v.lang === "in-ID" ||
        v.lang.toLowerCase().includes("indonesia")
    );

    if (idVoice) {
      utterance.voice = idVoice;
    }

    utterance.rate = options?.rate ?? currentSpeechRate;
    utterance.pitch = options?.pitch ?? currentSpeechPitch;
    utterance.volume = options?.volume ?? currentMasterVolume;

    window.speechSynthesis.speak(utterance);
  } catch (e) {
    console.error("TTS custom speak error:", e);
  }
}

// Translate live scores into natural Indonesian sports speech
export function announceScoreIndonesian(
  scoreA: number,
  scoreB: number,
  playerANames: string[],
  playerBNames: string[],
  sport: string,
  servingTeam: "A" | "B",
  targetPoints: number,
  isGamePointA: boolean,
  isGamePointB: boolean,
  winner?: "A" | "B" | null,
  isDoubles?: boolean,
  servingPlayerIndex?: number,
  isServiceChanged?: boolean,
  completedSetWinner?: "A" | "B" | null,
  completedSetScoreA?: number,
  completedSetScoreB?: number,
  completedSetIndex?: number
) {
  if (typeof window === "undefined" || !window.speechSynthesis) return;

  const nameA = playerANames.join(" & ") || "Pemain A";
  const nameB = playerBNames.join(" & ") || "Pemain B";

  let sentence = "";

  // Helper to get active server's name
  let serverName = "";
  if (isDoubles) {
    const idx = servingPlayerIndex ?? 0;
    if (servingTeam === "A") {
      serverName = playerANames[idx] || playerANames[0] || "Pemain A";
    } else {
      serverName = playerBNames[idx] || playerBNames[0] || "Pemain B";
    }
  } else {
    serverName = servingTeam === "A" ? nameA : nameB;
  }

  const wordScoreA = numberToIndonesianWord(scoreA);
  const wordScoreB = numberToIndonesianWord(scoreB);

  const servicePrefix = isServiceChanged ? "Pindah servis. " : "";

  // 1. If a set (game) has just finished
  if (completedSetWinner) {
    const setWinnerName = completedSetWinner === "A" ? nameA : nameB;
    const gameLabel = completedSetIndex !== undefined ? `Game ke ${numberToIndonesianWord(completedSetIndex + 1)}` : "Game";
    const winScore = completedSetScoreA !== undefined ? numberToIndonesianWord(completedSetScoreA) : wordScoreA;
    const loseScore = completedSetScoreB !== undefined ? numberToIndonesianWord(completedSetScoreB) : wordScoreB;
    sentence = `${gameLabel} selesai. Dimenangkan oleh ${setWinnerName}. Skor akhir ${winScore} lawan ${loseScore}.`;
    
    // If the entire match is also over
    if (winner) {
      const matchWinnerName = winner === "A" ? nameA : nameB;
      sentence += ` Pertandingan selesai! Selamat kepada ${matchWinnerName} keluar sebagai juara!`;
    }
  } else if (winner) {
    // Fallback if match is over
    const matchWinnerName = winner === "A" ? nameA : nameB;
    sentence = `Pertandingan selesai! Pemenangnya adalah ${matchWinnerName}. Skor akhir ${wordScoreA} lawan ${wordScoreB}.`;
  } else if (isGamePointA) {
    sentence = `${servicePrefix}Game point untuk ${nameA}. Skor ${wordScoreA}, ${wordScoreB}. Servis oleh ${serverName}.`;
  } else if (isGamePointB) {
    sentence = `${servicePrefix}Game point untuk ${nameB}. Skor ${wordScoreB}, ${wordScoreA}. Servis oleh ${serverName}.`;
  } else if (scoreA === scoreB) {
    if (scoreA === 0) {
      sentence = `Mulai pertandingan. Servis oleh ${serverName}.`;
    } else if (scoreA >= targetPoints - 1) {
      sentence = `Jus! Deuce! Skor ${wordScoreA} sama. Servis oleh ${serverName}.`;
    } else {
      sentence = `${servicePrefix}Skor ${wordScoreA} sama. Servis oleh ${serverName}.`;
    }
  } else {
    // Natural announcement: serving score first, then receiver score
    if (servingTeam === "A") {
      sentence = `${servicePrefix}Skor ${wordScoreA}, ${wordScoreB}. Servis oleh ${serverName}.`;
    } else {
      sentence = `${servicePrefix}Skor ${wordScoreB}, ${wordScoreA}. Servis oleh ${serverName}.`;
    }
  }

  speakCustomText(sentence);
}
