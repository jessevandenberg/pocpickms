"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type Team = {
  id: number;
  name: string;
};

type Match = {
  id: string;
  teamA?: Team;
  teamB?: Team;
  winner?: Team;
  outcome?: Team; // simulated result
};

const initialTeams: Team[] = [
  { id: 1, name: "papaneus" },
  { id: 2, name: "morrog" },
  { id: 3, name: "faralley" },
  { id: 4, name: "puxque" },
  { id: 5, name: "sejecem" },
  { id: 6, name: "salina" },
  { id: 7, name: "issy" },
  { id: 8, name: "milan" },
];

const buttonBase =
  "w-full rounded-md border border-white/10 bg-white/5 px-2 py-1.5 text-left text-xs text-white hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400";

const roundTitle = "text-[10px] uppercase tracking-wide text-white/60";

const bracketCard =
  "rounded-md border border-white/10 bg-zinc-900/60 p-2 backdrop-blur-sm";

const getCardStateClass = (m?: Match) => {
  if (!m) return "";
  if (!m.outcome) return "";
  if (!m.winner) return "border-white/10";
  return m.winner.id === m.outcome.id
    ? "border-emerald-500/70 ring-1 ring-emerald-500/40"
    : "border-rose-500/70 ring-1 ring-rose-500/40";
};

const getSeedStatus = (m?: Match, team?: Team): "win" | "lose" | "neutral" => {
  if (!m?.outcome || !team) return "neutral";
  return m.outcome.id === team.id ? "win" : "lose";
};

const line = "self-stretch w-px bg-white/10";

const column = "flex w-48 flex-col gap-2";

const container =
  "min-h-screen w-full bg-gradient-to-b from-zinc-950 to-zinc-900 text-white flex flex-col";

const header =
  "mx-auto max-w-6xl px-6 h-16 flex items-center justify-between";

const row =
  "mx-auto max-w-6xl px-4 pb-16 flex-1 flex flex-row items-stretch gap-6 min-h-[calc(100vh-4rem)]";

const seedButton = (
  team?: Team,
  isSelected?: boolean,
  onClick?: () => void,
  status?: "win" | "lose" | "neutral"
) => {
  if (!team) {
    return (
      <div className="w-full rounded-md border border-white/10 px-3 py-2 text-left text-sm text-white/40">
        TBD
      </div>
    );
  }

  const tone =
    status === "win"
      ? "bg-emerald-500/20 border-emerald-400/40 text-emerald-100"
      : status === "lose"
      ? "bg-rose-500/20 border-rose-400/40 text-rose-100"
      : "";

  return (
    <button
      type="button"
      className={`${buttonBase} ${tone} ${isSelected ? "ring-2 ring-cyan-400/70" : ""}`}
      onClick={onClick}
      aria-pressed={!!isSelected}
      aria-label={`Select ${team.name}`}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick?.();
        }
      }}
    >
      {team.name}
    </button>
  );
};

