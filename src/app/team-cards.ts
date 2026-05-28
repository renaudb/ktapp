import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { CardItem, RuleCard } from "./cards";

type TeamWeapon = {
  NAME: string;
  ATK: string;
  HIT: string;
  DMG: string;
  WR: string;
};

type NamedRule = {
  name: string;
  text?: string;
  description?: string;
  rule?: string;
  effect?: string;
};

type Operative = {
  name: string;
  stats: {
    APL: string;
    MOVE: string;
    SAVE: string;
    WOUNDS: string;
  };
  weapons: TeamWeapon[];
  specialRules: NamedRule[];
  specialActions: Array<NamedRule & { AP: string }>;
  keywords: string[];
};

type OperativeSelection = {
  archetypes: string[];
  rule: string;
};

type TeamRules = {
  name: string;
  datacards: Operative[];
  operativeSelection: OperativeSelection;
  factionRules: NamedRule[];
  strategyPloys: NamedRule[];
  firefightPloys: NamedRule[];
  factionEquipment: NamedRule[];
};

type WeaponRuleData = {
  weaponRules: Record<string, string>;
};

export type TableOfContentsItem = {
  label: string;
  count: number;
};

export type CardSectionGroup = TableOfContentsItem & {
  cards: RuleCard[];
};

export type KillTeamOption = {
  id: string;
  name: string;
  sections: CardSectionGroup[];
  weaponRules: Record<string, string>;
};

const teamRuleSources = [
  {
    id: "celestian-insidiants",
    fileName: "celestian-insidiants.json",
  },
  {
    id: "nemesis-claw",
    fileName: "nemesis-claw.json",
  },
];

function readTeamRules(fileName: string): TeamRules | null {
  const filePath = join(process.cwd(), "rules", "teams", fileName);

  if (!existsSync(filePath)) {
    return null;
  }

  return JSON.parse(readFileSync(filePath, "utf8")) as TeamRules;
}

function readWeaponRules(): WeaponRuleData {
  const filePath = join(process.cwd(), "rules", "weapon-rules.json");

  if (!existsSync(filePath)) {
    return { weaponRules: {} };
  }

  return JSON.parse(readFileSync(filePath, "utf8")) as WeaponRuleData;
}

const weaponRuleSource = readWeaponRules();

function weaponToItem(weapon: TeamWeapon): CardItem {
  return {
    name: weapon.NAME,
    stats: {
      ATK: weapon.ATK,
      HIT: weapon.HIT,
      DMG: weapon.DMG,
      WR: weapon.WR,
    },
  };
}

function datacardToCard(operative: Operative): RuleCard {
  return {
    title: operative.name,
    category: "Datacards",
    stats: {
      APL: operative.stats.APL,
      Move: operative.stats.MOVE,
      Save: operative.stats.SAVE,
      Wounds: operative.stats.WOUNDS,
    },
    sections: [
      {
        heading: "Weapons",
        items: operative.weapons.map(weaponToItem),
      },
      ...operative.specialRules.map((rule) => ({
        heading: rule.name,
        body: rule.rule ?? rule.text ?? "",
      })),
      ...(operative.specialActions.length > 0
        ? [
            {
              heading: "Special Actions",
              actions: operative.specialActions.map((action) => ({
                name: action.name,
                ap: action.AP,
                rule: action.rule ?? action.text ?? "",
              })),
            },
          ]
        : []),
      {
        heading: "Keywords",
        items: operative.keywords,
      },
    ],
  };
}

function operativeSelectionToCard(selection: OperativeSelection): RuleCard {
  return {
    title: "Operative Selection",
    category: "Operative Selection",
    sections: [
      {
        heading: "Archetypes",
        items: selection.archetypes,
      },
      {
        heading: "Selection Rule",
        body: selection.rule,
      },
    ],
  };
}

function ruleToCard(rule: NamedRule, category: string): RuleCard {
  return {
    title: rule.name,
    category,
    sections: [
      {
        heading: "Rule",
        body: rule.rule ?? rule.text ?? rule.effect ?? "",
      },
    ],
  };
}

function buildTeamSections(team: TeamRules): CardSectionGroup[] {
  return [
    {
      label: "Datacards",
      count: team.datacards.length,
      cards: team.datacards.map(datacardToCard),
    },
    {
      label: "Operative Selection",
      count: 1,
      cards: [operativeSelectionToCard(team.operativeSelection)],
    },
    {
      label: "Faction Rules",
      count: team.factionRules.length,
      cards: team.factionRules.map((rule) => ruleToCard(rule, "Faction Rules")),
    },
    {
      label: "Strategy Ploys",
      count: team.strategyPloys.length,
      cards: team.strategyPloys.map((rule) =>
        ruleToCard(rule, "Strategy Ploys"),
      ),
    },
    {
      label: "Firefight Ploys",
      count: team.firefightPloys.length,
      cards: team.firefightPloys.map((rule) =>
        ruleToCard(rule, "Firefight Ploys"),
      ),
    },
    {
      label: "Faction Equipment",
      count: team.factionEquipment.length,
      cards: team.factionEquipment.map((rule) =>
        ruleToCard(rule, "Faction Equipment"),
      ),
    },
  ];
}

export const killTeams: KillTeamOption[] = teamRuleSources.flatMap((source) => {
  const team = readTeamRules(source.fileName);

  if (!team) {
    return [];
  }

  return [
    {
      id: source.id,
      name: team.name,
      sections: buildTeamSections(team),
      weaponRules: weaponRuleSource.weaponRules,
    },
  ];
});

const sectionSources = killTeams[0]?.sections ?? [];

export const cards = sectionSources.flatMap((section) => section.cards);

export const cardSections = sectionSources;

export const tableOfContents: TableOfContentsItem[] = sectionSources.map(
  ({ label, count }) => ({ label, count }),
);

export const teamName = killTeams[0]?.name ?? "Kill Team";
export const weaponRules = weaponRuleSource.weaponRules;
