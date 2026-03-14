import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Send,
  Mic,
  Camera,
  Image as ImageIcon,
  Video,
  Phone,
  Check,
  CheckCheck,
  Play,
  Pause,
  Square,
  X,
  Paperclip,
} from "lucide-react";
import * as api from "../services/api";
import * as sfx from "../services/sounds";
import { showLocalNotification } from "../services/pwa";

interface Contact {
  username: string;
  name: string;
  photo: string;
  role: string;
}

interface Message {
  id: string;
  from: string;
  to: string;
  text: string;
  type: string;
  timestamp: string;
  read: boolean;
  mediaId?: string;
  audioUrl?: string;
  audioDuration?: number;
  imageUrl?: string;
}

interface ChatPanelProps {
  currentUsername: string;
  contacts: Contact[];
  accentColor?: string;
  groupedContacts?: { label: string; contacts: Contact[]; gradient: string }[];
}

const getAvatarText = (text: string | null | undefined): string => {
  if (!text || typeof text !== "string") return "??";
  return text.substring(0, 2).toUpperCase();
};

// ─── Audio Waveform Visual ──────────────────────
function AudioWaveform({ playing, color = "#00f0ff" }: { playing: boolean; color?: string }) {
  return (
    <div className="flex items-center gap-[2px] h-6">
      {Array.from({ length: 20 }).map((_, i) => (
        <motion.div
          key={i}
          className="w-[2px] rounded-full"
          style={{ backgroundColor: color }}
          animate={playing ? { height: [4, 12 + Math.random() * 12, 4], opacity: [0.5, 1, 0.5] }
            : { height: 4, opacity: 0.4 }}
          transition={playing ? { duration: 0.4 + Math.random() * 0.3, repeat: Infinity, delay: i * 0.03 } : { duration: 0.3 }}
        />
      ))}
    </div>
  );
}

