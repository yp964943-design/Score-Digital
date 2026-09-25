import React from "react";
import { BookOpen, Award, CheckCircle2, ShieldCheck, ArrowLeftRight } from "lucide-react";

export const RulesInfo: React.FC = () => {
  return (
    <div id="rules-info-container" className="bg-white/80 dark:bg-slate-900/40 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 backdrop-blur-sm shadow-xl dark:shadow-none space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20">
          <BookOpen className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Regulasi & Aturan Resmi ITTF Tenis Meja</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">Standar resmi International Table Tennis Federation (ITTF Handbook Bagian 2)</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 1. Sistem Penilaian (ITTF Rule 2.11) */}
        <div className="p-4 bg-slate-50/80 dark:bg-slate-950/60 rounded-xl border border-slate-200/80 dark:border-slate-800/80 space-y-3">
          <h3 className="text-xs font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1.5 font-mono uppercase tracking-wider">
            <Award className="w-4 h-4" /> 1. Poin Game & Sistem Deuce (Rule 2.11)
          </h3>
          <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
              <span>Satu game dimenangkan oleh pemain/pasangan yang pertama kali mencapai <strong>11 poin</strong>.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
              <span><strong>Deuce (10-10):</strong> Jika kedua pemain mencapai skor 10-10, game harus dimenangkan oleh pemain yang terlebih dahulu unggul selisih <strong>2 poin</strong> (misal: 12-10, 13-11, 14-12, dst).</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
              <span><strong>Tanpa Batas Poin Maksimal:</strong> ITTF tidak memberlakukan batas maksimal poin pada saat deuce (berbeda dengan bulu tangkis yang dibatasi hingga 30). Game akan terus berlanjut hingga ada selisih 2 poin.</span>
            </li>
          </ul>
        </div>

        {/* 2. Format Pertandingan (ITTF Rule 2.12) */}
        <div className="p-4 bg-slate-50/80 dark:bg-slate-950/60 rounded-xl border border-slate-200/80 dark:border-slate-800/80 space-y-3">
          <h3 className="text-xs font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1.5 font-mono uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4" /> 2. Format Pertandingan Resmi (Rule 2.12)
          </h3>
          <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
              <span>Pertandingan ITTF dimainkan dalam jumlah game ganjil (*Best of Odd Games*):</span>
            </li>
            <li className="pl-4 space-y-1.5 text-[11px] text-slate-500 dark:text-slate-400">
              <p>• <strong>Best of 5 Games (Standar Umum ITTF):</strong> Pemenang adalah yang pertama mengumpulkan <strong>3 kemenangan game</strong> (skor akhir 3-0, 3-1, atau 3-2).</p>
              <p>• <strong>Best of 7 Games (Olimpiade & Kejuaraan Dunia):</strong> Pemenang adalah yang pertama mengumpulkan <strong>4 kemenangan game</strong> (skor akhir 4-0, 4-1, 4-2, atau 4-3).</p>
              <p>• <strong>Best of 3 Games (Format Cepat):</strong> Pemenang adalah yang pertama mengumpulkan <strong>2 kemenangan game</strong> (skor akhir 2-0 atau 2-1).</p>
            </li>
          </ul>
        </div>

        {/* 3. Rotasi Servis (ITTF Rule 2.13) */}
        <div className="p-4 bg-slate-50/80 dark:bg-slate-950/60 rounded-xl border border-slate-200/80 dark:border-slate-800/80 space-y-3">
          <h3 className="text-xs font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1.5 font-mono uppercase tracking-wider">
            <Award className="w-4 h-4" /> 3. Rotasi Servis & Giliran (Rule 2.13)
          </h3>
          <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
              <span>Hak servis berpindah secara otomatis setiap total skor gabungan bertambah <strong>2 poin</strong>.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
              <span><strong>Saat Deuce (10-10):</strong> Rotasi servis dipercepat menjadi bergantian setiap <strong>1 poin</strong> hingga game selesai.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
              <span><strong>Pergantian Game:</strong> Pemain yang menerima servis pertama di game sebelumnya akan menjadi pihak yang melakukan servis pertama di game berikutnya.</span>
            </li>
          </ul>
        </div>

        {/* 4. Ketentuan Ganda & Pindah Meja (ITTF Rule 2.08 & 2.14) */}
        <div className="p-4 bg-slate-50/80 dark:bg-slate-950/60 rounded-xl border border-slate-200/80 dark:border-slate-800/80 space-y-3">
          <h3 className="text-xs font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1.5 font-mono uppercase tracking-wider">
            <ArrowLeftRight className="w-4 h-4" /> 4. Regulasi Ganda & Pindah Meja (Rule 2.08 & 2.14)
          </h3>
          <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
              <span><strong>Servis Diagonal Ganda:</strong> Bola harus dipukul dari kotak kanan penyervis menyilang secara diagonal ke kotak kanan penerima.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
              <span><strong>Urutan Pukulan Bergantian:</strong> Kedua pasangan wajib memukul bola secara bergantian (*alternate striking*).</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
              <span><strong>Pindah Sisi Meja:</strong> Pemain berpindah sisi meja di setiap akhir game, dan pada <strong>game penentu</strong> (*deciding game*), pemain berpindah sisi meja ketika salah satu pemain mencapai <strong>5 poin</strong> pertama kali.</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};
