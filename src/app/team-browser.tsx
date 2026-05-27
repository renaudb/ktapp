"use client";

import { useState } from "react";
import { SwipeDeck } from "./swipe-deck";
import type { KillTeamOption } from "./team-cards";

type TeamBrowserProps = {
  teams: KillTeamOption[];
};

export function TeamBrowser({ teams }: TeamBrowserProps) {
  const [selectedTeamIndex, setSelectedTeamIndex] = useState<number | null>(
    null,
  );
  const [selectedSectionIndex, setSelectedSectionIndex] = useState<
    number | null
  >(null);
  const selectedTeam =
    selectedTeamIndex === null ? null : teams[selectedTeamIndex];
  const selectedSection =
    selectedTeam && selectedSectionIndex !== null
      ? selectedTeam.sections[selectedSectionIndex]
      : null;

  if (selectedTeam && selectedSection) {
    return (
      <SwipeDeck
        key={selectedSection.label}
        cards={selectedSection.cards}
        sectionName={selectedSection.label}
        teamName={selectedTeam.name}
        weaponRules={selectedTeam.weaponRules}
        onBack={() => setSelectedSectionIndex(null)}
      />
    );
  }

  if (!selectedTeam) {
    return (
      <section className="mx-auto flex min-h-dvh w-full max-w-5xl flex-col px-3 py-3 sm:px-5 lg:px-6">
        <header className="rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-rose-200">
            Kill Team
          </p>
          <h1 className="mt-2 text-4xl font-black tracking-tight text-white sm:text-5xl">
            Rules Browser
          </h1>
        </header>

        <nav
          className="grid flex-1 content-center gap-2.5 py-4 sm:grid-cols-2"
          aria-label="Kill teams"
        >
          {teams.map((team, index) => (
            <button
              key={team.id}
              type="button"
              onClick={() => {
                setSelectedTeamIndex(index);
                setSelectedSectionIndex(null);
              }}
              className="group rounded-3xl border border-white/10 bg-white/10 p-4 text-left transition hover:-translate-y-0.5 hover:bg-white/15"
            >
              <span className="flex items-center justify-between gap-3">
                <span className="text-2xl font-black text-white">
                  {team.name}
                </span>
                <span className="rounded-full bg-rose-200 px-3 py-1 text-sm font-black text-slate-950 transition group-hover:bg-rose-100">
                  Open
                </span>
              </span>
            </button>
          ))}
        </nav>
      </section>
    );
  }

  return (
    <section className="mx-auto flex min-h-dvh w-full max-w-5xl flex-col px-3 py-3 sm:px-5 lg:px-6">
      <header className="rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur">
        <button
          type="button"
          onClick={() => {
            setSelectedTeamIndex(null);
            setSelectedSectionIndex(null);
          }}
          className="rounded-full bg-white/10 px-3 py-1.5 text-sm font-bold text-white transition hover:bg-white/15"
        >
          Teams
        </button>
        <h1 className="mt-2 text-4xl font-black tracking-tight text-white sm:text-5xl">
          {selectedTeam.name}
        </h1>
      </header>

      <nav
        className="grid flex-1 content-center gap-2.5 py-4 sm:grid-cols-2"
        aria-label="Table of contents"
      >
        {selectedTeam.sections.map((section, index) => (
          <button
            key={section.label}
            type="button"
            onClick={() => setSelectedSectionIndex(index)}
            className="group rounded-3xl border border-white/10 bg-white/10 p-4 text-left transition hover:-translate-y-0.5 hover:bg-white/15"
          >
            <span className="flex items-center justify-between gap-3">
              <span className="text-2xl font-black text-white">
                {section.label}
              </span>
              <span className="rounded-full bg-rose-200 px-3 py-1 text-sm font-black text-slate-950 transition group-hover:bg-rose-100">
                Open
              </span>
            </span>
          </button>
        ))}
      </nav>
    </section>
  );
}