export default function Home() {
  const [qf, setQf] = useState<Match[]>([
    { id: "QF1", teamA: initialTeams[0], teamB: initialTeams[1] },
    { id: "QF2", teamA: initialTeams[2], teamB: initialTeams[3] },
    { id: "QF3", teamA: initialTeams[4], teamB: initialTeams[5] },
    { id: "QF4", teamA: initialTeams[6], teamB: initialTeams[7] },
  ]);

  const [sf, setSf] = useState<Match[]>([
    { id: "SF1" },
    { id: "SF2" },
  ]);

  const [finalMatch, setFinalMatch] = useState<Match>({ id: "F" });

  // Points system: after simulation, 3 if pick matches outcome, else 1 (if outcome exists)
  const points = useMemo(() => {
    const calc = (m?: Match) => {
      if (!m) return 0;
      if (!m.outcome) return 0;
      if (m.winner && m.outcome && m.winner.id === m.outcome.id) return 3;
      return 1;
    };
    const qfPoints = qf.reduce((acc, m) => acc + calc(m), 0);
    const sfPoints = sf.reduce((acc, m) => acc + calc(m), 0);
    const fPoints = calc(finalMatch);
    return qfPoints + sfPoints + fPoints;
  }, [qf, sf, finalMatch]);

  const checkpoints = [
    { points: 6, name: "Bronze crate", image: "/bronze-crate.png" },
    { points: 12, name: "Silver crate", image: "/silver-crate.png" },
    { points: 18, name: "Gold crate", image: "/gold-crate.png" },
  ];

  const [announced, setAnnounced] = useState<number[]>([]);

  const pickRandom = (a?: Team, b?: Team): Team | undefined => {
    if (!a && !b) return undefined;
    if (a && !b) return a;
    if (b && !a) return b;
    return Math.random() < 0.5 ? a : b;
  };

  const handleSimulate = useCallback(() => {
    // Randomize each match independently so 0..7 correct is possible
    setQf((prev) => prev.map((m) => ({ ...m, outcome: pickRandom(m.teamA, m.teamB) })));
    setSf((prev) => prev.map((m) => ({ ...m, outcome: pickRandom(m.teamA, m.teamB) })));
    setFinalMatch((prev) => ({ ...prev, outcome: pickRandom(prev.teamA, prev.teamB) }));
  }, []);

  const handlePick = useCallback(
    (round: "QF" | "SF" | "F", matchIndex: number, pick: "A" | "B") => {
      if (round === "QF") {
        setQf((prev) => {
          const next = [...prev];
          const match = next[matchIndex];
          const winner = pick === "A" ? match.teamA : match.teamB;
          next[matchIndex] = { ...match, winner };
          return next;
        });

        // propagate to SF
        setSf((prev) => {
          const next = [...prev];
          const sourceMatch = qf[matchIndex];
          const winner = pick === "A" ? sourceMatch.teamA : sourceMatch.teamB;
          const targetIndex = matchIndex < 2 ? 0 : 1; // QF1+QF2 -> SF1, QF3+QF4 -> SF2
          const isFirstSlot = matchIndex % 2 === 0;
          const target = next[targetIndex] ?? { id: targetIndex === 0 ? "SF1" : "SF2" };
          next[targetIndex] = {
            ...target,
            teamA: isFirstSlot ? winner : target.teamA,
            teamB: !isFirstSlot ? winner : target.teamB,
            // clear winner if teams changed
            winner: undefined,
          };
          // when both teams set, keep as is; otherwise no winner
          return next;
        });
        // also clear final if upstream changes
        setFinalMatch((prev) => ({ id: prev.id }));
        return;
      }

      if (round === "SF") {
        setSf((prev) => {
          const next = [...prev];
          const match = next[matchIndex];
          const winner = pick === "A" ? match.teamA : match.teamB;
          next[matchIndex] = { ...match, winner };
          return next;
        });

        // propagate to Final
        setFinalMatch((prev) => {
          const sourceMatch = sf[matchIndex];
          const winner = pick === "A" ? sourceMatch.teamA : sourceMatch.teamB;
          const isFirstSlot = matchIndex === 0;
          const next: Match = {
            id: "F",
            teamA: isFirstSlot ? winner : prev.teamA,
            teamB: !isFirstSlot ? winner : prev.teamB,
            winner: undefined,
          };
          return next;
        });
        return;
      }

      // Final pick
      setFinalMatch((prev) => {
        const winner = pick === "A" ? prev.teamA : prev.teamB;
        return { ...prev, winner };
      });
    },
    [qf, sf]
  );

  const handleReset = useCallback(() => {
    setQf([
      { id: "QF1", teamA: initialTeams[0], teamB: initialTeams[1] },
      { id: "QF2", teamA: initialTeams[2], teamB: initialTeams[3] },
      { id: "QF3", teamA: initialTeams[4], teamB: initialTeams[5] },
      { id: "QF4", teamA: initialTeams[6], teamB: initialTeams[7] },
    ]);
    setSf([{ id: "SF1" }, { id: "SF2" }]);
    setFinalMatch({ id: "F" });
  }, []);

  const champion = useMemo(() => finalMatch.winner?.name ?? "TBD", [finalMatch]);

  useEffect(() => {
    const newlyReached = checkpoints
      .filter((c) => points >= c.points && !announced.includes(c.points))
      .map((c) => c.points);
    if (newlyReached.length > 0) {
      newlyReached.forEach((p) => {
        const cp = checkpoints.find((c) => c.points === p);
        if (cp) {
          let message = "";
          switch (cp.points) {
            case 6:
              message = `Top! Je eerste mijlpaal is binnen: ${cp.name} (6 punten).`;
              break;
            case 12:
              message = `Lekker bezig! Halverwege: ${cp.name} (12 punten).`;
              break;
            case 18:
              message = `Geweldig! Je hebt alle picks goed: ${cp.name} (18 punten).`;
              break;
            default:
              message = `Gefeliciteerd! Checkpoint gehaald: ${cp.name} (${cp.points} punten).`;
          }
          alert(message);
        }
      });
      setAnnounced((prev) => [...prev, ...newlyReached]);
    }
  }, [points, checkpoints, announced]);

  return (
    <main className={container}>
      <header className={header}>
        <h1 className="text-lg font-semibold">8-Team Pick'em Bracket</h1>
        <div className="fixed right-4 top-4 z-50 flex items-center gap-2">
          <button
            type="button"
            className="rounded-md bg-cyan-500 px-3 py-1.5 text-xs font-medium text-zinc-950 hover:bg-cyan-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
            onClick={handleReset}
            aria-label="Reset bracket"
          >
            Reset
          </button>
          <button
            type="button"
            className="rounded-md bg-emerald-500 px-3 py-1.5 text-xs font-medium text-zinc-950 hover:bg-emerald-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
            onClick={handleSimulate}
            aria-label="Simuleer uitslagen"
          >
            Simuleer
          </button>
        </div>
      </header>

      {/* Progress bar with 3 checkpoints */}
      <div className="mx-auto max-w-6xl px-4 pb-3 w-full">
        <div className="mb-1 flex items-center justify-between text-[10px] text-white/70">
          <span>Punten: {points}</span>
          <span>Doelen: 6 / 12 / 18</span>
        </div>
        <div className="relative h-1.5 w-full rounded-full bg-white/10">
          <div
            className="absolute left-0 top-0 h-1.5 rounded-full bg-cyan-500"
            style={{ width: `${Math.min((points / 18) * 100, 100)}%` }}
            aria-label={`Progress ${points} van 18 punten`}
          />
          {checkpoints.map((cp) => (
            <div
              key={cp.points}
              className="group absolute top-1/2 h-3 w-3 -translate-y-1/2 rounded-full border border-white/30 bg-zinc-900"
              style={{ left: `${(cp.points / 18) * 100}%`, marginLeft: -6 }}
            >
              <div
                className={`${points >= cp.points ? "bg-emerald-400" : "bg-white/30"} h-1.5 w-1.5 rounded-full m-0.75 mx-auto mt-0.75`}
              />
              <div className="pointer-events-none absolute left-1/2 top-full z-50 mt-3 hidden -translate-x-1/2 whitespace-normal rounded-lg border border-white/15 bg-zinc-900/95 px-5 py-4 text-sm text-white shadow-2xl backdrop-blur-md group-hover:block min-w-56 max-w-72">
                <div className="flex items-center gap-4">
                  <img src={cp.image} alt="prijs" className={`${cp.name === "Gold crate" ? "h-20 w-20" : "h-16 w-16"} rounded-md object-contain`} />
                  <div className="flex flex-col">
                    <div className="text-base font-semibold leading-tight">{cp.name}</div>
                    <div className="mt-1 text-xs text-white/80 leading-snug">Unlock bij {cp.points} punten</div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-1 text-[10px] text-white/60">Prijzen bij elk checkpoint gehaald.</div>
      </div>

      <section className={row}>
        {/* Quarterfinals stacked under each other (left column, vertically centered) */}
        <div className={`${column} justify-center`}>
          <div className={`${bracketCard} ${getCardStateClass(qf[0])}`}>
            <div className={roundTitle}>Quarterfinal 1</div>
            <div className="mt-2 flex flex-col gap-2">
              {seedButton(
                qf[0].teamA,
                qf[0].winner?.id === qf[0].teamA?.id,
                () => handlePick("QF", 0, "A"),
                getSeedStatus(qf[0], qf[0].teamA)
              )}
              {seedButton(
                qf[0].teamB,
                qf[0].winner?.id === qf[0].teamB?.id,
                () => handlePick("QF", 0, "B"),
                getSeedStatus(qf[0], qf[0].teamB)
              )}
            </div>
          </div>

          <div className="h-8" />

          <div className={`${bracketCard} ${getCardStateClass(qf[1])}`}>
            <div className={roundTitle}>Quarterfinal 2</div>
            <div className="mt-2 flex flex-col gap-2">
              {seedButton(
                qf[1].teamA,
                qf[1].winner?.id === qf[1].teamA?.id,
                () => handlePick("QF", 1, "A"),
                getSeedStatus(qf[1], qf[1].teamA)
              )}
              {seedButton(
                qf[1].teamB,
                qf[1].winner?.id === qf[1].teamB?.id,
                () => handlePick("QF", 1, "B"),
                getSeedStatus(qf[1], qf[1].teamB)
              )}
            </div>
          </div>

          <div className="h-8" />

          <div className={`${bracketCard} ${getCardStateClass(qf[2])}`}>
            <div className={roundTitle}>Quarterfinal 3</div>
            <div className="mt-2 flex flex-col gap-2">
              {seedButton(
                qf[2].teamA,
                qf[2].winner?.id === qf[2].teamA?.id,
                () => handlePick("QF", 2, "A"),
                getSeedStatus(qf[2], qf[2].teamA)
              )}
              {seedButton(
                qf[2].teamB,
                qf[2].winner?.id === qf[2].teamB?.id,
                () => handlePick("QF", 2, "B"),
                getSeedStatus(qf[2], qf[2].teamB)
              )}
            </div>
          </div>

          <div className="h-8" />

          <div className={`${bracketCard} ${getCardStateClass(qf[3])}`}>
            <div className={roundTitle}>Quarterfinal 4</div>
            <div className="mt-2 flex flex-col gap-2">
              {seedButton(
                qf[3].teamA,
                qf[3].winner?.id === qf[3].teamA?.id,
                () => handlePick("QF", 3, "A"),
                getSeedStatus(qf[3], qf[3].teamA)
              )}
              {seedButton(
                qf[3].teamB,
                qf[3].winner?.id === qf[3].teamB?.id,
                () => handlePick("QF", 3, "B"),
                getSeedStatus(qf[3], qf[3].teamB)
              )}
            </div>
          </div>
        </div>

        <div className={line} />

        

        {/* Semifinals stacked under each other (middle column, vertically centered) */}
        <div className={`${column} justify-center`}>
          <div className={`${bracketCard} ${getCardStateClass(sf[0])}`}>
            <div className={roundTitle}>Semifinal 1</div>
            <div className="mt-2 flex flex-col gap-2">
              {seedButton(
                sf[0].teamA,
                sf[0].winner?.id === sf[0].teamA?.id,
                () => handlePick("SF", 0, "A"),
                getSeedStatus(sf[0], sf[0].teamA)
              )}
              {seedButton(
                sf[0].teamB,
                sf[0].winner?.id === sf[0].teamB?.id,
                () => handlePick("SF", 0, "B"),
                getSeedStatus(sf[0], sf[0].teamB)
              )}
            </div>
          </div>

          <div className="h-20 sm:h-24 md:h-28" />

          <div className={`${bracketCard} ${getCardStateClass(sf[1])}`}>
            <div className={roundTitle}>Semifinal 2</div>
            <div className="mt-2 flex flex-col gap-2">
              {seedButton(
                sf[1].teamA,
                sf[1].winner?.id === sf[1].teamA?.id,
                () => handlePick("SF", 1, "A"),
                getSeedStatus(sf[1], sf[1].teamA)
              )}
              {seedButton(
                sf[1].teamB,
                sf[1].winner?.id === sf[1].teamB?.id,
                () => handlePick("SF", 1, "B"),
                getSeedStatus(sf[1], sf[1].teamB)
              )}
            </div>
          </div>
        </div>

        <div className={line} />

        {/* Final - centered vertically */}
        <div className={`${column} justify-center`}>
          <div className={`${bracketCard} ${getCardStateClass(finalMatch)}`}>
            <div className={roundTitle}>Final</div>
            <div className="mt-2 flex flex-col gap-2">
              {seedButton(
                finalMatch.teamA,
                finalMatch.winner?.id === finalMatch.teamA?.id,
                () => handlePick("F", 0, "A"),
                getSeedStatus(finalMatch, finalMatch.teamA)
              )}
              {seedButton(
                finalMatch.teamB,
                finalMatch.winner?.id === finalMatch.teamB?.id,
                () => handlePick("F", 0, "B"),
                getSeedStatus(finalMatch, finalMatch.teamB)
              )}
            </div>
          </div>

          <div className="text-center text-sm text-white/70">Champion: {champion}</div>
        </div>
      </section>
    </main>
  );
}
