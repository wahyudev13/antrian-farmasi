import React, { useState, useEffect } from 'react';
import { Head } from '@inertiajs/react';
import {
    Building2,
    Volume2,
    VolumeX,
    Maximize,
    Minimize,
    Tv,
    Clock,
    Calendar,
    Megaphone,
    Ticket,
    UserCheck,
    Layers,
} from 'lucide-react';
import { createEcho } from '@/echo';
import { formatNomorSpeech, cleanPatientNameForSpeech } from '@/Utils/terbilang';

export default function DisplayIndex({ settings, lokets, latestAntrean, latestPasien, currentDate }) {
    const [currentTime, setCurrentTime] = useState(new Date());
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [soundEnabled, setSoundEnabled] = useState(true);
    const [speechRate, setSpeechRate] = useState(0.88);
    const [speechVolume, setSpeechVolume] = useState(1.0);
    const [liveLokets, setLiveLokets] = useState(lokets || []);
    const currentDateRef = React.useRef(
        currentDate || new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(new Date())
    );

    // Current call state (can be 'antrean' or 'pasien' or idle)
    const [currentCall, setCurrentCall] = useState(() => {
        if (latestAntrean) {
            return {
                type: 'antrean',
                nomor: latestAntrean.nomor,
                nama: latestAntrean.nama_pasien,
                loket: latestAntrean.loket?.nama || 'Loket 1',
                nomor_display: latestAntrean.loket?.nomor_display || 1,
            };
        }
        if (latestPasien) {
            return {
                type: 'pasien',
                nomor: null,
                nama: latestPasien.nama_pasien,
                loket: latestPasien.loket?.nama || 'Loket 1',
                nomor_display: latestPasien.loket?.nomor_display || 1,
            };
        }
        return null;
    });

    const initialCallKey = (() => {
        if (latestAntrean) {
            const time = latestAntrean.waktu_panggil ? new Date(latestAntrean.waktu_panggil).getTime() / 1000 : 0;
            return `antrean_${latestAntrean.id}_${latestAntrean.jumlah_panggilan || 1}_${Math.floor(time)}`;
        }
        if (latestPasien) {
            const time = latestPasien.waktu_panggil ? new Date(latestPasien.waktu_panggil).getTime() / 1000 : 0;
            return `pasien_${latestPasien.id}_${latestPasien.jumlah_panggilan || 1}_${Math.floor(time)}`;
        }
        return null;
    })();

    const [audioUnlocked, setAudioUnlocked] = useState(false);
    const audioContextRef = React.useRef(null);
    const activeUtteranceRef = React.useRef(null);
    const voicesRef = React.useRef([]);
    const lastSpokenKeyRef = React.useRef(initialCallKey);
    const lastCallKeyRef = React.useRef(initialCallKey);
    const lastTestKeyRef = React.useRef(null);
    const isFirstPollRef = React.useRef(true);
    const keepAliveTimerRef = React.useRef(null);
    const soundEnabledRef = React.useRef(soundEnabled);
    soundEnabledRef.current = soundEnabled;
    const settingsRef = React.useRef(settings);
    settingsRef.current = settings;

    // Initialize & get persistent AudioContext
    const getAudioContext = () => {
        try {
            if (!audioContextRef.current) {
                const AudioContextClass = window.AudioContext || window.webkitAudioContext;
                if (AudioContextClass) {
                    audioContextRef.current = new AudioContextClass();
                }
            }
            if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
                audioContextRef.current.resume().catch(() => {});
            }
            return audioContextRef.current;
        } catch (e) {
            return null;
        }
    };

    // Unlock browser audio context on any user interaction
    const unlockAudio = React.useCallback(async () => {
        try {
            const ctx = getAudioContext();
            if (ctx && ctx.state === 'suspended') {
                await ctx.resume();
            }
            if ('speechSynthesis' in window) {
                window.speechSynthesis.resume();
                voicesRef.current = window.speechSynthesis.getVoices() || [];
            }
            setAudioUnlocked(true);
        } catch (e) {
            console.warn('Unlock audio error:', e);
        }
    }, []);

    // Preload speech synthesis voices
    useEffect(() => {
        if ('speechSynthesis' in window) {
            const updateVoices = () => {
                const v = window.speechSynthesis.getVoices();
                if (v && v.length > 0) {
                    voicesRef.current = v;
                }
            };
            updateVoices();
            window.speechSynthesis.onvoiceschanged = updateVoices;
        }
    }, []);

    // Global listener for first user interaction to unlock audio
    useEffect(() => {
        const handleInteraction = () => {
            unlockAudio(false);
        };

        window.addEventListener('click', handleInteraction, { once: false });
        window.addEventListener('keydown', handleInteraction, { once: false });
        window.addEventListener('touchstart', handleInteraction, { once: false });
        return () => {
            window.removeEventListener('click', handleInteraction);
            window.removeEventListener('keydown', handleInteraction);
            window.removeEventListener('touchstart', handleInteraction);
        };
    }, [unlockAudio]);

    // Text to Speech
    const speakCall = (call) => {
        if (!soundEnabledRef.current || !call) return;

        const callKey = call.call_key || `${call.type}_${call.id || 0}_${call.nomor || ''}_${call.jumlah_panggilan || 1}`;
        // Prevent duplicate trigger for the same call event within same cycle
        if (lastSpokenKeyRef.current === callKey) {
            return;
        }
        lastSpokenKeyRef.current = callKey;
        lastCallKeyRef.current = callKey;

        // Ensure audio context is ready
        unlockAudio(false);

        if (!('speechSynthesis' in window)) return;

        if (keepAliveTimerRef.current) {
            clearInterval(keepAliveTimerRef.current);
            keepAliveTimerRef.current = null;
        }

        // Direct voice call without bell chime
        setTimeout(() => {
            try {
                if (window.speechSynthesis.paused) {
                    window.speechSynthesis.resume();
                }
                if (window.speechSynthesis.speaking) {
                    window.speechSynthesis.cancel();
                }

                let speechText = '';
                const currentSettings = settingsRef.current || settings;
                if (call.type === 'test' || call.call_key?.startsWith('test_sound_') || call.nama === 'Pasien Uji Coba') {
                    speechText = 'Uji coba suara display antrean farmasi.';
                } else if (call.type === 'antrean') {
                    const spelledNomor = formatNomorSpeech(call.nomor);
                    const cleanName = cleanPatientNameForSpeech(call.nama || '');
                    const template = currentSettings?.template_suara_antrean || 'Nomor antrean, {nomor}, silakan menuju {loket}';
                    speechText = template
                        .replace('{nomor}', spelledNomor)
                        .replace('{loket}', call.loket || 'Loket Farmasi')
                        .replace('{nama}', cleanName);
                } else {
                    const template = currentSettings?.template_suara_pasien || 'Pasien atas nama, {nama}, silakan menuju {loket}';
                    const cleanName = cleanPatientNameForSpeech(call.nama || '');
                    speechText = template
                        .replace('{nama}', cleanName)
                        .replace('{loket}', call.loket || 'Loket Farmasi');
                }

                const configuredRate = parseFloat(currentSettings?.tts_kecepatan) || speechRate;
                const configuredPitch = parseFloat(currentSettings?.tts_nada) || 1.0;
                const configuredVolume = parseFloat(currentSettings?.tts_volume) || speechVolume;

                const utterance = new SpeechSynthesisUtterance(speechText);
                utterance.lang = 'id-ID';
                utterance.rate = configuredRate;
                utterance.pitch = configuredPitch;
                utterance.volume = configuredVolume;

                // Pick voice: prioritize Indonesian, fallback to any available default
                const allVoices = voicesRef.current.length > 0 ? voicesRef.current : (window.speechSynthesis.getVoices() || []);
                let idVoice = allVoices.find(v => v.lang === 'id-ID' || v.lang === 'id_ID');
                if (!idVoice) {
                    idVoice = allVoices.find(v => v.lang && v.lang.toLowerCase().startsWith('id'));
                }
                if (!idVoice && allVoices.length > 0) {
                    idVoice = allVoices.find(v => v.default) || allVoices[0];
                }
                if (idVoice) {
                    utterance.voice = idVoice;
                }

                // Global window reference to prevent Chromium V8 GC from collecting utterance mid-sentence
                window.__displayUtterance = utterance;
                activeUtteranceRef.current = utterance;

                // Chromium keep-alive watchdog (prevents Chrome cutting off after 2-3 seconds)
                keepAliveTimerRef.current = setInterval(() => {
                    if (window.speechSynthesis && window.speechSynthesis.speaking) {
                        window.speechSynthesis.pause();
                        window.speechSynthesis.resume();
                    } else {
                        if (keepAliveTimerRef.current) {
                            clearInterval(keepAliveTimerRef.current);
                            keepAliveTimerRef.current = null;
                        }
                    }
                }, 2000);

                utterance.onend = () => {
                    if (keepAliveTimerRef.current) {
                        clearInterval(keepAliveTimerRef.current);
                        keepAliveTimerRef.current = null;
                    }
                    window.__displayUtterance = null;
                    activeUtteranceRef.current = null;
                };

                utterance.onerror = (e) => {
                    if (keepAliveTimerRef.current) {
                        clearInterval(keepAliveTimerRef.current);
                        keepAliveTimerRef.current = null;
                    }
                    console.warn('SpeechSynthesis error:', e);
                    window.__displayUtterance = null;
                    activeUtteranceRef.current = null;
                };

                setTimeout(() => {
                    window.speechSynthesis.speak(utterance);
                }, 80);
            } catch (err) {
                console.error('speakCall error:', err);
            }
        }, 50);
    };

    // Manual test audio trigger directly from display UI
    const handleManualTestAudio = () => {
        unlockAudio(false);
        lastSpokenKeyRef.current = null; // force test to speak
        speakCall({
            type: 'test',
            call_key: `local_test_${Date.now()}`,
            nama: 'Pasien Uji Coba',
        });
    };

    // Clock ticker & automatic midnight detector
    useEffect(() => {
        const timer = setInterval(() => {
            const now = new Date();
            setCurrentTime(now);

            // Auto-reset when date rolls over to midnight (00:00 WIB)
            const todayStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(now);
            if (currentDateRef.current && currentDateRef.current !== todayStr) {
                currentDateRef.current = todayStr;
                setLiveLokets((prev) =>
                    prev.map((l) => ({
                        ...l,
                        nomor_antrean: null,
                        nama_pasien: null,
                        status_antrean: null,
                    }))
                );
                setCurrentCall(null);
                lastCallKeyRef.current = null;
                window.location.reload();
            }
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const [wsConnected, setWsConnected] = useState(false);

    // WebSocket Real-time Listener (Laravel Reverb)
    useEffect(() => {
        const echo = createEcho();
        if (!echo) return;

        const channel = echo.channel('farmasi-display');

        // Handle Antrean Calling Event
        channel.listen('.antrean.dipanggil', (e) => {
            if (e?.callData) {
                const call = e.callData;
                const callKey = call.call_key || `antrean_${call.id}_${call.jumlah_panggilan || 1}`;
                lastCallKeyRef.current = callKey;
                setCurrentCall(call);
                speakCall(call);

                setLiveLokets((prev) =>
                    prev.map((l) =>
                        String(l.id) === String(call.loket_id)
                            ? {
                                  ...l,
                                  nomor_antrean: call.nomor,
                                  nama_pasien: call.nama,
                                  status_antrean: 'dipanggil',
                                  currentAntrean: {
                                      id: call.id,
                                      nomor: call.nomor,
                                      nama_pasien: call.nama,
                                      status: 'dipanggil',
                                  },
                              }
                            : l
                    )
                );
            }
        });

        // Handle Direct Patient Calling Event
        channel.listen('.pasien.dipanggil', (e) => {
            if (e?.callData) {
                const call = e.callData;
                const callKey = call.call_key || `pasien_${call.id}_${call.jumlah_panggilan || 1}`;
                lastCallKeyRef.current = callKey;
                setCurrentCall(call);
                speakCall(call);

                setLiveLokets((prev) =>
                    prev.map((l) =>
                        String(l.id) === String(call.loket_id)
                            ? {
                                  ...l,
                                  nama_pasien: call.nama,
                                  status_antrean: 'dipanggil',
                                  currentAntrean: {
                                      id: call.id,
                                      nomor: null,
                                      nama_pasien: call.nama,
                                      status: 'dipanggil',
                                  },
                              }
                            : l
                    )
                );
            }
        });

        // Handle Antrean Selesai Event (stops calling badge, keeps last called number)
        channel.listen('.antrean.selesai', (e) => {
            if (e?.callData) {
                const data = e.callData;
                setLiveLokets((prev) =>
                    prev.map((l) =>
                        String(l.id) === String(data.loket_id)
                            ? {
                                  ...l,
                                  nomor_antrean: l.nomor_antrean || data.nomor,
                                  status_antrean: 'selesai',
                              }
                            : l
                    )
                );
                setCurrentCall((prev) => (String(prev?.loket_id) === String(data.loket_id) ? null : prev));
            }
        });

        // Handle Test Sound Event
        channel.listen('.display.test-sound', (e) => {
            if (e?.callData) {
                const call = e.callData;
                lastTestKeyRef.current = call.call_key;
                lastCallKeyRef.current = call.call_key;
                speakCall(call);
            }
        });

        // Track connection status
        if (echo.connector?.pusher?.connection) {
            echo.connector.pusher.connection.bind('connected', () => setWsConnected(true));
            echo.connector.pusher.connection.bind('disconnected', () => setWsConnected(false));
            echo.connector.pusher.connection.bind('failed', () => setWsConnected(false));
        }

        return () => {
            echo.leaveChannel('farmasi-display');
            echo.disconnect();
        };
    }, []);

    // Realtime Polling fallback (runs every 2 seconds)
    useEffect(() => {
        const pollStatus = async () => {
            try {
                const res = await fetch('/api/display/status', {
                    headers: { credentials: 'omit', Accept: 'application/json' }
                });
                if (!res.ok) return;
                const json = await res.json();

                // Check for day change in polling response
                if (json.current_date && currentDateRef.current && json.current_date !== currentDateRef.current) {
                    currentDateRef.current = json.current_date;
                    setLiveLokets((prev) =>
                        prev.map((l) => ({
                            ...l,
                            nomor_antrean: null,
                            nama_pasien: null,
                            status_antrean: null,
                        }))
                    );
                    setCurrentCall(null);
                    lastCallKeyRef.current = null;
                    window.location.reload();
                    return;
                }

                if (json.lokets) {
                    setLiveLokets(json.lokets);
                }

                // Check for test sound trigger from polling
                if (json.testSound && json.testSound.call_key) {
                    const testKey = json.testSound.call_key;
                    if (isFirstPollRef.current) {
                        lastTestKeyRef.current = testKey;
                    } else if (lastTestKeyRef.current !== testKey) {
                        lastTestKeyRef.current = testKey;
                        speakCall(json.testSound);
                    }
                }

                if (json.currentCall) {
                    const newKey = json.currentCall.call_key;
                    if (isFirstPollRef.current) {
                        // Saat browser baru dibuka atau di-reload, sinkronisasi tampilan tanpa bersuara
                        lastCallKeyRef.current = newKey;
                        lastSpokenKeyRef.current = newKey;
                        setCurrentCall(json.currentCall);
                    } else if (lastCallKeyRef.current !== newKey) {
                        lastCallKeyRef.current = newKey;
                        setCurrentCall(json.currentCall);
                        speakCall(json.currentCall);
                    }
                } else if (!json.testSound) {
                    // No active call currently
                    setCurrentCall(null);
                }

                if (isFirstPollRef.current) {
                    isFirstPollRef.current = false;
                }
            } catch (err) {
                // Ignore network hiccups
            }
        };

        const pollTimer = setInterval(pollStatus, 2000);
        return () => clearInterval(pollTimer);
    }, []);

    // Fullscreen toggle handler
    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(() => {});
            setIsFullscreen(true);
        } else {
            document.exitFullscreen().catch(() => {});
            setIsFullscreen(false);
        }
    };

    const hospitalName = settings?.nama_rumah_sakit || 'RS PKU MUHAMMADIYAH SEKAPUK';
    const unitName = settings?.nama_unit || 'Instalasi Farmasi';
    const logoUrl = settings?.logo_url;
    const runningText = settings?.running_text || 'Selamat Datang di Instalasi Farmasi. Harap memperhatikan panggilan nomor antrean.';

    // Format privacy name
    const formatName = (name) => {
        if (!name) return '';
        const mode = settings?.display_privacy_mode || 'masked';
        if (mode === 'full') return name.toUpperCase();
        if (mode === 'initials') {
            return name.split(' ').map(w => w ? w[0].toUpperCase() + '.' : '').join(' ');
        }
        // Masked
        const words = name.split(' ');
        if (words.length === 1) {
            const w = words[0];
            return w.length <= 3 ? w.toUpperCase() : w.substring(0, 3).toUpperCase() + '*'.repeat(w.length - 3);
        }
        const first = words[0].toUpperCase();
        const rest = words.slice(1).map(w => w[0].toUpperCase() + '*'.repeat(Math.max(3, w.length - 1)));
        return `${first} ${rest.join(' ')}`;
    };

    // Helper to format display number (e.g. A001 -> A-1, null -> A-0)
    const formatDisplayNumber = (loket) => {
        const prefix = (loket?.prefix || 'A').toUpperCase();
        const nomor = loket?.nomor_antrean;
        if (!nomor) {
            return `${prefix}-0`;
        }
        const str = String(nomor).trim();
        if (str.includes('-')) {
            const parts = str.split('-');
            if (parts.length === 2 && /^\d+$/.test(parts[1])) {
                return `${parts[0].toUpperCase()}-${parseInt(parts[1], 10)}`;
            }
            return str.toUpperCase();
        }
        const match = str.match(/^([A-Za-z]+)(\d+)$/);
        if (match) {
            const p = match[1].toUpperCase();
            const n = parseInt(match[2], 10);
            return `${p}-${n}`;
        }
        if (/^\d+$/.test(str)) {
            return `${prefix}-${parseInt(str, 10)}`;
        }
        return str.toUpperCase();
    };

    // Custom color and title config for loket cards
    const getLoketConfig = (loket, index) => {
        const rawNama = (loket?.nama || '').trim();
        let title = rawNama.toUpperCase();

        if (!title) {
            title = `LOKET ${loket?.nomor_display || index + 1}`;
        } else if (title.includes('NON RACIKAN')) {
            title = 'OBAT NON RACIKAN';
        } else if (title.includes('RACIKAN')) {
            title = 'OBAT RACIKAN';
        } else if (!title.startsWith('OBAT') && !title.startsWith('LOKET')) {
            title = `OBAT ${title}`;
        }

        const color = loket?.warna || '#2563eb';

        return {
            title,
            color,
        };
    };

    const defaultLokets = [
        { id: 1, nama: 'NON RACIKAN', prefix: 'A', nomor_display: 1, warna: '#2563eb', nomor_antrean: null },
        { id: 2, nama: 'RACIKAN', prefix: 'B', nomor_display: 2, warna: '#059669', nomor_antrean: null },
    ];
    // Render all active lokets from master data
    const displayLokets = liveLokets.length > 0 ? liveLokets : defaultLokets;
    const loketCount = displayLokets.length;

    // Maksimal 2 card per baris
    const getGridColsClass = (count) => {
        if (count === 1) return 'grid-cols-1 max-w-3xl mx-auto w-full';
        return 'grid-cols-1 md:grid-cols-2';
    };

    const getGridRowsClass = (count) => {
        if (count <= 2) return 'grid-rows-1';
        if (count <= 4) return 'grid-rows-2';
        return 'auto-rows-fr';
    };

    const numberSizeClass = loketCount <= 2
        ? 'text-8xl sm:text-9xl md:text-[12rem] lg:text-[14rem] xl:text-[17rem]'
        : 'text-6xl sm:text-7xl md:text-8xl lg:text-[7.5rem] xl:text-[9rem]';

    const headerSizeClass = loketCount <= 2
        ? 'text-2xl sm:text-3xl lg:text-4xl py-4 sm:py-5 px-6'
        : 'text-base sm:text-lg lg:text-xl py-2 sm:py-2.5 px-4';

    const subheaderSizeClass = loketCount <= 2
        ? 'text-xl sm:text-2xl lg:text-3xl mb-2 sm:mb-4'
        : 'text-xs sm:text-sm lg:text-base mb-0.5 sm:mb-1';

    const cardPaddingClass = loketCount <= 2
        ? 'p-6 sm:p-10'
        : 'p-2 sm:p-3 md:p-4';

    return (
        <div className="min-h-screen bg-slate-100 flex flex-col font-sans select-none overflow-hidden text-slate-800">
            <Head title={`Layar Display - ${unitName}`} />

            {/* Top Display Header (Solid Blue matching footer) */}
            <header className="bg-blue-700 border-b border-blue-800 px-6 py-3.5 flex items-center justify-between shadow-md text-white">
                <div className="flex items-center gap-4">
                    {logoUrl ? (
                        <img
                            src={logoUrl}
                            alt="Logo RS"
                            className="h-14 w-auto object-contain max-w-[160px] bg-white p-1 rounded-xl shadow-xs"
                        />
                    ) : (
                        <div className="h-14 w-14 rounded-2xl bg-white text-blue-700 flex items-center justify-center shadow-md">
                            <Building2 className="w-8 h-8 text-blue-700" />
                        </div>
                    )}
                    <div>
                        <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white uppercase leading-none">
                            {hospitalName}
                        </h1>
                        <p className="text-xs sm:text-sm font-extrabold text-blue-100 tracking-wider uppercase mt-1">
                            {unitName}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    {/* Digital Clock */}
                    <div className="text-right">
                        <div className="text-2xl sm:text-3xl font-mono font-black text-white tracking-wider">
                            {currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </div>
                        <div className="text-xs font-semibold text-blue-100 uppercase tracking-wide">
                            {currentTime.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                        </div>
                    </div>

                    {/* Audio & Fullscreen Controls */}
                    <div className="flex items-center gap-2 border-l border-blue-600/70 pl-4">
                        <button
                            type="button"
                            onClick={() => setSoundEnabled(!soundEnabled)}
                            className={`p-2.5 rounded-xl border transition cursor-pointer ${
                                soundEnabled
                                    ? 'bg-blue-800/90 text-white border-blue-500/60 hover:bg-blue-600 shadow-xs'
                                    : 'bg-rose-600 text-white border-rose-400 hover:bg-rose-700 shadow-xs'
                            }`}
                            title={soundEnabled ? 'Suara Aktif' : 'Suara Dimatikan'}
                        >
                            {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                        </button>
                        <button
                            type="button"
                            onClick={toggleFullscreen}
                            className="p-2.5 rounded-xl bg-blue-800/90 text-white hover:bg-blue-600 border border-blue-500/60 transition shadow-xs cursor-pointer"
                            title="Layar Penuh"
                        >
                            {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Stage Grid - Maksimal 2 card per baris */}
            <main className="flex-1 p-3 sm:p-4 md:p-5 flex flex-col justify-center overflow-hidden">
                <div className={`grid ${getGridColsClass(loketCount)} ${getGridRowsClass(loketCount)} gap-3 sm:gap-4 md:gap-5 h-full items-stretch`}>
                    {displayLokets.map((loket, idx) => {
                        const config = getLoketConfig(loket, idx);
                        const isCalling = currentCall?.loket_id === loket.id && loket.status_antrean === 'dipanggil';
                        const displayNumber = formatDisplayNumber(loket);

                        return (
                            <div
                                key={loket.id || idx}
                                style={{
                                    borderColor: config.color,
                                    boxShadow: isCalling
                                        ? `0 0 0 8px ${config.color}55, 0 20px 25px -5px rgb(0 0 0 / 0.15)`
                                        : undefined,
                                }}
                                className={`rounded-2xl sm:rounded-3xl border-2 sm:border-4 shadow-xl overflow-hidden flex flex-col transition-all duration-300 ${
                                    isCalling ? 'scale-[1.01]' : ''
                                }`}
                            >
                                {/* Top Solid Header Banner with Custom Color */}
                                <div
                                    style={{ backgroundColor: config.color }}
                                    className={`text-white font-black ${headerSizeClass} text-center uppercase tracking-wider shadow-sm relative truncate`}
                                >
                                    {config.title}
                                    {isCalling && (
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 px-2.5 py-0.5 rounded-full bg-white text-slate-900 text-[10px] sm:text-xs font-black uppercase tracking-wider animate-bounce shadow-md hidden sm:inline-flex items-center gap-1">
                                            <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-ping" />
                                            Dipanggil
                                        </span>
                                    )}
                                </div>

                                {/* Card Body with Pastel Background matching Custom Color */}
                                <div
                                    style={{ backgroundColor: `${config.color}15` }}
                                    className={`flex-1 flex flex-col items-center justify-center ${cardPaddingClass} relative select-none`}
                                >
                                    {/* Subheader */}
                                    <div className={`text-slate-800 font-extrabold ${subheaderSizeClass} tracking-wider uppercase text-center`}>
                                        ANTRIAN FARMASI
                                    </div>

                                    {/* Center Number (e.g. A-0 / B-0 / C-0 / D-0) */}
                                    <div
                                        className={`font-black font-sans text-slate-900 ${numberSizeClass} leading-none tracking-tight my-auto drop-shadow-xs text-center`}
                                    >
                                        {displayNumber}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </main>

            {/* Bottom Running Text Marquee (Blue Banner) */}
            <footer className="bg-blue-700 border-t border-blue-800 py-2.5 px-4 flex items-center shadow-lg overflow-hidden">
                <div className="flex items-center gap-2 bg-white text-blue-700 font-black text-xs uppercase px-3 py-1 rounded-md tracking-wider shrink-0 z-10 shadow-xs">
                    <Megaphone className="w-3.5 h-3.5 text-blue-700" />
                    <span>INFO FARMASI</span>
                </div>
                <div className="flex-1 overflow-hidden relative ml-4">
                    <div className="whitespace-nowrap animate-marquee text-sm font-bold text-white tracking-wide">
                        {runningText}
                    </div>
                </div>
            </footer>

            <style>{`
                @keyframes marquee {
                    0% { transform: translateX(100%); }
                    100% { transform: translateX(-100%); }
                }
                .animate-marquee {
                    display: inline-block;
                    animation: marquee 28s linear infinite;
                }
            `}</style>
        </div>
    );
}
