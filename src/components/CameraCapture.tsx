import { useRef, useState } from 'react';
import { Camera, RefreshCw, X } from 'lucide-react';
import { useApp } from '@/lib/context';
import { compressImage } from '@/lib/image';

interface Props {
  onCapture: (dataUrl: string) => void;
  existing?: string;
  compact?: boolean;
}

export function CameraCapture({ onCapture, existing, compact }: Props) {
  const { t } = useApp();
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | undefined>(existing);
  const [busy, setBusy] = useState(false);

  const handleFile = async (file: File) => {
    setBusy(true);
    try {
      const compressed = await compressImage(file, 1024, 0.7);
      setPreview(compressed);
      onCapture(compressed);
    } catch {
      // fall back to raw
      const reader = new FileReader();
      reader.onload = () => {
        setPreview(reader.result as string);
        onCapture(reader.result as string);
      };
      reader.readAsDataURL(file);
    } finally {
      setBusy(false);
    }
  };

  const triggerInput = (capture: 'user' | 'environment' | 'none') => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    if (capture !== 'none') input.setAttribute('capture', capture);
    input.onchange = () => {
      const file = input.files?.[0];
      if (file) handleFile(file);
    };
    input.click();
  };

  const openCamera = () => triggerInput('environment');

  if (preview) {
    return (
      <div className="relative">
        <img src={preview} alt="captured" className="w-full rounded-2xl object-cover max-h-64" />
        <div className="absolute top-2 right-2 flex gap-2">
          <button
            type="button"
            onClick={() => {
              setPreview(undefined);
              onCapture('');
            }}
            className="rounded-full bg-black/50 p-2 text-white active:bg-black/70"
          >
            <X size={18} />
          </button>
          <button
            type="button"
            onClick={openCamera}
            className="rounded-full bg-black/50 p-2 text-white active:bg-black/70"
          >
            <RefreshCw size={18} />
          </button>
        </div>
        <div className="mt-2 flex items-center gap-1.5 text-sm text-emerald-700">
          <Camera size={16} /> {t('photoTaken')}
        </div>
      </div>
    );
  }

  return (
    <div>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />
      <button
        type="button"
        onClick={openCamera}
        disabled={busy}
        className={`flex w-full flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 ${compact ? 'py-6' : 'py-10'} text-gray-500 active:scale-[0.99] transition-transform`}
      >
        {busy ? (
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-emerald-600" />
        ) : (
          <Camera size={compact ? 28 : 40} className="text-emerald-600" />
        )}
        <span className="font-medium">{t('takePhoto')}</span>
      </button>
    </div>
  );
}
