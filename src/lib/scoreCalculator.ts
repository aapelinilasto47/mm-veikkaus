// src/lib/scoreCalculator.ts

export interface ScoreResult {
  points: number;
  isCorrectWinner: boolean; // Oikea 1X2 merkki
  isPerfectScore: boolean; // Täysin oikein
  isCloseCall: boolean; // Maalin päässä
}

export function calculateMatchPoints(
  actualHome: number,
  actualAway: number,
  predictedHome: number,
  predictedAway: number,
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
  // TAI jos molemmat heittävät yhdellä (esim. 2-1 vs 3-2), mutta merkki pysyy samana.
  const isCloseCall =
    isCorrectWinner && !isPerfectScore && homeDiff + awayDiff < 2;

  // 3. Pisteytyslogiikkasi mukaan:
  let points = 0;
  if (isPerfectScore) {
    points = 10;
  } else if (isCloseCall) {
    points = 5; // 3p merkistä + 2p läheltä piti
  } else if (isCorrectWinner) {
    points = 3;
  }

  return {
    points,
    isCorrectWinner,
    isPerfectScore,
    isCloseCall,
  };
}
