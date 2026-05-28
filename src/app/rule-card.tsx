"use client";

import { Crosshair, Sword } from "lucide-react";
import { Fragment } from "react";
import type { ReactNode } from "react";
import type { DatacardCard, RuleCard } from "./cards";

export type WeaponRuleMatch = {
  label: string;
  ruleName: string;
  rule: string;
};

type RuleCardViewProps = {
  card: RuleCard;
  weaponRules: Record<string, string>;
  onSelectWeaponRule: (match: WeaponRuleMatch) => void;
};

type DatacardCardViewProps = Omit<RuleCardViewProps, "card"> & {
  card: DatacardCard;
};

type MarkdownListItem = {
  content: string;
  children: MarkdownListItem[];
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
            <div
              key={block}
              className="overflow-hidden rounded-xl border border-slate-200"
            >
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

export function RuleCardView({
  card,
  weaponRules,
  onSelectWeaponRule,
}: RuleCardViewProps) {
  if (card.type === "datacard") {
    return (
      <DatacardCardView
        card={card}
        weaponRules={weaponRules}
        onSelectWeaponRule={onSelectWeaponRule}
      />
    );
  }

  if (card.type === "operative-selection") {
    return (
      <article className="h-full w-full shrink-0 snap-start overflow-y-auto bg-slate-100 text-slate-950">
        <div className="border-b border-slate-200 bg-white px-3 pb-2 pt-20 sm:px-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-rose-700">
                {card.category}
              </p>
              <h2 className="mt-1 text-3xl font-black tracking-tight text-slate-950">
                {card.title}
              </h2>
            </div>
          </div>
        </div>

        <div className="space-y-3 p-3 pb-6 sm:p-4 sm:pb-6">
          <section className="border-b border-slate-200 pb-3">
            <h3 className="text-lg font-black text-slate-950">Archetypes</h3>
            <p className="mt-2 text-sm font-medium leading-6 text-slate-700">
              {card.archetypes.join(", ")}
            </p>
          </section>
          <section>
            <MarkdownText
              text={card.rule}
              weaponRules={weaponRules}
              onSelectWeaponRule={onSelectWeaponRule}
            />
          </section>
        </div>
      </article>
    );
  }

  return (
    <article className="h-full w-full shrink-0 snap-start overflow-y-auto bg-slate-100 text-slate-950">
      <div className="border-b border-slate-200 bg-white px-3 pb-2 pt-20 sm:px-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-rose-700">
              {card.category}
            </p>
            <h2 className="mt-1 text-3xl font-black tracking-tight text-slate-950">
              {card.title}
            </h2>
          </div>
        </div>
      </div>

      <div className="space-y-3 p-3 pb-6 sm:p-4 sm:pb-6">
        <section>
          <MarkdownText
            text={card.rule}
            weaponRules={weaponRules}
            onSelectWeaponRule={onSelectWeaponRule}
          />
        </section>
      </div>
    </article>
  );
}

function DatacardCardView({
  card,
  weaponRules,
  onSelectWeaponRule,
}: DatacardCardViewProps) {
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
            onClick={() => onSelectWeaponRule(match)}
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
    <article className="h-full w-full shrink-0 snap-start overflow-y-auto bg-slate-100 text-slate-950">
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
        {card.weapons.length > 0 ? (
          <section
            className={
              card.specialRules.length > 0
                ? ""
                : "border-b border-slate-200 pb-3 last:border-b-0 last:pb-0"
            }
          >
                <div className="mt-2 overflow-hidden rounded-xl border border-slate-200">
                  <table className="w-full border-collapse text-left text-sm">
                    <thead className="bg-slate-950 text-white">
                      <tr>
                        {["ATK", "HIT", "DMG", "WR"].map((header) => (
                          <th key={header} className="px-2 py-1.5 font-black">
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-white">
                      {card.weapons.map((item) => (
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
                      ))}
                    </tbody>
                  </table>
                </div>
          </section>
        ) : null}

        {card.specialRules.map((rule) => (
          <section key={rule.name}>
            <MarkdownText
              text={`**${rule.name}:** ${rule.rule}`}
              weaponRules={weaponRules}
              onSelectWeaponRule={onSelectWeaponRule}
              className="text-sm"
            />
          </section>
        ))}

        {card.specialActions.length > 0 ? (
          <section
            className={
              card.keywords.length > 0
                ? ""
                : "border-b border-slate-200 pb-3 last:border-b-0 last:pb-0"
            }
          >
            <div className="mt-2 space-y-2">
              {card.specialActions.map((action) => (
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
                        <td colSpan={2} className="px-2 pb-2 pt-0 align-top">
                          <MarkdownText
                            text={action.rule}
                            weaponRules={weaponRules}
                            onSelectWeaponRule={onSelectWeaponRule}
                          />
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {card.keywords.length > 0 ? (
          <section>
            <p className="mt-2 text-sm font-medium leading-6 text-slate-700">
              <strong className="font-black text-slate-950">KEYWORDS:</strong>{" "}
              {card.keywords.join(", ")}
            </p>
          </section>
        ) : null}
      </div>
    </article>
  );
}
