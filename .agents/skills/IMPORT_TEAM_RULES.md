---
name: import-team-rules
description: Import a team rules.
---

Use this skill to import rules for a team from a rules PDF as a JSON file. To do so: 

- Process the PDF and extract the structure below into a JSON file. 
- Do not include any other section not listed in the structure. 
- Store team rules under `rules/teams/TEAM_NAME.json` where TEAM_NAME is the lowercase team name with spaces replaced with hyphens.

# Structure

Team rules are structured as follow:

## Datacards

Each team has a list of operatives. Each operative has:

1. Name at the top left of the card
2. Stats (APL, MOVE, SAVE, WOUNDS) at the top right of the card
3. 0+ weapons each with a NAME and stats (ATK, HIT, DMG, WR)
4. 0+ special rules each with:
    a. Name
    b. Rule
5. 0+ special actions (actions have an xAP stat with x >= 0) each with:
    a. Name
    b. AP
    c. Rule
6. 0+ keyword at the bottom of the card

Special rules and special actions rules should be stored in markdown to preserve as much of the formatting as possible (e.g. paragraphs, lists, tables, bold, italic).

## Operative Selection

Each team has an operative selection with:

1. List of comma-separated archetypes (e.g. SEEK & DESTROY)
2. Operative selection rule.

Operative selection rules should be stored in markdown to preserve as much of the formatting as possible (e.g. paragraphs, lists, tables, bold, italic).

## Faction Rules

Each team has a list of faction rules. Each faction rule has:

1. Name at the top of the card
2. (Optional) Small description below the name in small characters
3. Detailed rule

Detailed rules should be stored in markdown to preserve as much of the formatting as possible (e.g. paragraphs, lists, tables, bold, italic).

## Strategy Ploy

Each team has a list of strategy ploys. Each strategy ploy has:

1. Name at the top of the card
2. Small description below the name in small characters
3. Detailed rule

Detailed rules should be stored in markdown to preserve as much of the formatting as possible (e.g. paragraphs, lists, tables, bold, italic).

## Firefight Ploy

Each team has a list of firefight ploys. Each firefight ploy has:

1. Name at the top of the card
2. Small description below the name in small characters
3. Detailed rule

Detailed rules should be stored in markdown to preserve as much of the formatting as possible (e.g. paragraphs, lists, tables, bold, italic).

## Faction Equipment

Each team has a list of faction equipment. Each faction equipment has:

1. Name at the top of the card
2. Small description below the name in small characters
3. Detailed rule

Detailed rules should be stored in markdown to preserve as much of the formatting as possible (e.g. paragraphs, lists, tables, bold, italic).

# Tips

Whenever a card ends with RULES CONTINUE ON OTHER SIDE or RULE CONTINUE ON OTHER SIDE, make sure to read the next card as the content for one item might be split across multiple cards.