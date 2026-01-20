import React from 'react';
import { Delete, Check } from 'lucide-react';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

interface NumberPadProps {
  value: string;
  onChange: (val: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
}

export const NumberPad: React.FC<NumberPadProps> = ({ value, onChange, onSubmit, disabled }) => {
  const safeHaptic = async (style: ImpactStyle) => {
    try {
      await Haptics.impact({ style });
    } catch (e) {
      // Ignore haptics error so the app doesn't crash
    }
  };

  const handlePress = async (num: string) => {
    if (disabled) return;
    await safeHaptic(ImpactStyle.Light);
    // Prevent extremely long numbers
    if (value.length < 10) {
      onChange(value + num);
    }
  };

  const handleDelete = async () => {
    if (disabled) return;
    await safeHaptic(ImpactStyle.Light);
    onChange(value.slice(0, -1));
  };

  const handleSubmit = async () => {
    if (disabled) return;
    await safeHaptic(ImpactStyle.Medium);
    onSubmit();
  };

  return (
    <div className="w-full max-w-sm mx-auto grid grid-cols-3 gap-3 p-2 relative z-10">
      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
        <button
          key={num}
          onClick={() => handlePress(num.toString())}
          className="cursor-pointer h-16 rounded-2xl bg-white dark:bg-slate-700 shadow-sm border-b-4 border-slate-200 dark:border-slate-900 active:border-b-0 active:translate-y-1 transition-all text-2xl font-bold text-slate-700 dark:text-white flex items-center justify-center touch-manipulation select-none"
        >
          {num}
        </button>
      ))}
      
      {/* Bottom Row */}
      <button
        onClick={() => handlePress('-')}
        className="cursor-pointer h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold text-xl flex items-center justify-center active:bg-slate-200 touch-manipulation select-none"
      >
        -
      </button>
      
      <button
        onClick={() => handlePress('0')}
        className="cursor-pointer h-16 rounded-2xl bg-white dark:bg-slate-700 shadow-sm border-b-4 border-slate-200 dark:border-slate-900 active:border-b-0 active:translate-y-1 transition-all text-2xl font-bold text-slate-700 dark:text-white flex items-center justify-center touch-manipulation select-none"
      >
        0
      </button>

      <button
        onClick={handleDelete}
        className="cursor-pointer h-16 rounded-2xl bg-red-50 dark:bg-red-900/30 text-red-500 flex items-center justify-center active:bg-red-100 dark:active:bg-red-900/50 touch-manipulation select-none"
      >
        <Delete className="w-6 h-6" />
      </button>

      <button
        onClick={handleSubmit}
        className="cursor-pointer col-span-3 mt-2 h-16 rounded-2xl bg-tusgu-blue text-white shadow-md shadow-blue-900/20 active:scale-[0.98] transition-all text-xl font-bold flex items-center justify-center gap-2 touch-manipulation select-none"
      >
        Submit Answer <Check className="w-6 h-6" />
      </button>
    </div>
  );
};