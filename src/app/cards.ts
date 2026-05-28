export type ItemStats = {
  ATK: string;
  HIT: string;
  DMG: string;
  WR: string;
};

export type CardWeapon = {
  name: string;
  stats: ItemStats;
};

export type CardAction = {
  name: string;
  ap: string;
  rule: string;
};

export type CardSpecialRule = {
  name: string;
  rule: string;
};

export type DatacardStats = {
  APL: string;
  Move: string;
  Save: string;
  Wounds: string;
};

type BaseCard = {
  title: string;
  category: string;
};

export type DatacardCard = BaseCard & {
  type: "datacard";
  category: "Datacards";
  stats: DatacardStats;
  weapons: CardWeapon[];
  specialRules: CardSpecialRule[];
  specialActions: CardAction[];
  keywords: string[];
};

export type OperativeSelectionCard = BaseCard & {
  type: "operative-selection";
  category: "Operative Selection";
  archetypes: string[];
  rule: string;
};

export type FactionRuleCard = BaseCard & {
  type: "faction-rule";
  category: "Faction Rules";
  rule: string;
};

export type StrategyPloyCard = BaseCard & {
  type: "strategy-ploy";
  category: "Strategy Ploys";
  rule: string;
};

export type FirefightPloyCard = BaseCard & {
  type: "firefight-ploy";
  category: "Firefight Ploys";
  rule: string;
};

export type FactionEquipmentCard = BaseCard & {
  type: "faction-equipment";
  category: "Faction Equipment";
  rule: string;
};

export type RuleCard =
  | DatacardCard
  | OperativeSelectionCard
  | FactionRuleCard
  | StrategyPloyCard
  | FirefightPloyCard
  | FactionEquipmentCard;
