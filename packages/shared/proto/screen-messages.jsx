/* Field ⇄ office messaging UI (window.__shieldChat backend).
   - ChatThread: one conversation (used by both surfaces), realtime.
   - PortalMessagesScreen: dispatcher inbox — every technician thread + convo.
   - TechMessagesView: the technician's own thread with dispatch. */

function chatTimeLabel(iso) {
  try {
    const d = new Date(iso);
    const today = new Date();
    const sameDay = d.toDateString() === today.toDateString();
    return sameDay ? d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
      : d.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' ' + d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  } catch { return ''; }
}

function ChatThread({ threadId, title, subtitle, emptyHint }) {
  const chat = window.__shieldChat;
  const meId = (window.__shieldUser || {}).id;
  const [msgs, setMsgs] = React.useState([]);
  const [text, setText] = React.useState('');
  const [sending, setSending] = React.useState(false);
  const scrollRef = React.useRef(null);

  const load = React.useCallback(async () => {
    if (!chat || !threadId) return;
    setMsgs(await chat.list(threadId));
    chat.markRead(threadId);
  }, [chat, threadId]);

  React.useEffect(() => { load(); }, [load]);
  React.useEffect(() => {
    if (!chat) return;
    return chat.subscribe(m => { if (m.thread_id === threadId) { setMsgs(prev => prev.some(x => x.id === m.id) ? prev : [...prev, m]); if (m.sender_id !== meId) chat.markRead(threadId); } });
  }, [chat, threadId, meId]);
  React.useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [msgs]);

  const send = async () => {
    const body = text.trim();
    if (!body || !chat || sending) return;
    setSending(true); setText('');
    const res = await chat.send(threadId, body);
    setSending(false);
    if (!res.ok) { setText(body); if (window.showToast) window.showToast(res.error === 'offline' ? 'Messaging needs the backend configured' : 'Could not send', 'warn'); return; }
    if (res.data) setMsgs(prev => prev.some(x => x.id === res.data.id) ? prev : [...prev, res.data]);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      {title && (
        <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border-subtle)', flexShrink: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-high)' }}>{title}</div>
          {subtitle && <div style={{ fontSize: 11, color: 'var(--text-low)' }}>{subtitle}</div>}
        </div>
      )}
      <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: 14, display: 'flex', flexDirection: 'column', gap: 8, minHeight: 0 }}>
        {msgs.length === 0 && (
          <div style={{ margin: 'auto', textAlign: 'center', color: 'var(--text-low)', fontSize: 12, maxWidth: 300, lineHeight: 1.5 }}>{emptyHint || 'No messages yet — say hello.'}</div>
        )}
        {msgs.map(m => {
          const mine = m.sender_id === meId;
          return (
            <div key={m.id} style={{ alignSelf: mine ? 'flex-end' : 'flex-start', maxWidth: '80%' }}>
              {!mine && <div style={{ fontSize: 10, color: 'var(--text-low)', margin: '0 0 2px 4px' }}>{m.sender_name}{m.sender_role ? ` · ${m.sender_role}` : ''}</div>}
              <div style={{ padding: '8px 12px', borderRadius: 12, fontSize: 13, lineHeight: 1.45, background: mine ? 'var(--brand)' : 'var(--glass-bg)', color: mine ? '#04121F' : 'var(--text-high)', border: mine ? 'none' : '1px solid var(--border-subtle)', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{m.body}</div>
              <div style={{ fontSize: 9, color: 'var(--text-low)', textAlign: mine ? 'right' : 'left', margin: '2px 4px 0' }}>{chatTimeLabel(m.created_at)}</div>
            </div>
          );
        })}
      </div>
      <div style={{ padding: 10, borderTop: '1px solid var(--border-subtle)', display: 'flex', gap: 8, flexShrink: 0 }}>
        <input value={text} onChange={e => setText(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
          placeholder="Type a message…" style={{ flex: 1, padding: '10px 14px', background: 'rgba(5,7,10,0.5)', border: '1px solid var(--border-subtle)', borderRadius: 10, color: 'var(--text-high)', fontSize: 14, fontFamily: 'var(--font-body)', outline: 'none' }} />
        <button onClick={send} disabled={sending || !text.trim()} style={{ padding: '0 18px', background: 'var(--brand)', border: 'none', borderRadius: 10, color: '#04121F', fontSize: 13, fontWeight: 700, cursor: text.trim() ? 'pointer' : 'default', opacity: text.trim() ? 1 : 0.5, fontFamily: 'var(--font-body)' }}>Send</button>
      </div>
    </div>
  );
}

/* Dispatcher inbox — technician threads on the left, conversation on the right. */
function PortalMessagesScreen() {
  const chat = window.__shieldChat;
  const [threads, setThreads] = React.useState([]);
  const [sel, setSel] = React.useState(window.__shieldMsgFocus || null);
  const refresh = React.useCallback(async () => { if (chat) setThreads(await chat.threads()); }, [chat]);
  React.useEffect(() => { refresh(); }, [refresh]);
  React.useEffect(() => { if (!chat) return; return chat.subscribe(() => refresh()); }, [chat, refresh]);
  React.useEffect(() => { if (window.__shieldMsgFocus) { setSel(window.__shieldMsgFocus); window.__shieldMsgFocus = null; } }, []);
  const active = threads.find(t => t.threadId === sel);

  return (
    <div data-screen-label="Messages" style={{ display: 'flex', gap: 12, height: 'calc(100vh - 96px)', minHeight: 420 }}>
      <div className="glass" style={{ width: 300, flexShrink: 0, borderRadius: 12, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border-subtle)', fontSize: 14, fontWeight: 600 }}>Messages</div>
        <div style={{ overflowY: 'auto', flex: 1 }}>
          {threads.length === 0 && <div style={{ padding: 18, fontSize: 12, color: 'var(--text-low)', lineHeight: 1.5 }}>No conversations yet. Field techs' messages land here, and you can reply from any technician's card on the Dispatch map.</div>}
          {threads.map(t => (
            <button key={t.threadId} onClick={() => setSel(t.threadId)} style={{ display: 'flex', width: '100%', gap: 10, alignItems: 'center', padding: '11px 14px', background: sel === t.threadId ? 'rgba(63,169,245,0.1)' : 'none', border: 'none', borderBottom: '1px solid var(--border-subtle)', cursor: 'pointer', textAlign: 'left', fontFamily: 'var(--font-body)' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-high)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.name || 'Technician'}</div>
                <div style={{ fontSize: 11, color: 'var(--text-low)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.last}</div>
              </div>
              {t.unread > 0 && <span style={{ background: 'var(--brand)', color: '#04121F', fontSize: 10, fontWeight: 700, borderRadius: 10, padding: '1px 7px', flexShrink: 0 }}>{t.unread}</span>}
            </button>
          ))}
        </div>
      </div>
      <div className="glass" style={{ flex: 1, borderRadius: 12, overflow: 'hidden', minWidth: 0 }}>
        {active
          ? <ChatThread threadId={active.threadId} title={active.name || 'Technician'} subtitle="Dispatch conversation" emptyHint="Start the conversation with this technician." />
          : <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-low)', fontSize: 13 }}>Select a conversation</div>}
      </div>
    </div>
  );
}

/* Technician's own thread with dispatch. */
function TechMessagesView() {
  const id = window.__shieldChat && window.__shieldChat.myThreadId();
  if (!id) return <div style={{ padding: 24, color: 'var(--text-low)', fontSize: 13 }}>Sign in to message dispatch.</div>;
  return (
    <div style={{ height: 'calc(100dvh - 200px)', minHeight: 360 }}>
      <div className="glass" style={{ height: '100%', borderRadius: 12, overflow: 'hidden' }}>
        <ChatThread threadId={id} title="Dispatch" subtitle="Message the office" emptyHint="Message dispatch — updates, questions, or a heads-up from the field. They'll see it instantly." />
      </div>
    </div>
  );
}

Object.assign(window, { ChatThread, PortalMessagesScreen, TechMessagesView });
