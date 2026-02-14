"use client";

import { useEffect, useState } from "react";

const FIRE_EMOJIS = ["\uD83D\uDD25", "\u2728", "\uD83D\uDCAB", "\uD83C\uDF1F", "\uD83E\uDDE1", "\u2764\uFE0F\u200D\uD83D\uDD25"];

interface Ember {
  id: number;
  emoji: string;
  left: number;
  size: number;
  duration: number;
  delay: number;
}

interface GlowOrb {
  id: number;
  left: number;
  top: number;
  size: number;
  color: string;
  duration: number;
  delay: number;
}

const GLOW_COLORS = [
  "rgba(234, 88, 12, 0.15)",  // orange
  "rgba(220, 38, 38, 0.12)",  // red
  "rgba(245, 158, 11, 0.10)", // amber
  "rgba(194, 65, 12, 0.12)",  // dark orange
];

export function FireEffects() {
  const [embers, setEmbers] = useState<Ember[]>([]);
  const [orbs, setOrbs] = useState<GlowOrb[]>([]);

  useEffect(() => {
    const generated: Ember[] = Array.from({ length: 15 }, (_, i) => ({
      id: i,
      emoji: FIRE_EMOJIS[Math.floor(Math.random() * FIRE_EMOJIS.length)],
      left: Math.random() * 100,
      size: 8 + Math.random() * 16,
      duration: 6 + Math.random() * 8,
      delay: Math.random() * 10,
    }));
    setEmbers(generated);

    const generatedOrbs: GlowOrb[] = Array.from({ length: 4 }, (_, i) => ({
      id: i,
      left: 10 + Math.random() * 80,
      top: 10 + Math.random() * 80,
      size: 80 + Math.random() * 40,
      color: GLOW_COLORS[i % GLOW_COLORS.length],
      duration: 20 + Math.random() * 10,
      delay: Math.random() * 5,
    }));
    setOrbs(generatedOrbs);
  }, []);

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {/* Glow orbs */}
      {orbs.map((orb) => (
        <div
          key={`orb-${orb.id}`}
          className="glow-orb"
          style={{
            left: `${orb.left}%`,
            top: `${orb.top}%`,
            width: `${orb.size}px`,
            height: `${orb.size}px`,
            background: `radial-gradient(circle, ${orb.color}, transparent 70%)`,
            animationDuration: `${orb.duration}s`,
            animationDelay: `${orb.delay}s`,
          }}
        />
      ))}

      {/* Embers */}
      {embers.map((ember) => (
        <span
          key={ember.id}
          className="ember-float"
          style={{
            left: `${ember.left}%`,
            fontSize: `${ember.size}px`,
            animationDuration: `${ember.duration}s`,
            animationDelay: `${ember.delay}s`,
            opacity: 0.12,
          }}
        >
          {ember.emoji}
        </span>
      ))}
    </div>
  );
}