export function ChatPanel({
  currentUsername,
  contacts,
  accentColor = "#00f0ff",
  groupedContacts,
}: ChatPanelProps) {
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [sending, setSending] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [micSimulated, setMicSimulated] = useState(false);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const blobUrlCacheRef = useRef<Map<string, string>>(new Map());
  const mediaLoadingRef = useRef<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const prevMessageCountRef = useRef<number>(0);

  // ─── Fetch unread counts ─────────────────────
  const loadUnreadCounts = useCallback(async () => {
    try {
      const res = await api.getChatUnreadCounts(currentUsername);
      if (res.success) setUnreadCounts(res.unreadCounts || {});
    } catch {}
  }, [currentUsername]);

  useEffect(() => {
    loadUnreadCounts();
    const interval = setInterval(loadUnreadCounts, 5000);
    return () => clearInterval(interval);
  }, [loadUnreadCounts]);

  // Clear unread for selected chat
  useEffect(() => {
    if (selectedChat && unreadCounts[selectedChat]) {
      setUnreadCounts(prev => {
        const next = { ...prev };
        delete next[selectedChat];
        return next;
      });
    }
  }, [selectedChat]);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  const scrollToBottom = () => setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);

  // ─── Helpers ──────────────────────────────────
  const blobToBase64 = (blob: Blob): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });

  const base64ToBlobUrl = (base64: string, cacheKey: string): string => {
    const cached = blobUrlCacheRef.current.get(cacheKey);
    if (cached) return cached;
    try {
      const [header, data] = base64.split(",");
      const mime = header.match(/:(.*?);/)?.[1] || "audio/webm";
      const binary = atob(data);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      const blob = new Blob([bytes], { type: mime });
      const url = URL.createObjectURL(blob);
      blobUrlCacheRef.current.set(cacheKey, url);
      return url;
    } catch { return ""; }
  };

  const generateSyntheticAudioBlob = async (durationSec: number): Promise<Blob> => {
    const sampleRate = 22050;
    const numSamples = sampleRate * durationSec;
    const dataSize = numSamples * 2;
    const buffer = new ArrayBuffer(44 + dataSize);
    const view = new DataView(buffer);
    const writeStr = (off: number, s: string) => { for (let i = 0; i < s.length; i++) view.setUint8(off + i, s.charCodeAt(i)); };
    writeStr(0, "RIFF"); view.setUint32(4, 36 + dataSize, true); writeStr(8, "WAVE");
    writeStr(12, "fmt "); view.setUint32(16, 16, true); view.setUint16(20, 1, true);
    view.setUint16(22, 1, true); view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true); view.setUint16(32, 2, true);
    view.setUint16(34, 16, true); writeStr(36, "data"); view.setUint32(40, dataSize, true);
    for (let i = 0; i < numSamples; i++) {
      const t = i / sampleRate;
      const freq = 440 * Math.pow(2, -t * 0.5);
      const envelope = Math.min(1, Math.min(t * 20, (durationSec - t) * 10));
      const sample = Math.sin(2 * Math.PI * freq * t) * 0.3 * envelope;
      view.setInt16(44 + i * 2, sample * 32767, true);
    }
    return new Blob([buffer], { type: "audio/wav" });
  };

  const compressImage = (file: File, maxWidth = 800): Promise<Blob> =>
    new Promise((resolve) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const scale = Math.min(1, maxWidth / img.width);
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => resolve(blob || file), "image/jpeg", 0.7);
      };
      img.src = URL.createObjectURL(file);
    });

  const hydrateMediaForMsg = useCallback(async (msg: Message) => {
    if (!msg.mediaId) return;
    const cacheKey = msg.mediaId;
    if (blobUrlCacheRef.current.has(cacheKey)) {
      if (msg.type === "audio") msg.audioUrl = blobUrlCacheRef.current.get(cacheKey)!;
      if (msg.type === "image") msg.imageUrl = blobUrlCacheRef.current.get(cacheKey)!;
      return;
    }
    if (mediaLoadingRef.current.has(cacheKey)) return;
    mediaLoadingRef.current.add(cacheKey);
    try {
      const base64 = await api.getMedia(msg.mediaId);
      if (base64) {
        const url = base64ToBlobUrl(base64, cacheKey);
        if (msg.type === "audio") msg.audioUrl = url;
        if (msg.type === "image") msg.imageUrl = url;
      }
    } catch (err) { console.error("Erro ao carregar media:", err); }
    finally { mediaLoadingRef.current.delete(cacheKey); }
  }, []);

  // ─── Load Messages ────────────────────────────
  const loadMessages = useCallback(async () => {
    if (!selectedChat) return;
    try {
      const res = await api.getMessages(currentUsername, selectedChat);
      if (res.success) {
        const serverMsgs = (res.messages || []) as Message[];
        const mediaToFetch: Message[] = [];
        for (const msg of serverMsgs) {
          if (msg.mediaId) {
            const cached = blobUrlCacheRef.current.get(msg.mediaId);
            if (cached) {
              if (msg.type === "audio") msg.audioUrl = cached;
              if (msg.type === "image") msg.imageUrl = cached;
            } else { mediaToFetch.push(msg); }
          }
        }

        // Detect new incoming messages for push notification
        const incomingNew = serverMsgs.filter(m => m.from !== currentUsername && !m.read);
        if (incomingNew.length > 0 && serverMsgs.length > prevMessageCountRef.current && prevMessageCountRef.current > 0) {
          const lastMsg = incomingNew[incomingNew.length - 1];
          const senderContact = contacts.find(c => c.username === lastMsg.from);
          const senderName = senderContact?.name || lastMsg.from;
          // Send push notification if app is in background
          if (document.hidden) {
            showLocalNotification(
              `${senderName}`,
              lastMsg.type === "audio" ? "Mensagem de audio" : lastMsg.type === "image" ? "Foto" : lastMsg.text,
              `/${currentUsername}`,
              `chat-${lastMsg.from}`
            );
          }
          sfx.playMessageReceived();
        }
        prevMessageCountRef.current = serverMsgs.length;

        setMessages([...serverMsgs]);
        api.markMessagesRead(currentUsername, selectedChat, currentUsername).catch(() => {});
        if (mediaToFetch.length > 0) {
          await Promise.all(mediaToFetch.map((m) => hydrateMediaForMsg(m)));
          setMessages((prev) => prev.map((pm) => {
            if (pm.mediaId && blobUrlCacheRef.current.has(pm.mediaId)) {
              const url = blobUrlCacheRef.current.get(pm.mediaId)!;
              if (pm.type === "audio" && !pm.audioUrl) return { ...pm, audioUrl: url };
              if (pm.type === "image" && !pm.imageUrl) return { ...pm, imageUrl: url };
            }
            return pm;
          }));
        }
      }
    } catch (err) { console.error("Erro ao carregar mensagens:", err); }
  }, [currentUsername, selectedChat, hydrateMediaForMsg, contacts]);

  useEffect(() => {
    if (selectedChat) {
      loadMessages();
      pollingRef.current = setInterval(loadMessages, 3000);
      return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
    } else { setMessages([]); }
  }, [selectedChat, loadMessages]);

  useEffect(() => { scrollToBottom(); }, [messages]);

  useEffect(() => {
    return () => {
      if (audioPlayerRef.current) { audioPlayerRef.current.pause(); audioPlayerRef.current = null; }
      blobUrlCacheRef.current.forEach((url) => URL.revokeObjectURL(url));
      blobUrlCacheRef.current.clear();
    };
  }, []);

  // ─── Text Send ────────────────────────────────
  const handleSend = async () => {
    if (!message.trim() || !selectedChat || sending) return;
    const text = message.trim();
    setMessage("");
    setSending(true);
    sfx.playMessageSent();
    const tempMsg: Message = { id: `temp-${Date.now()}`, from: currentUsername, to: selectedChat, text, type: "text", timestamp: new Date().toISOString(), read: false };
    setMessages((prev) => [...prev, tempMsg]);
    try { await api.sendMessage(currentUsername, selectedChat, text); await loadMessages(); }
    catch (err) { console.error("Erro ao enviar:", err); }
    finally { setSending(false); }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } };
  const formatTime = (ts: string) => { try { return new Date(ts).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }); } catch { return ""; } };
  const formatDuration = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

  // ─── Audio Recording ──────────────────────────
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      audioChunksRef.current = [];
      mr.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      mr.onstop = () => { stream.getTracks().forEach((t) => t.stop()); };
      mr.start();
      mediaRecorderRef.current = mr;
      setMicSimulated(false);
      setIsRecording(true);
      setRecordingTime(0);
      recordingTimerRef.current = setInterval(() => setRecordingTime((p) => p + 1), 1000);
    } catch {
      showToast("Microfone indisponivel — modo simulado");
      mediaRecorderRef.current = null;
      setMicSimulated(true);
      setIsRecording(true);
      setRecordingTime(0);
      recordingTimerRef.current = setInterval(() => setRecordingTime((p) => p + 1), 1000);
    }
  };

  const stopRecording = async (cancel = false) => {
    if (recordingTimerRef.current) { clearInterval(recordingTimerRef.current); recordingTimerRef.current = null; }
    if (micSimulated) {
      const duration = recordingTime;
      setIsRecording(false);
      setMicSimulated(false);
      if (!cancel && duration >= 1) {
        const blob = await generateSyntheticAudioBlob(Math.min(duration, 10));
        await sendAudioMessage(blob, duration);
      }
      return;
    }
    const mr = mediaRecorderRef.current;
    if (!mr || mr.state === "inactive") { setIsRecording(false); return; }
    if (cancel) { mr.stop(); setIsRecording(false); return; }
    const duration = recordingTime;
    mr.onstop = async () => {
      mr.stream.getTracks().forEach((t) => t.stop());
      if (audioChunksRef.current.length === 0 || duration < 1) { setIsRecording(false); return; }
      const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
      await sendAudioMessage(blob, duration);
      setIsRecording(false);
    };
    mr.stop();
  };

  const sendAudioMessage = async (audioBlob: Blob, duration: number) => {
    if (!selectedChat) return;
    const localUrl = URL.createObjectURL(audioBlob);
    const tempId = `sending-audio-${Date.now()}`;
    blobUrlCacheRef.current.set(tempId, localUrl);
    const msg: Message = {
      id: tempId, from: currentUsername, to: selectedChat,
      text: `🎤 Audio (${formatDuration(duration)})`, type: "audio",
      timestamp: new Date().toISOString(), read: false, audioUrl: localUrl, audioDuration: duration,
    };
    setMessages((prev) => [...prev, msg]);
    scrollToBottom();
    try {
      const base64 = await blobToBase64(audioBlob);
      const mediaId = await api.uploadMedia(base64);
      blobUrlCacheRef.current.set(mediaId, localUrl);
      await api.sendMessage(currentUsername, selectedChat, `🎤 Audio (${formatDuration(duration)})`, "audio", { mediaId, audioDuration: duration });
      await loadMessages();
    } catch (e) { console.error("Erro ao enviar audio:", e); showToast("Erro ao enviar audio"); }
  };

  // ─── Audio Playback ───────────────────────────
  const toggleAudioPlay = async (msgId: string, msg: Message) => {
    if (playingAudioId === msgId) {
      audioPlayerRef.current?.pause();
      setPlayingAudioId(null);
      return;
    }
    if (audioPlayerRef.current) audioPlayerRef.current.pause();
    let url = msg.audioUrl;
    if (!url && msg.mediaId) {
      const cached = blobUrlCacheRef.current.get(msg.mediaId);
      if (cached) { url = cached; }
      else {
        showToast("Carregando audio...");
        const base64 = await api.getMedia(msg.mediaId);
        if (base64) {
          url = base64ToBlobUrl(base64, msg.mediaId);
          setMessages((prev) => prev.map((m) => m.id === msgId ? { ...m, audioUrl: url } : m));
        }
      }
    }
    if (!url) { showToast("Audio indisponivel"); return; }
    const audio = new Audio(url);
    audio.onended = () => setPlayingAudioId(null);
    audio.onerror = () => { setPlayingAudioId(null); showToast("Erro ao reproduzir"); };
    audio.play().catch(() => { showToast("Erro ao reproduzir"); setPlayingAudioId(null); });
    audioPlayerRef.current = audio;
    setPlayingAudioId(msgId);
  };

  // ─── Photo Sending ───────────────────────────
  const handleImageSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedChat) return;
    setShowAttachMenu(false);
    const compressed = await compressImage(file);
    const localUrl = URL.createObjectURL(compressed);
    const tempId = `sending-img-${Date.now()}`;
    blobUrlCacheRef.current.set(tempId, localUrl);
    const msg: Message = {
      id: tempId, from: currentUsername, to: selectedChat,
      text: "📷 Foto", type: "image",
      timestamp: new Date().toISOString(), read: false, imageUrl: localUrl,
    };
    setMessages((prev) => [...prev, msg]);
    scrollToBottom();
    try {
      const base64 = await blobToBase64(compressed);
      const mediaId = await api.uploadMedia(base64);
      blobUrlCacheRef.current.set(mediaId, localUrl);
      await api.sendMessage(currentUsername, selectedChat, "📷 Foto", "image", { mediaId });
      await loadMessages();
    } catch (err) { console.error("Erro ao enviar foto:", err); showToast("Erro ao enviar foto"); }
    e.target.value = "";
  };

  const selectedContact = contacts.find((c) => c.username === selectedChat);
  const allContacts = contacts;

  return (
    <div className="h-full relative">
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-[200] px-4 py-2 rounded-xl text-white text-xs font-medium"
            style={{ background: `linear-gradient(135deg, ${accentColor}90, #8b5cf690)`, backdropFilter: "blur(10px)", border: `1px solid ${accentColor}40` }}
          >{toast}</motion.div>
        )}
      </AnimatePresence>

      {/* Fullscreen Image Preview */}
      <AnimatePresence>
        {previewImage && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4"
            onClick={() => setPreviewImage(null)}
          >
            <motion.button className="absolute top-4 right-4 p-2 rounded-full bg-white/10 text-white z-10"
              whileTap={{ scale: 0.9 }} onClick={() => setPreviewImage(null)}
            ><X className="w-5 h-5" /></motion.button>
            <motion.img src={previewImage} initial={{ scale: 0.8 }} animate={{ scale: 1 }}
              className="max-w-full max-h-full rounded-xl object-contain" onClick={(e) => e.stopPropagation()} />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-full">
        {/* Contact List */}
        <div className="bg-[#12121a] border border-[#1f1f2e] rounded-2xl p-4 overflow-y-auto">
          {groupedContacts ? (
            groupedContacts.map((group) => (
              <div key={group.label} className="mb-4">
                <h3 className="text-white font-bold text-lg mb-3">{group.label}</h3>
                <div className="space-y-2">
                  {group.contacts.length > 0 ? (
                    group.contacts.map((contact) => (
                      <ContactButton key={contact.username} contact={contact}
                        selected={selectedChat === contact.username} gradient={group.gradient}
                        accentColor={accentColor} onClick={() => setSelectedChat(contact.username)}
                        unreadCount={unreadCounts[contact.username] || 0} />
                    ))
                  ) : (
                    <p className="text-gray-500 text-sm text-center py-3">Nenhum contato</p>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="space-y-2">
              <h3 className="text-white font-bold text-lg mb-3">Contatos</h3>
              {allContacts.length > 0 ? (
                allContacts.map((contact) => (
                  <ContactButton key={contact.username} contact={contact}
                    selected={selectedChat === contact.username}
                    gradient="linear-gradient(135deg, #00f0ff 0%, #8b5cf6 100%)"
                    accentColor={accentColor} onClick={() => setSelectedChat(contact.username)}
                    unreadCount={unreadCounts[contact.username] || 0} />
                ))
              ) : (
                <p className="text-gray-500 text-sm text-center py-8">Nenhum contato disponivel</p>
              )}
            </div>
          )}
        </div>

        {/* Chat Area */}
        <div className="md:col-span-2 bg-[#12121a] border border-[#1f1f2e] rounded-2xl flex flex-col">
          {selectedChat && selectedContact ? (
            <>
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-[#1f1f2e]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                    style={{ background: `linear-gradient(135deg, ${accentColor} 0%, #8b5cf6 100%)` }}>
                    {getAvatarText(selectedContact.photo)}
                  </div>
                  <div>
                    <p className="text-white font-semibold">{selectedContact.name}</p>
                    <p className="text-[#00ff41] text-xs">Online</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button className="p-2 rounded-lg hover:bg-[#1f1f2e] transition-colors" style={{ color: accentColor }}><Video className="w-5 h-5" /></button>
                  <button className="p-2 rounded-lg hover:bg-[#1f1f2e] transition-colors" style={{ color: accentColor }}><Phone className="w-5 h-5" /></button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3">
                {messages.length === 0 ? (
                  <div className="flex justify-center items-center h-full">
                    <p className="text-gray-500 text-sm">Inicie uma conversa com {selectedContact.name}</p>
                  </div>
                ) : (
                  <>
                    <AnimatePresence initial={false}>
                      {messages.map((msg) => {
                        const isMine = msg.from === currentUsername;
                        const bubbleClass = isMine
                          ? "bg-gradient-to-br from-[#00f0ff]/20 to-[#8b5cf6]/20 border border-[#00f0ff]/15"
                          : "bg-[#1f1f2e] border border-[#2a2a3e]";
                        return (
                          <motion.div key={msg.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.2 }} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                            <div className={`max-w-[70%] rounded-2xl overflow-hidden ${bubbleClass}`}>
                              {/* Image */}
                              {msg.type === "image" ? (
                                msg.imageUrl ? (
                                  <div>
                                    <button onClick={() => setPreviewImage(msg.imageUrl!)} className="w-full">
                                      <img src={msg.imageUrl} alt="Foto" className="w-full max-h-[240px] object-cover" />
                                    </button>
                                    <div className={`flex items-center gap-1 px-3 py-1.5 ${isMine ? "justify-end" : "justify-start"}`}>
                                      <span className="text-gray-500 text-[10px]">{formatTime(msg.timestamp)}</span>
                                      {isMine && (msg.read ? <CheckCheck className="w-3 h-3 text-[#00f0ff]" /> : <Check className="w-3 h-3 text-gray-500" />)}
                                    </div>
                                  </div>
                                ) : (
                                  <div className="px-4 py-6 flex flex-col items-center gap-2">
                                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                                      className="w-6 h-6 border-2 border-t-transparent rounded-full"
                                      style={{ borderColor: `${accentColor}60`, borderTopColor: "transparent" }} />
                                    <span className="text-gray-500 text-[10px]">Carregando foto...</span>
                                  </div>
                                )
                              ) : msg.type === "audio" ? (
                                /* Audio */
                                <div className="px-4 py-2.5">
                                  <div className="flex items-center gap-2.5">
                                    <motion.button whileTap={{ scale: 0.85 }} onClick={() => toggleAudioPlay(msg.id, msg)}
                                      className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                                      style={{ background: `linear-gradient(135deg, ${accentColor}, #8b5cf6)` }}>
                                      {playingAudioId === msg.id ? <Pause className="w-3.5 h-3.5 text-white" /> : <Play className="w-3.5 h-3.5 text-white ml-0.5" />}
                                    </motion.button>
                                    <div className="flex-1 min-w-0">
                                      <AudioWaveform playing={playingAudioId === msg.id} color={isMine ? accentColor : "#8b5cf6"} />
                                    </div>
                                    <span className="text-gray-500 text-[10px] font-mono shrink-0">{formatDuration(msg.audioDuration || 0)}</span>
                                  </div>
                                  <div className={`flex items-center gap-1 mt-1 ${isMine ? "justify-end" : "justify-start"}`}>
                                    <span className="text-gray-500 text-[10px]">{formatTime(msg.timestamp)}</span>
                                    {isMine && (msg.read ? <CheckCheck className="w-3 h-3 text-[#00f0ff]" /> : <Check className="w-3 h-3 text-gray-500" />)}
                                  </div>
                                </div>
                              ) : (
                                /* Text */
                                <div className="px-4 py-2.5">
                                  <p className="text-white text-sm break-words">{msg.text}</p>
                                  <div className={`flex items-center gap-1 mt-1 ${isMine ? "justify-end" : "justify-start"}`}>
                                    <span className="text-gray-500 text-[10px]">{formatTime(msg.timestamp)}</span>
                                    {isMine && (msg.read ? <CheckCheck className="w-3 h-3 text-[#00f0ff]" /> : <Check className="w-3 h-3 text-gray-500" />)}
                                  </div>
                                </div>
                              )}
                            </div>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              {/* Input */}
              <div className="p-3 border-t border-[#1f1f2e] relative">
                {/* Hidden file inputs */}
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelected} />
                <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleImageSelected} />

                {/* Attach menu */}
                <AnimatePresence>
                  {showAttachMenu && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                      className="absolute bottom-full left-3 mb-2 bg-[#1a1a2e] border border-[#2a2a3e] rounded-xl p-2 flex gap-2">
                      <button onClick={() => { cameraInputRef.current?.click(); setShowAttachMenu(false); }}
                        className="p-2.5 rounded-lg hover:bg-[#2a2a3e] transition-colors" style={{ color: accentColor }}>
                        <Camera className="w-5 h-5" />
                      </button>
                      <button onClick={() => { fileInputRef.current?.click(); setShowAttachMenu(false); }}
                        className="p-2.5 rounded-lg hover:bg-[#2a2a3e] transition-colors" style={{ color: accentColor }}>
                        <ImageIcon className="w-5 h-5" />
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>

                {isRecording ? (
                  /* Recording UI */
                  <div className="flex items-center gap-3">
                    <motion.button whileTap={{ scale: 0.9 }} onClick={() => stopRecording(true)}
                      className="p-2 rounded-lg bg-red-500/20 text-red-400">
                      <X className="w-5 h-5" />
                    </motion.button>
                    <div className="flex-1 flex items-center gap-2">
                      <motion.div animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1, repeat: Infinity }}
                        className="w-2.5 h-2.5 rounded-full bg-red-500" />
                      <span className="text-red-400 text-sm font-mono">{formatDuration(recordingTime)}</span>
                      {micSimulated && <span className="text-yellow-400 text-[10px]">(simulado)</span>}
                    </div>
                    <motion.button whileTap={{ scale: 0.9 }} onClick={() => stopRecording(false)}
                      className="p-3 rounded-xl text-white"
                      style={{ background: `linear-gradient(135deg, ${accentColor}, #8b5cf6)` }}>
                      <Send className="w-5 h-5" />
                    </motion.button>
                  </div>
                ) : (
                  /* Normal input */
                  <div className="flex items-center gap-2">
                    <button onClick={() => setShowAttachMenu(!showAttachMenu)}
                      className="p-2 rounded-lg hover:bg-[#1f1f2e] transition-colors" style={{ color: accentColor }}>
                      <Paperclip className="w-5 h-5" />
                    </button>
                    <input type="text" value={message} onChange={(e) => setMessage(e.target.value)}
                      onKeyDown={handleKeyDown} placeholder="Digite sua mensagem..."
                      className="flex-1 px-4 py-2.5 bg-[#1f1f2e] border border-[#2a2a3e] rounded-xl text-white text-sm focus:outline-none transition-colors"
                      style={{ borderColor: "transparent" }}
                      onFocus={(e) => (e.target.style.borderColor = accentColor)}
                      onBlur={(e) => (e.target.style.borderColor = "transparent")} />
                    {message.trim() ? (
                      <motion.button whileTap={{ scale: 0.95 }} onClick={handleSend} disabled={sending}
                        className="p-3 rounded-xl text-white disabled:opacity-50"
                        style={{ background: `linear-gradient(135deg, ${accentColor} 0%, #8b5cf6 100%)` }}>
                        <Send className="w-5 h-5" />
                      </motion.button>
                    ) : (
                      <motion.button whileTap={{ scale: 0.95 }} onMouseDown={startRecording}
                        className="p-3 rounded-xl text-white"
                        style={{ background: `linear-gradient(135deg, ${accentColor} 0%, #8b5cf6 100%)` }}>
                        <Mic className="w-5 h-5" />
                      </motion.button>
                    )}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-500 p-8">
              <div className="w-20 h-20 rounded-full bg-[#1f1f2e] flex items-center justify-center mb-4">
                <Send className="w-8 h-8 text-gray-600" />
              </div>
              <p className="text-lg font-medium">Selecione um contato</p>
              <p className="text-sm text-gray-600">para iniciar uma conversa</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ContactButton({
  contact, selected, gradient, accentColor, onClick, unreadCount = 0,
}: {
  contact: Contact; selected: boolean; gradient: string; accentColor: string; onClick: () => void; unreadCount?: number;
}) {
  return (
    <button onClick={onClick}
      className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${selected ? "" : "hover:bg-[#1f1f2e]"}`}
      style={selected ? { backgroundColor: `${accentColor}15`, borderColor: accentColor, borderWidth: 1, borderStyle: "solid" } : {}}>
      <div className="relative flex-shrink-0">
        <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-white border-2 border-gray-600"
          style={{ background: gradient }}>
          {getAvatarText(contact.photo)}
        </div>
        {unreadCount > 0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 min-w-[20px] h-[20px] bg-[#ff006e] rounded-full flex items-center justify-center px-1 shadow-[0_0_8px_rgba(255,0,110,0.5)]"
          >
            <span className="text-white text-[10px] font-black">{unreadCount > 99 ? "99+" : unreadCount}</span>
          </motion.div>
        )}
      </div>
      <div className="flex-1 text-left min-w-0">
        <p className={`font-semibold truncate ${unreadCount > 0 ? "text-white" : "text-white"}`}>{contact.name}</p>
        <p className="text-gray-400 text-sm truncate">@{contact.username}</p>
      </div>
      <div className="flex flex-col items-center gap-1 shrink-0">
        <motion.div animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 2, repeat: Infinity }}
          className="w-2 h-2 bg-[#00ff41] rounded-full" />
        {unreadCount > 0 && (
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-1.5 h-1.5 bg-[#ff006e] rounded-full"
          />
        )}
      </div>
    </button>
  );
}