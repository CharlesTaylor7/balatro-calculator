## Goal
- Make it easy to preview scores 
- Win more gold stake runs.
- Mobile friendly

## Use cases
- Experiment with exotic builds even when not playing
- Play Balatro with it open

## Tech Stack
- React
- Typescript
- Zustand
- Lodash

## Features planned
Shooting for the moon here. Right now the functionality is limited to a handful of simple jokers.

- Support all deterministic scoring jokers
- Support probability distributions: Misprint, Bloodstone, etc.

## Non-Goals
- Not intended to be a full balatro sim. Buy the game!
- Handling all joker interactions outside of a round score. Buy the game!
- Images for Jokers. This sim is intentionally ugly. Buy the game!


## Development
Pretty straightforward. Using yarn v4. 

Get started by running `yarn & yarn dev`.

Other scripts listed in [package.json](./package.json#L6-L11)

## How to use

Hands are parsed from a shorthand syntax.
- `TC` = Ten of Clubs
- `TC C5 M10 X2` = Ten of clubs with +5 chips +10 mult x2 mult. (i.e. Holographic Glass Ten of Clubs upgraded once with "Hiker")

cards are separated by ","

The regex syntax for parsing cards is:

```
  /(?<rank>[2-9AKQJT])(?<suit>[WCDHS])?\s*(C(?<chips>\d+))?\s*(M(?<mult>\d+))?\s*(X(?<xmult>[\d.]+))?/;
```
"W" means wild suit.
If suit is not provided, the suit is flagged as "unknown" and the hand can't be a flush.
Most parts of the Card syntax are optional, only required part is the rank.
