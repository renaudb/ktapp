"use client";

import { useMemo, useState } from "react";
import type { UIEvent } from "react";
import type { RuleCard } from "./cards";
import { RuleCardView } from "./rule-card";
import type { WeaponRuleMatch } from "./rule-card";

type SwipeDeckProps = {
  cards: RuleCard[];
  sectionName: string;
  teamName: string;
  weaponRules: Record<string, string>;
  onBack: () => void;
};

export function SwipeDeck({
  cards,
  sectionName,
  teamName,
  weaponRules,
  onBack,
}: SwipeDeckProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [selectedWeaponRule, setSelectedWeaponRule] =
    useState<WeaponRuleMatch | null>(null);

  const progress = useMemo(
    () => `${activeIndex + 1} / ${cards.length}`,
    [activeIndex, cards.length],
  );

  function handleDeckScroll(event: UIEvent<HTMLDivElement>) {
    const { clientWidth, scrollLeft } = event.currentTarget;

    if (clientWidth === 0) {
      return;
    }

    setActiveIndex(Math.round(scrollLeft / clientWidth));
  }

  return (
    <section className="min-h-dvh w-full">
      <header className="fixed inset-x-0 top-0 z-40 border-b border-white/10 bg-slate-950/75 px-3 py-2 shadow-lg shadow-black/20 backdrop-blur sm:px-5 lg:px-6">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
          <button
            type="button"
            onClick={onBack}
            className="rounded-full bg-white/10 px-3 py-1.5 text-sm font-bold text-white transition hover:bg-white/15"
          >
            Contents
          </button>
          <div className="min-w-0 flex-1 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-rose-200">
              {teamName}
            </p>
            <h1 className="truncate text-base font-semibold tracking-tight text-white">
              {sectionName}
            </h1>
          </div>
          <p className="rounded-full bg-white px-2.5 py-1 text-sm font-bold text-slate-950">
            {progress}
          </p>
        </div>
      </header>

      <div className="h-dvh overflow-hidden">
        <div
          className="flex h-full snap-x snap-mandatory overflow-x-auto overscroll-x-contain scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          onScroll={handleDeckScroll}
          role="group"
          aria-roledescription="swipeable card"
          aria-label={`${sectionName}, card ${activeIndex + 1} of ${cards.length}`}
        >
          {cards.map((card) => (
            <RuleCardView
              key={card.title}
              card={card}
              weaponRules={weaponRules}
              onSelectWeaponRule={setSelectedWeaponRule}
            />
          ))}
        </div>

        <div className="fixed inset-x-0 bottom-0 z-30 h-1 overflow-hidden bg-white/10">
          <div
            className="h-full bg-rose-200 transition-all"
            style={{ width: `${((activeIndex + 1) / cards.length) * 100}%` }}
          />
        </div>
      </div>
      {selectedWeaponRule ? (
        <div
          className="fixed inset-0 z-50 flex items-end bg-slate-950/70 p-4 backdrop-blur-sm sm:items-center sm:justify-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="weapon-rule-title"
          onClick={() => setSelectedWeaponRule(null)}
        >
          <div
            className="w-full max-w-lg rounded-[2rem] bg-white p-5 text-slate-950 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-rose-700">
              Weapon Rule
            </p>
            <h2 id="weapon-rule-title" className="mt-2 text-2xl font-black">
              {selectedWeaponRule.label}
            </h2>
            {selectedWeaponRule.label !== selectedWeaponRule.ruleName ? (
              <p className="mt-1 text-sm font-semibold text-slate-500">
                Uses {selectedWeaponRule.ruleName}
              </p>
            ) : null}
            <p className="mt-4 leading-7 text-slate-700">
              {selectedWeaponRule.rule}
            </p>
            <button
              type="button"
              onClick={() => setSelectedWeaponRule(null)}
              className="mt-5 min-h-12 w-full rounded-full bg-slate-950 px-5 font-bold text-white transition hover:bg-slate-800"
            >
              Close
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
