import { useState, useEffect, useRef } from 'react';
import { Leaf, Save, Send, WifiOff, Clock, CheckCircle2, Mic, MicOff, Loader2, AlertCircle, RotateCw } from 'lucide-react';
import { useApp } from '@/lib/context';
import { db, genLocalId, type DoctorRecord } from '@/lib/db';
import { syncAll, isOnline } from '@/lib/sync';
import { diagnoseLeaf, geminiConfigured } from '@/lib/gemini';
import { LargeButton, TextArea } from '@/components/ui';
import { CameraCapture } from '@/components/CameraCapture';
import { SyncBadge } from '@/components/SyncBadge';

export function CropDoctorScreen() {
  const { t, online } = useApp();
  const [image, setImage] = useState('');
  const [question, setQuestion] = useState('');
  const [saved, setSaved] = useState<DoctorRecord | null>(null);
  const [queries, setQueries] = useState<DoctorRecord[]>([]);
  const [asking, setAsking] = useState(false);
  const [error, setError] = useState('');
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  const loadQueries = () => {
    db.doctor.orderBy('created_at').reverse().limit(20).toArray().then(setQueries);
  };

  useEffect(() => {
    loadQueries();
  }, [saved]);

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setListening(false);
  };

  const startListening = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      setError(t('speechUnsupported'));
      return;
    }
    setError('');
    const rec = new SR();
    rec.lang = 'kn-IN';
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.onresult = (e: any) => {
      const transcript = e.results[0][0].transcript;
      setQuestion((prev) => (prev ? prev + ' ' : '') + transcript);
    };
    rec.onerror = () => {
      setListening(false);
    };
    rec.onend = () => {
      setListening(false);
      recognitionRef.current = null;
    };
    recognitionRef.current = rec;
    setListening(true);
    rec.start();
  };

  const persistRecord = async (status: DoctorRecord['status']) => {
    const record: DoctorRecord = {
      local_id: genLocalId('doctor'),
      date: new Date().toISOString().slice(0, 10),
      question: question || undefined,
      image: image || undefined,
      status,
      created_at: Date.now(),
    };
    await db.doctor.put(record);
    if (isOnline()) {
      await syncAll();
      const updated = await db.doctor.get(record.local_id);
      return updated || record;
    }
    return record;
  };

  const handleSaveOffline = async () => {
    setError('');
    const record = await persistRecord('saved_offline');
    setSaved(record);
    setImage('');
    setQuestion('');
    loadQueries();
  };

  const handleAskAi = async () => {
    setAsking(true);
    setError('');
    if (!online || !geminiConfigured) {
      await handleSaveOffline();
      setAsking(false);
      return;
    }
    // 1. Save the record locally first (compressed image + question)
    const record: DoctorRecord = {
      local_id: genLocalId('doctor'),
      date: new Date().toISOString().slice(0, 10),
      question: question || undefined,
      image: image || undefined,
      status: 'pending',
      created_at: Date.now(),
    };
    await db.doctor.put(record);

    try {
      // 2. Call Gemini API
      const answer = await diagnoseLeaf(image, question);
      // 3. Save the answer locally
      await db.doctor.update(record.local_id, { status: 'answered', answer });
      // 4. Sync to Supabase (now includes image + answer)
      await syncAll();
      const final = await db.doctor.get(record.local_id);
      setSaved(final || record);
      setImage('');
      setQuestion('');
    } catch (err) {
      // Gemini failed — keep record as pending for auto-retry when online
      const updated = await db.doctor.get(record.local_id);
      setSaved(updated || record);
      const errMsg = err instanceof Error ? err.message : t('geminiError');
      setError(`${t('geminiError')} (${errMsg})`);
      setImage('');
      setQuestion('');
    }
    setAsking(false);
    loadQueries();
  };

  const handleRetry = async (localId: string) => {
    setAsking(true);
    setError('');
    const rec = await db.doctor.get(localId);
    if (!rec) return;
    try {
      const answer = await diagnoseLeaf(rec.image || '', rec.question);
      await db.doctor.update(localId, { status: 'answered', answer });
      await syncAll();
      loadQueries();
    } catch {
      setError(t('geminiError'));
    }
    setAsking(false);
  };

  const canAsk = (image || question.trim()) && !asking;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="rounded-2xl bg-green-100 p-3">
          <Leaf className="text-green-600" size={28} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">{t('aiCropDoctor')}</h2>
          <p className="text-sm text-gray-500">{t('aiCropDoctorDesc')}</p>
        </div>
      </div>

      {!online && (
        <div className="flex items-center gap-2 rounded-2xl bg-gray-100 p-3 text-sm text-gray-600">
          <WifiOff size={18} /> {t('noInternetSaved')}
        </div>
      )}

      <CameraCapture onCapture={setImage} />

      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <span className="text-sm font-medium text-gray-600">{t('askQuestion')}</span>
          <button
            type="button"
            onClick={listening ? stopListening : startListening}
            className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm font-medium transition-colors ${
              listening ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-700 active:bg-emerald-100'
            }`}
          >
            {listening ? <MicOff size={16} /> : <Mic size={16} />}
            {listening ? t('stopSpeaking') : t('speakQuestion')}
          </button>
        </div>
        <TextArea
          rows={3}
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder={t('questionPlaceholder')}
        />
        {listening && (
          <p className="mt-1 flex items-center gap-1.5 text-xs text-red-500">
            <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" /> {t('listening')}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3">
        <LargeButton onClick={handleAskAi} disabled={!canAsk}>
          {asking ? (
            <>
              <Loader2 size={22} className="animate-spin" /> {t('analyzing')}
            </>
          ) : (
            <>
              <Send size={22} /> {t('askAi')}
            </>
          )}
        </LargeButton>
        <LargeButton variant="secondary" onClick={handleSaveOffline} disabled={!canAsk}>
          <Save size={22} /> {t('saveForLater')}
        </LargeButton>
      </div>

      {error && (
        <p className="flex items-center gap-2 rounded-xl bg-red-50 p-3 text-sm font-medium text-red-700">
          <AlertCircle size={16} /> {error}
        </p>
      )}

      {saved && (
        <div className="flex flex-col items-center gap-2">
          <SyncBadge synced={saved.synced} />
          {saved.status === 'saved_offline' && (
            <p className="text-sm text-gray-500">{t('noInternetSaved')}</p>
          )}
        </div>
      )}

      {queries.length > 0 && (
        <div className="space-y-3 pt-4">
          <h3 className="font-semibold text-gray-700">{t('dailyLogs')}</h3>
          {queries.map((q) => (
            <div key={q.local_id} className="rounded-2xl border border-gray-100 p-4">
              <div className="flex items-start gap-3">
                {q.image && <img src={q.image} alt="leaf" className="h-16 w-16 rounded-xl object-cover" />}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-800 line-clamp-2">{q.question || t('askQuestion')}</p>
                  <div className="mt-1.5 flex items-center gap-2">
                    {q.status === 'answered' ? (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600">
                        <CheckCircle2 size={14} /> {t('aiAnswer')}
                      </span>
                    ) : q.status === 'saved_offline' ? (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-500">
                        <Clock size={14} /> {t('savedOffline')}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600">
                        <Clock size={14} /> {t('pending')}
                      </span>
                    )}
                  </div>
                  {q.answer && (
                    <div className="mt-3 whitespace-pre-wrap rounded-xl bg-emerald-50 p-3 text-sm text-gray-800">
                      {q.answer}
                    </div>
                  )}
                  {q.status !== 'answered' && online && q.image && (
                    <button
                      onClick={() => handleRetry(q.local_id)}
                      disabled={asking}
                      className="mt-2 flex items-center gap-1.5 text-sm font-medium text-emerald-700 active:text-emerald-800"
                    >
                      <RotateCw size={14} /> {t('retryAi')}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
