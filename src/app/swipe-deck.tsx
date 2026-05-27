"use client";

import { Crosshair, Sword } from "lucide-react";
import { Fragment, useMemo, useState } from "react";
import type { ReactNode, UIEvent } from "react";
import type { RuleCard } from "./cards";

type SwipeDeckProps = {
  cards: RuleCard[];
  sectionName: string;
  teamName: string;
  weaponRules: Record<string, string>;
  onBack: () => void;
};

const variableRuleMatches = [
  { pattern: /^Accurate\b/i, ruleName: "Accurate x" },
  { pattern: /^Blast\b/i, ruleName: "Blast x" },
  { pattern: /^Devastating\b/i, ruleName: "Devastating x" },
  { pattern: /^\d+" Devastating\b/i, ruleName: "Devastating x" },
  { pattern: /^Lethal\b/i, ruleName: "Lethal x+" },
  { pattern: /^Limited\b/i, ruleName: "Limited x" },
  { pattern: /^Piercing\b/i, ruleName: "Piercing x" },
  { pattern: /^Range\b/i, ruleName: "Range x" },
  { pattern: /^Seek Light\b/i, ruleName: "Seek" },
  { pattern: /^Torrent\b/i, ruleName: "Torrent x" },
];

type WeaponRuleMatch = {
  label: string;
  ruleName: string;
  rule: string;
};

type MarkdownListItem = {
  content: string;
  children: MarkdownListItem[];
};

function getWeaponRuleMatch(
  label: string,
  weaponRules: Record<string, string>,
): WeaponRuleMatch | null {
  const normalizedLabel = label.trim().replace(/\.$/, "");
  const exactRule = weaponRules[normalizedLabel];

  if (exactRule) {
    return {
      label: normalizedLabel,
      ruleName: normalizedLabel,
      rule: exactRule,
    };
  }

  const variableMatch = variableRuleMatches.find(({ pattern, ruleName }) => {
    return pattern.test(normalizedLabel) && weaponRules[ruleName];
  });

  if (!variableMatch) {
    return null;
  }

  return {
    label: normalizedLabel,
    ruleName: variableMatch.ruleName,
    rule: weaponRules[variableMatch.ruleName],
  };
}

function hasRangeRule(wr: string) {
  return wr
    .split(",")
    .some((part) => /^Range\b/i.test(part.trim()));
}

function renderWeaponRuleReferences(
  text: string,
  keyPrefix: string,
  weaponRules: Record<string, string>,
  onSelectWeaponRule: (match: WeaponRuleMatch) => void,
): ReactNode[] {
  const weaponRuleReferencePattern =
    /\b((?:\d+" )?Devastating \d+|Accurate \d+|Blast \d+"?|Lethal \d\+|Limited \d+|Piercing(?: Crits)? \d+|Range \d+"?|Torrent \d+"?|Balanced|Brutal|Ceaseless|Heavy|Hot|Punishing|Relentless|Rending|Saturate|Seek(?: Light)?|Severe|Shock|Silent|Stun) weapon rule\b/gi;
  const nodes: ReactNode[] = [];
  let lastIndex = 0;

  for (const match of text.matchAll(weaponRuleReferencePattern)) {
    const fullMatch = match[0];
    const label = match[1];
    const index = match.index ?? 0;
    const weaponRuleMatch = getWeaponRuleMatch(label, weaponRules);

    if (!weaponRuleMatch) {
      continue;
    }

    if (index > lastIndex) {
      nodes.push(text.slice(lastIndex, index));
    }

    nodes.push(
      <span key={`${keyPrefix}-rule-${index}`}>
        <button
          type="button"
          onClick={() => onSelectWeaponRule(weaponRuleMatch)}
          className="font-semibold underline decoration-dashed underline-offset-4"
        >
          {label}
        </button>{" "}
        weapon rule
      </span>,
    );

    lastIndex = index + fullMatch.length;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes.length > 0 ? nodes : [text];
}

function renderInlineMarkdown(
  text: string,
  keyPrefix: string,
  weaponRules: Record<string, string>,
  onSelectWeaponRule: (match: WeaponRuleMatch) => void,
): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*)/g).flatMap((part, index) => {
    const key = `${keyPrefix}-${index}`;

    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={key} className="font-black text-slate-950">
          {part.slice(2, -2)}
        </strong>
      );
    }

    return renderWeaponRuleReferences(
      part,
      key,
      weaponRules,
      onSelectWeaponRule,
    );
  });
}

