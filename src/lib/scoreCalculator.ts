// src/lib/scoreCalculator.ts

export interface ScoreResult {
  points: number;
  isCorrectWinner: boolean; // Oikea 1X2 merkki
  isPerfectScore: boolean; // Täysin oikein
  isCloseCall: boolean; // Maalin päässä
  isQuiteCloseCall: boolean; // Maalin päässä, mutta merkki väärin
}

export function calculateMatchPoints(
  actualHome: number,
  actualAway: number,
  predictedHome: number,
  predictedAway: number,
  isPlayoff: boolean,
  tournament: string,
): ScoreResult {
  // 1. Määritetään oikeat merkit (1X2)
  const actualChoice =
    actualHome > actualAway ? "1" : actualHome < actualAway ? "2" : "X";
  const predictedChoice =
    predictedHome > predictedAway
      ? "1"
      : predictedHome < predictedAway
        ? "2"
        : "X";

  const isCorrectWinner = actualChoice === predictedChoice;
  const isPerfectScore =
    actualHome === predictedHome && actualAway === predictedAway;

  // 2. Lasketaan "maalin päässä" -logiikka
  // Sääntö: Merkki oikein JA jompikumpi maalimäärä heittää tasan yhdellä
  const homeDiff = Math.abs(actualHome - predictedHome);
  const awayDiff = Math.abs(actualAway - predictedAway);

  // Maalin päässä on voimassa, jos toinen on oikein ja toinen heittää yhdellä,

  const isCloseCall =
    isCorrectWinner && !isPerfectScore && homeDiff + awayDiff < 2;

  const isQuiteCloseCall =
    !isCorrectWinner && !isPerfectScore && homeDiff + awayDiff < 2;

  // 3. Pisteytyslogiikkasi mukaan:
  let points = 0;

  if (tournament === "lätkä_2026") {
    if (isPerfectScore) {
      points = 10;
    } else if (isCloseCall) {
      points = 5; // 3p merkistä + 2p läheltä piti
    } else if (isCorrectWinner) {
      points = 3;
    } else if (isQuiteCloseCall) {
      points = 1; // 1p läheltä piti, mutta merkki väärin
    }

    if (isPlayoff) {
      points = points * 2;
    }
  } else if (tournament === "futis_2026") {
    if (isPerfectScore) {
      points = 6;
    } else if (isCloseCall) {
      points = 4; // 3p merkistä + 1p läheltä piti
    } else if (isCorrectWinner) {
      points = 3;
    } else if (isQuiteCloseCall) {
      points = 1; // 1p läheltä piti, mutta merkki väärin
    }
    if (isPlayoff) {
      points = points * 2;
    }
  } else {
    throw new Error(`Tuntematon turnaus: ${tournament}`);
  }

  return {
    points,
    isCorrectWinner,
    isPerfectScore,
    isCloseCall,
    isQuiteCloseCall,
  };
}
