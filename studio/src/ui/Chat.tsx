import React from 'react';
import {C, UI} from '../brand';
import {Send, Sparkle, Star} from './Icons';

/** Generic AI assistant window (unbranded). */
export const ChatFrame: React.FC<{width?: number; children: React.ReactNode; glow?: boolean; style?: React.CSSProperties}> = ({
  width = 800,
  children,
  glow,
  style,
}) => (
  <div
    style={{
      width,
      borderRadius: 40,
      background: 'linear-gradient(180deg, #181818 0%, #121212 100%)',
      border: `2px solid ${glow ? 'rgba(255,230,0,0.55)' : C.line}`,
      boxShadow: `0 40px 120px rgba(0,0,0,0.7)${glow ? ', 0 0 80px rgba(255,230,0,0.18)' : ''}`,
      overflow: 'hidden',
      fontFamily: UI,
      ...style,
    }}
  >
    <div style={{display: 'flex', alignItems: 'center', gap: 16, padding: '26px 34px', borderBottom: `2px solid ${C.line}`}}>
      <div
        style={{
          width: 54,
          height: 54,
          borderRadius: 16,
          background: C.yellow,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Sparkle size={32} color="#000" />
      </div>
      <div style={{color: C.white, fontSize: 36, fontWeight: 700}}>AI Assistant</div>
    </div>
    <div style={{padding: 34, display: 'flex', flexDirection: 'column', gap: 24}}>{children}</div>
  </div>
);

export const ChatInput: React.FC<{text: string; caret?: boolean; pressed?: boolean; placeholder?: string}> = ({
  text,
  caret,
  pressed,
  placeholder = 'Ask anything…',
}) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: 18,
      padding: '24px 24px 24px 34px',
      borderRadius: 999,
      background: '#1E1E1E',
      border: `2px solid ${text ? 'rgba(255,230,0,0.6)' : C.line}`,
      fontFamily: UI,
    }}
  >
    <div style={{flex: 1, fontSize: 40, fontWeight: 500, color: text ? C.white : C.gray, whiteSpace: 'nowrap', overflow: 'hidden'}}>
      {text || placeholder}
      {caret ? <span style={{color: C.yellow, marginLeft: 2}}>|</span> : null}
    </div>
    <div
      style={{
        width: 72,
        height: 72,
        borderRadius: 999,
        background: text ? C.yellow : '#2A2A2A',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transform: `scale(${pressed ? 0.82 : 1})`,
      }}
    >
      <Send size={38} color={text ? '#000' : C.gray} stroke={3} />
    </div>
  </div>
);

export const UserBubble: React.FC<{text: string; style?: React.CSSProperties}> = ({text, style}) => (
  <div
    style={{
      alignSelf: 'flex-end',
      background: C.yellow,
      color: '#000',
      fontSize: 40,
      fontWeight: 700,
      padding: '22px 32px',
      borderRadius: '34px 34px 8px 34px',
      fontFamily: UI,
      ...style,
    }}
  >
    {text}
  </div>
);

export const AssistantText: React.FC<{text: string; style?: React.CSSProperties}> = ({text, style}) => (
  <div
    style={{
      alignSelf: 'flex-start',
      background: '#1F1F1F',
      color: C.white,
      fontSize: 38,
      fontWeight: 500,
      lineHeight: 1.3,
      padding: '24px 30px',
      borderRadius: '34px 34px 34px 8px',
      fontFamily: UI,
      ...style,
    }}
  >
    {text}
  </div>
);

export const TypingDots: React.FC<{frame: number}> = ({frame}) => (
  <div style={{alignSelf: 'flex-start', display: 'flex', gap: 12, padding: '26px 30px', background: '#1F1F1F', borderRadius: 30}}>
    {[0, 1, 2].map((i) => (
      <div
        key={i}
        style={{
          width: 16,
          height: 16,
          borderRadius: 99,
          background: C.white,
          opacity: 0.35 + 0.65 * Math.max(0, Math.sin((frame - i * 4) / 3)),
        }}
      />
    ))}
  </div>
);

/** A result card in the AI answer list. */
export const BizCard: React.FC<{rank: number | string; name: string; meta: string; you?: boolean; ghost?: boolean; style?: React.CSSProperties}> = ({
  rank,
  name,
  meta,
  you,
  ghost,
  style,
}) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: 24,
      padding: '24px 28px',
      borderRadius: 28,
      background: you ? 'rgba(255,230,0,0.1)' : ghost ? 'transparent' : '#1C1C1C',
      border: you ? `3px solid ${C.yellow}` : ghost ? `3px dashed ${C.dim}` : `2px solid ${C.line}`,
      boxShadow: you ? '0 0 60px rgba(255,230,0,0.35)' : undefined,
      fontFamily: UI,
      ...style,
    }}
  >
    <div
      style={{
        width: 64,
        height: 64,
        borderRadius: 18,
        background: you ? C.yellow : ghost ? 'transparent' : '#2A2A2A',
        border: ghost ? `3px dashed ${C.dim}` : undefined,
        color: you ? '#000' : C.white,
        fontSize: 34,
        fontWeight: 800,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {rank}
    </div>
    <div style={{flex: 1}}>
      <div style={{fontSize: 38, fontWeight: 700, color: ghost ? C.gray : C.white}}>{name}</div>
      <div style={{fontSize: 28, fontWeight: 500, color: ghost ? C.dim : C.gray, marginTop: 4, display: 'flex', alignItems: 'center', gap: 6}}>
        {!ghost && [0, 1, 2, 3, 4].map((i) => <Star key={i} size={24} color={you ? C.yellow : '#BDBDBD'} />)}
        <span style={{marginLeft: ghost ? 0 : 10}}>{meta}</span>
      </div>
    </div>
  </div>
);
