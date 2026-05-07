import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import clsx from 'clsx';
import { CharacterAvatar } from '../player/CharacterAvatar';
import { characterColor, formatDateTime } from '../../utils/formatting';
import type { IStandingsHistorySnapshot } from '../../types';

interface Props {
  snapshots: IStandingsHistorySnapshot[];
  slug: string;
}

interface PlayerSeries {
  id: string;
  gamerTag: string;
  name: string;
  character?: string;
  color: string;
  points: { x: number; y: number; rank: number; snapIdx: number }[];
  finalRank: number;
  bestRank: number;
  worstRank: number;
}

const VB_W = 1000;
const PAD_LEFT = 56;
const PAD_RIGHT = 168;
const PAD_TOP = 32;
const PAD_BOTTOM = 56;
const ROW_H = 26;

function buildSmoothPath(pts: { x: number; y: number }[]): string {
  if (pts.length === 0) return '';
  if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y}`;
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1];
    const b = pts[i];
    const cx = (a.x + b.x) / 2;
    d += ` C ${cx} ${a.y}, ${cx} ${b.y}, ${b.x} ${b.y}`;
  }
  return d;
}

export function StandingsHistoryChart({ snapshots, slug }: Props) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [lockedId, setLockedId] = useState<string | null>(null);

  const focusedId = lockedId ?? activeId;

  const { series, maxRank, capturedAtList, vbH, snapXs } = useMemo(() => {
    if (snapshots.length === 0) {
      return {
        series: [] as PlayerSeries[],
        maxRank: 0,
        capturedAtList: [] as string[],
        vbH: 200,
        snapXs: [] as number[],
      };
    }

    let maxR = 0;
    for (const s of snapshots) {
      for (const r of s.rows) if (r.rank > maxR) maxR = r.rank;
    }

    const innerW = VB_W - PAD_LEFT - PAD_RIGHT;
    const xs = snapshots.map((_, i) =>
      snapshots.length === 1
        ? PAD_LEFT + innerW / 2
        : PAD_LEFT + (innerW * i) / (snapshots.length - 1),
    );

    const playerMap = new Map<string, PlayerSeries>();
    snapshots.forEach((snap, i) => {
      for (const row of snap.rows) {
        const id = row.player._id;
        let s = playerMap.get(id);
        if (!s) {
          s = {
            id,
            gamerTag: row.player.gamerTag,
            name: row.player.name,
            character: row.player.character,
            color: characterColor(row.player.gamerTag),
            points: [],
            finalRank: row.rank,
            bestRank: row.rank,
            worstRank: row.rank,
          };
          playerMap.set(id, s);
        }
        s.points.push({ x: xs[i], y: 0, rank: row.rank, snapIdx: i });
        s.bestRank = Math.min(s.bestRank, row.rank);
        s.worstRank = Math.max(s.worstRank, row.rank);
        if (i === snapshots.length - 1) s.finalRank = row.rank;
      }
    });

    const height = PAD_TOP + maxR * ROW_H + PAD_BOTTOM;
    const yForRank = (rank: number) => PAD_TOP + (rank - 0.5) * ROW_H;
    for (const s of playerMap.values()) {
      s.points = s.points.map((p) => ({ ...p, y: yForRank(p.rank) }));
    }

    const sorted = Array.from(playerMap.values()).sort(
      (a, b) => a.finalRank - b.finalRank,
    );

    return {
      series: sorted,
      maxRank: maxR,
      capturedAtList: snapshots.map((s) => s.capturedAt),
      vbH: height,
      snapXs: xs,
    };
  }, [snapshots]);

  if (snapshots.length === 0) return null;

  const yForRank = (rank: number) => PAD_TOP + (rank - 0.5) * ROW_H;

  const isSingle = snapshots.length === 1;
  const focused = focusedId ? series.find((s) => s.id === focusedId) : null;

  return (
    <div className="relative">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3 text-[11px] font-mono text-text-muted">
        <div>
          {snapshots.length} snapshot{snapshots.length === 1 ? '' : 's'} ·{' '}
          {formatDateTime(capturedAtList[0])} →{' '}
          {formatDateTime(capturedAtList[capturedAtList.length - 1])}
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden sm:inline">
            Hover a line to spotlight · click to lock
          </span>
          {lockedId && (
            <button
              type="button"
              onClick={() => setLockedId(null)}
              className="text-accent-yellow hover:underline"
            >
              clear
            </button>
          )}
        </div>
      </div>

      <div
        className="relative w-full"
        onMouseLeave={() => setActiveId(null)}
        onClick={(e) => {
          if (e.target === e.currentTarget) setLockedId(null);
        }}
      >
        <svg
          viewBox={`0 0 ${VB_W} ${vbH}`}
          className="w-full h-auto block"
          preserveAspectRatio="none"
          style={{ minHeight: vbH * 0.55 }}
        >
          {Array.from({ length: maxRank }).map((_, i) => {
            const rank = i + 1;
            const y = yForRank(rank);
            return (
              <g key={`grid-${rank}`}>
                <line
                  x1={PAD_LEFT}
                  x2={VB_W - PAD_RIGHT}
                  y1={y}
                  y2={y}
                  stroke="#2a2a3e"
                  strokeWidth={rank === 1 ? 1.5 : 0.6}
                  strokeDasharray={rank === 1 ? '' : '2 4'}
                />
                <text
                  x={PAD_LEFT - 10}
                  y={y + 3}
                  textAnchor="end"
                  fontFamily="JetBrains Mono, Fira Code, monospace"
                  fontSize="11"
                  fill={
                    rank === 1
                      ? '#FFD700'
                      : rank <= 3
                        ? '#8888aa'
                        : '#555577'
                  }
                >
                  #{rank}
                </text>
              </g>
            );
          })}

          {snapXs.map((x, i) => (
            <g key={`xtick-${i}`}>
              <line
                x1={x}
                x2={x}
                y1={PAD_TOP - 6}
                y2={vbH - PAD_BOTTOM + 6}
                stroke="#2a2a3e"
                strokeWidth={0.6}
              />
              <text
                x={x}
                y={vbH - PAD_BOTTOM + 22}
                textAnchor="middle"
                fontFamily="JetBrains Mono, Fira Code, monospace"
                fontSize="10"
                fill="#8888aa"
              >
                {new Date(capturedAtList[i]).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                })}
              </text>
              <text
                x={x}
                y={vbH - PAD_BOTTOM + 36}
                textAnchor="middle"
                fontFamily="JetBrains Mono, Fira Code, monospace"
                fontSize="9"
                fill="#555577"
              >
                {new Date(capturedAtList[i]).toLocaleTimeString(undefined, {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </text>
            </g>
          ))}

          {series.map((s) => {
            const isFocused = focusedId === s.id;
            const isMuted = focusedId != null && !isFocused;
            const baseOpacity = focusedId == null
              ? s.finalRank <= 3
                ? 0.95
                : s.finalRank <= 8
                  ? 0.55
                  : 0.3
              : isFocused
                ? 1
                : 0.08;
            const baseWidth = isFocused ? 4 : s.finalRank <= 3 ? 2.5 : 1.6;
            const path = buildSmoothPath(s.points);
            return (
              <g
                key={`line-${s.id}`}
                style={{
                  cursor: 'pointer',
                  transition: 'opacity 200ms ease',
                  opacity: baseOpacity,
                }}
                onMouseEnter={() => setActiveId(s.id)}
                onClick={(e) => {
                  e.stopPropagation();
                  setLockedId((prev) => (prev === s.id ? null : s.id));
                }}
              >
                {!isSingle && (
                  <path
                    d={path}
                    fill="none"
                    stroke={s.color}
                    strokeWidth={baseWidth + 6}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity={isFocused ? 0.18 : 0}
                  />
                )}
                {!isSingle && (
                  <path
                    d={path}
                    fill="none"
                    stroke={s.color}
                    strokeWidth={baseWidth}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}
                {s.points.map((p) => (
                  <circle
                    key={`dot-${s.id}-${p.snapIdx}`}
                    cx={p.x}
                    cy={p.y}
                    r={isFocused ? 5 : s.finalRank <= 3 ? 3 : 2.2}
                    fill={isMuted ? '#1a1a2e' : s.color}
                    stroke={isFocused ? '#0a0a0f' : 'transparent'}
                    strokeWidth={isFocused ? 1.5 : 0}
                  />
                ))}
                {/* Wide invisible hit area along the line */}
                {!isSingle && (
                  <path
                    d={path}
                    fill="none"
                    stroke="transparent"
                    strokeWidth={16}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    pointerEvents="stroke"
                  />
                )}
              </g>
            );
          })}

          {/* Right-edge labels (final standing) */}
          {series.map((s) => {
            const last = s.points[s.points.length - 1];
            if (!last) return null;
            const isFocused = focusedId === s.id;
            const isMuted = focusedId != null && !isFocused;
            const opacity = focusedId == null
              ? s.finalRank <= 8
                ? 1
                : 0.5
              : isFocused
                ? 1
                : 0.2;
            return (
              <g
                key={`lbl-${s.id}`}
                style={{ cursor: 'pointer', opacity, transition: 'opacity 200ms ease' }}
                onMouseEnter={() => setActiveId(s.id)}
                onClick={(e) => {
                  e.stopPropagation();
                  setLockedId((prev) => (prev === s.id ? null : s.id));
                }}
              >
                <line
                  x1={last.x}
                  x2={VB_W - PAD_RIGHT + 12}
                  y1={last.y}
                  y2={last.y}
                  stroke={s.color}
                  strokeWidth={isFocused ? 1.5 : 0.6}
                  strokeDasharray="2 3"
                  opacity={isMuted ? 0.2 : 0.6}
                />
                <text
                  x={VB_W - PAD_RIGHT + 16}
                  y={last.y + 4}
                  fontFamily="Rajdhani, Oswald, sans-serif"
                  fontSize={isFocused ? 14 : 12}
                  fontWeight={s.finalRank <= 3 ? 700 : 500}
                  fill={isFocused ? s.color : isMuted ? '#555577' : '#f0f0f5'}
                  letterSpacing="1"
                >
                  {s.gamerTag}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Spotlight detail card */}
      {focused && (
        <div className="mt-4 border border-border bg-bg-secondary clip-angled p-4 animate-slide-up">
          <div className="flex flex-wrap items-center gap-3">
            <CharacterAvatar
              name={focused.gamerTag}
              character={focused.character}
              size="md"
            />
            <div className="flex-1 min-w-0">
              <Link
                to={`/t/${slug}/player/${focused.id}`}
                className="font-display text-xl tracking-wider hover:text-accent-yellow truncate block"
                style={{ color: focused.color }}
              >
                {focused.gamerTag}
              </Link>
              <div className="text-[11px] text-text-muted truncate">
                {focused.name}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3 font-mono text-xs">
              <Stat label="Final" value={`#${focused.finalRank}`} tone="yellow" />
              <Stat label="Peak" value={`#${focused.bestRank}`} tone="green" />
              <Stat label="Low" value={`#${focused.worstRank}`} tone="red" />
              <Stat
                label="Δ"
                value={(() => {
                  const first = focused.points[0]?.rank;
                  const last = focused.points[focused.points.length - 1]?.rank;
                  if (first == null || last == null) return '—';
                  const delta = first - last;
                  if (delta === 0) return '0';
                  return delta > 0 ? `▲ ${delta}` : `▼ ${-delta}`;
                })()}
                tone={(() => {
                  const first = focused.points[0]?.rank;
                  const last = focused.points[focused.points.length - 1]?.rank;
                  if (first == null || last == null) return 'muted';
                  const delta = first - last;
                  if (delta > 0) return 'green';
                  if (delta < 0) return 'red';
                  return 'muted';
                })()}
              />
            </div>
          </div>
          <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2">
            {focused.points.map((p, i) => (
              <div
                key={`hist-${i}`}
                className="border border-border/60 px-2 py-1.5 clip-angled bg-bg-tertiary"
              >
                <div className="text-[9px] uppercase tracking-widest text-text-muted">
                  {new Date(capturedAtList[p.snapIdx]).toLocaleDateString(
                    undefined,
                    { month: 'short', day: 'numeric' },
                  )}
                </div>
                <div className="font-display text-lg tracking-wider">
                  #{p.rank}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: 'yellow' | 'green' | 'red' | 'muted';
}) {
  const color = {
    yellow: 'text-accent-yellow',
    green: 'text-accent-green',
    red: 'text-accent-red',
    muted: 'text-text-muted',
  }[tone];
  return (
    <div className="flex flex-col items-end">
      <span className="text-[9px] uppercase tracking-widest text-text-muted">
        {label}
      </span>
      <span className={clsx('font-display tracking-wider text-base', color)}>
        {value}
      </span>
    </div>
  );
}