function MarkdownText({
  text,
  weaponRules,
  onSelectWeaponRule,
  className = "",
}: {
  text: string;
  weaponRules: Record<string, string>;
  onSelectWeaponRule: (match: WeaponRuleMatch) => void;
  className?: string;
}) {
  const blocks = text
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);

  return (
    <div className={`mt-2 space-y-2 leading-6 text-slate-700 ${className}`}>
      {blocks.map((block, blockIndex) => {
        const rawLines = block.split("\n").filter((line) => line.trim());
        const lines = rawLines.map((line) => line.trim());
        const isTable =
          lines.length >= 2 &&
          lines.every((line) => line.startsWith("|") && line.endsWith("|"));
        const isList = rawLines.every((line) => /^\s*-\s+/.test(line));

        function parseListItems(): MarkdownListItem[] {
          const rootItems: MarkdownListItem[] = [];
          const stack: MarkdownListItem[] = [];

          rawLines.forEach((line) => {
            const match = line.match(/^(\s*)-\s+(.*)$/);

            if (!match) {
              return;
            }

            const level = Math.floor(match[1].length / 2);
            const item: MarkdownListItem = {
              content: match[2],
              children: [],
            };

            if (level === 0 || stack.length === 0) {
              rootItems.push(item);
              stack[0] = item;
              stack.length = 1;
              return;
            }

            const parent = stack[level - 1] ?? stack[stack.length - 1];
            parent.children.push(item);
            stack[level] = item;
            stack.length = level + 1;
          });

          return rootItems;
        }

        function renderListItems(
          items: MarkdownListItem[],
          keyPrefix: string,
          isNested = false,
        ): ReactNode {
          return (
            <ul
              className={
                isNested
                  ? "ml-4 mt-1.5 space-y-1.5 border-l border-slate-200 pl-3"
                  : "space-y-1.5"
              }
            >
              {items.map((item, itemIndex) => (
                <li key={`${keyPrefix}-${itemIndex}`} className="leading-6">
                  <div className="flex gap-2">
                    <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-rose-600" />
                    <span>
                      {renderInlineMarkdown(
                        item.content,
                        `${keyPrefix}-${itemIndex}`,
                        weaponRules,
                        onSelectWeaponRule,
                      )}
                    </span>
                  </div>
                  {item.children.length > 0
                    ? renderListItems(
                        item.children,
                        `${keyPrefix}-${itemIndex}-children`,
                        true,
                      )
                    : null}
                </li>
              ))}
            </ul>
          );
        }

        if (isTable) {
          const [headerLine, , ...bodyLines] = lines;
          const headers = headerLine
            .split("|")
            .slice(1, -1)
            .map((cell) => cell.trim());
          const rows = bodyLines.map((line) =>
            line
              .split("|")
              .slice(1, -1)
              .map((cell) => cell.trim()),
          );

          return (
            <div key={block} className="overflow-hidden rounded-xl border border-slate-200">
              <table className="w-full border-collapse text-left text-sm">
                <thead className="bg-slate-950 text-white">
                  <tr>
                    {headers.map((header) => (
                      <th key={header} className="px-2 py-1.5 font-black">
                        {renderInlineMarkdown(
                          header,
                          `${blockIndex}-${header}`,
                          weaponRules,
                          onSelectWeaponRule,
                        )}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {rows.map((row, rowIndex) => (
                    <tr key={`${blockIndex}-${rowIndex}`}>
                      {row.map((cell, cellIndex) => (
                        <td
                          key={`${blockIndex}-${rowIndex}-${cellIndex}`}
                          className="px-2 py-2 align-top leading-5"
                        >
                          {renderInlineMarkdown(
                            cell,
                            `${blockIndex}-${rowIndex}-${cellIndex}`,
                            weaponRules,
                            onSelectWeaponRule,
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }

        if (isList) {
          return (
            <div key={block}>
              {renderListItems(parseListItems(), `${blockIndex}`)}
            </div>
          );
        }

        return (
          <p key={block}>
            {renderInlineMarkdown(
              block.replace(/\n/g, " "),
              `${blockIndex}`,
              weaponRules,
              onSelectWeaponRule,
            )}
          </p>
        );
      })}
    </div>
  );
}

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

  function renderWeaponRules(wr: string) {
    if (wr === "-") {
      return wr;
    }

    return wr.split(",").map((part, index, parts) => {
      const label = part.trim();
      const match = getWeaponRuleMatch(label, weaponRules);
      const suffix = index < parts.length - 1 ? ", " : "";

      if (!match) {
        return (
          <span key={`${label}-${index}`}>
            {label}
            {suffix}
          </span>
        );
      }

      return (
        <span key={`${label}-${index}`}>
          <button
            type="button"
            onClick={() => setSelectedWeaponRule(match)}
            onPointerDown={(event) => event.stopPropagation()}
            className="font-normal underline decoration-dashed underline-offset-4"
          >
            {label}
          </button>
          {suffix}
        </span>
      );
    });
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
            <article
              key={card.title}
              className="h-full w-full shrink-0 snap-start overflow-y-auto bg-slate-100 text-slate-950"
            >
              <div
                className={`border-b border-slate-200 bg-white px-3 pt-20 sm:px-4 ${
                  card.stats ? "pb-3" : "pb-2"
                }`}
              >
                <div
                  className={`flex items-start justify-between gap-3 ${
                    card.stats ? "mb-3" : ""
                  }`}
                >
                  <div>
                    <p className="text-sm font-bold uppercase tracking-[0.2em] text-rose-700">
                      {card.category}
                    </p>
                    <h2 className="mt-1 text-3xl font-black tracking-tight text-slate-950">
                      {card.title}
                    </h2>
                  </div>
                </div>

                {card.stats ? (
                  <dl className="grid grid-cols-4 gap-1.5">
                    {Object.entries(card.stats).map(([label, value]) => (
                      <div
                        key={label}
                        className="rounded-xl bg-slate-950 px-2 py-1.5 text-center text-white"
                      >
                        <dt className="text-[0.65rem] font-bold uppercase tracking-widest text-slate-400">
                          {label}
                        </dt>
                        <dd className="text-lg font-black">{value}</dd>
                      </div>
                    ))}
                  </dl>
                ) : null}
              </div>

              <div className="space-y-3 p-3 pb-6 sm:p-4 sm:pb-6">
                {card.sections.map((section, sectionIndex) => {
                  const isInlineDatacardRule =
                    card.category === "Datacards" &&
                    section.body &&
                    section.heading !== "Weapons" &&
                    section.heading !== "Keywords";
                  const hasSpecialActions = Boolean(section.actions);
                  const hasWeaponsTable =
                    section.heading === "Weapons" &&
                    section.items?.every((item) => typeof item !== "string");
                  const hasDatacardKeywords =
                    card.category === "Datacards" &&
                    section.heading === "Keywords";
                  const hasRuleHeader = section.heading === "Rule";
                  const nextSection = card.sections[sectionIndex + 1];
                  const nextSectionIsInlineDatacardRule =
                    card.category === "Datacards" &&
                    nextSection?.body &&
                    nextSection.heading !== "Weapons" &&
                    nextSection.heading !== "Keywords";
                  const nextSectionIsDatacardKeywords =
                    card.category === "Datacards" &&
                    nextSection?.heading === "Keywords";
                  const shouldHideSeparator =
                    isInlineDatacardRule ||
                    (hasWeaponsTable && nextSectionIsInlineDatacardRule) ||
                    (hasSpecialActions && nextSectionIsDatacardKeywords);

                  return (
                    <section
                      key={section.heading}
                      className={
                        shouldHideSeparator
                          ? ""
                          : "border-b border-slate-200 pb-3 last:border-b-0 last:pb-0"
                      }
                    >
                      {isInlineDatacardRule ||
                      hasSpecialActions ||
                      hasWeaponsTable ||
                      hasDatacardKeywords ||
                      hasRuleHeader ? null : (
                        <h3 className="text-lg font-black text-slate-950">
                          {section.heading}
                        </h3>
                      )}
                    {section.body ? (
                      <MarkdownText
                        text={
                          isInlineDatacardRule
                            ? `**${section.heading}:** ${section.body}`
                            : section.body
                        }
                        weaponRules={weaponRules}
                        onSelectWeaponRule={setSelectedWeaponRule}
                        className={isInlineDatacardRule ? "text-sm" : ""}
                      />
                    ) : null}
                    {section.actions ? (
                      <div className="mt-2 space-y-2">
                        {section.actions.map((action) => (
                          <div
                            key={action.name}
                            className="overflow-hidden rounded-xl border border-slate-200"
                          >
                            <table className="w-full border-collapse text-left text-sm">
                              <thead className="bg-slate-950 text-white">
                                <tr>
                                  <th className="px-2 py-1.5 font-black">
                                    {action.name}
                                  </th>
                                  <th className="w-16 px-2 py-1.5 text-right font-black">
                                    {action.ap}
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="bg-white">
                                <tr>
                                  <td
                                    colSpan={2}
                                    className="px-2 pb-2 pt-0 align-top"
                                  >
                                    <MarkdownText
                                      text={action.rule}
                                      weaponRules={weaponRules}
                                      onSelectWeaponRule={setSelectedWeaponRule}
                                    />
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        ))}
                      </div>
                    ) : null}
                    {section.items &&
                    section.heading === "Weapons" &&
                    section.items.every((item) => typeof item !== "string") ? (
                      <div className="mt-2 overflow-hidden rounded-xl border border-slate-200">
                        <table className="w-full border-collapse text-left text-sm">
                          <thead className="bg-slate-950 text-white">
                            <tr>
                              {["ATK", "HIT", "DMG", "WR"].map((header) => (
                                <th
                                  key={header}
                                  className="px-2 py-1.5 font-black"
                                >
                                  {header}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="bg-white">
                            {section.items.map((item) =>
                              typeof item === "string" ? null : (
                                <Fragment key={item.name}>
                                  <tr className="border-t border-slate-200 bg-slate-50 first:border-t-0">
                                    <td
                                      colSpan={4}
                                      className="px-2 pb-1 pt-2 align-top font-medium text-slate-950"
                                    >
                                      <span className="flex items-start gap-1.5">
                                        {hasRangeRule(item.stats.WR) ? (
                                          <Crosshair
                                            aria-label="Ranged weapon"
                                            className="mt-0.5 size-4 shrink-0"
                                            strokeWidth={2}
                                          />
                                        ) : (
                                          <Sword
                                            aria-label="Melee weapon"
                                            className="mt-0.5 size-4 shrink-0"
                                            strokeWidth={2}
                                          />
                                        )}
                                        <span>{item.name}</span>
                                      </span>
                                    </td>
                                  </tr>
                                  <tr>
                                    <td className="px-2 pb-2 pt-1 align-top font-semibold text-slate-950">
                                      {item.stats.ATK}
                                    </td>
                                    <td className="px-2 pb-2 pt-1 align-top font-semibold text-slate-950">
                                      {item.stats.HIT}
                                    </td>
                                    <td className="px-2 pb-2 pt-1 align-top font-semibold text-slate-950">
                                      {item.stats.DMG}
                                    </td>
                                    <td className="px-2 pb-2 pt-1 align-top font-normal leading-5 text-slate-700">
                                      {renderWeaponRules(item.stats.WR)}
                                    </td>
                                  </tr>
                                </Fragment>
                              ),
                            )}
                          </tbody>
                        </table>
                      </div>
                    ) : section.items &&
                      card.category === "Datacards" &&
                      section.heading === "Keywords" &&
                      section.items.every((item) => typeof item === "string") ? (
                      <p className="mt-2 text-sm font-medium leading-6 text-slate-700">
                        <strong className="font-black text-slate-950">
                          KEYWORDS:
                        </strong>{" "}
                        {section.items.join(", ")}
                      </p>
                    ) : section.items ? (
                      <ul className="mt-2 space-y-2 text-slate-700">
                        {section.items.map((item) =>
                          typeof item === "string" ? (
                            <li key={item} className="flex gap-2 leading-7">
                              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-rose-600" />
                              <span>{item}</span>
                            </li>
                          ) : (
                            <li
                              key={item.name}
                              className="rounded-2xl border border-slate-200 bg-slate-50 p-3"
                            >
                              <p className="font-bold text-slate-950">
                                {item.name}
                              </p>
                              <dl className="mt-3 grid grid-cols-3 gap-2">
                                {(["ATK", "HIT", "DMG"] as const).map(
                                  (stat) => (
                                    <div
                                      key={stat}
                                      className="rounded-xl bg-white px-2 py-2 text-center shadow-sm"
                                    >
                                      <dt className="text-[0.65rem] font-black tracking-widest text-slate-400">
                                        {stat}
                                      </dt>
                                      <dd className="text-base font-black text-slate-950">
                                        {item.stats[stat]}
                                      </dd>
                                    </div>
                                  ),
                                )}
                              </dl>
                              <div className="mt-2 rounded-xl bg-white px-3 py-2 shadow-sm">
                                <p className="text-[0.65rem] font-black tracking-widest text-slate-400">
                                  WR
                                </p>
                                <p className="mt-1 text-sm font-semibold leading-6 text-slate-700">
                                  {renderWeaponRules(item.stats.WR)}
                                </p>
                              </div>
                            </li>
                          ),
                        )}
                      </ul>
                    ) : null}
                    </section>
                  );
                })}
              </div>
            </article>
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
