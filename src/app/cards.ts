export type ItemStats = {
  ATK: string;
  HIT: string;
  DMG: string;
  WR: string;
};

export type CardItem =
  | string
  | {
      name: string;
      stats: ItemStats;
    };

export type CardAction = {
  name: string;
  ap: string;
  rule: string;
};

export type CardSection = {
  heading: string;
  body?: string;
  items?: CardItem[];
  actions?: CardAction[];
};

export type RuleCard = {
  title: string;
  category: string;
  stats?: Record<string, string>;
  sections: CardSection[];
};
