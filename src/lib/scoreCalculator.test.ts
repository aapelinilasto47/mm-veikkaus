import { expect, test, describe } from "vitest";
import { calculateMatchPoints } from "./scoreCalculator";

describe("Futisveikkauksen (futis_2026) pistelaskenta", () => {
  test("Täydellinen osuma (2-1 ja veikkaus 2-1) pitäisi antaa 6 pistettä", () => {
    const tulos = calculateMatchPoints(2, 1, 2, 1, false, "futis_2026");

    // "Odotetaan, että tuloksen pisteet ovat tasan 6"
    expect(tulos.points).toBe(6);
    expect(tulos.isPerfectScore).toBe(true);
  });

  test("Oikea merkki mutta väärät maalit (2-1 ja veikkaus 1-0) pitäisi antaa 3 pistettä", () => {
    const tulos = calculateMatchPoints(2, 1, 1, 0, false, "futis_2026");

    expect(tulos.points).toBe(3);
    expect(tulos.isCorrectWinner).toBe(true);
    expect(tulos.isPerfectScore).toBe(false);
  });

  test("Väärä merkki, mutta maalin päässä (2-1 ja veikkaus 1-1) pitäisi antaa 1 piste", () => {
    const tulos = calculateMatchPoints(2, 1, 1, 1, false, "futis_2026");

    expect(tulos.points).toBe(1);
    expect(tulos.isQuiteCloseCall).toBe(true);
    expect(tulos.isCorrectWinner).toBe(false);
  });

  test("Täysin ohi (2-0 ja veikkaus 0-2) pitäisi antaa 0 pistettä", () => {
    const tulos = calculateMatchPoints(2, 0, 0, 2, false, "futis_2026");

    expect(tulos.points).toBe(0);
  });
});
