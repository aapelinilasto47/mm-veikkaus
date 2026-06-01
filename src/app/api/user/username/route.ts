import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import mongoose from "mongoose";

export async function POST(req: Request) {
  try {
    const session = await getServerSession();

    // Varmistetaan, että käyttäjä on kirjautunut
    if (!session?.user?.email) {
      return NextResponse.json(
        { message: "Kirjaudu sisään ensin!" },
        { status: 401 },
      );
    }

    const { newUsername } = await req.json();

    // Validoidaan nimimerkki
    if (!newUsername || newUsername.trim().length < 3) {
      return NextResponse.json(
        { message: "Nimimerkin täytyy olla vähintään 3 merkkiä pitkä." },
        { status: 400 },
      );
    }

    // Siistitään nimimerkki (sallitaan vain kirjaimet, numerot ja alaviiva, max 12 merkkiä)
    const sanitizedUsername = newUsername
      .replace(/[^a-zA-Z0-9_öäåÖÄÅ]/g, "")
      .substring(0, 12);

    if (sanitizedUsername.length < 3) {
      return NextResponse.json(
        { message: "Nimimerkissä on kiellettyjä merkkejä." },
        { status: 400 },
      );
    }

    const db = mongoose.connection.db;
    if (!db)
      return NextResponse.json({ message: "Tietokantavirhe" }, { status: 500 });

    // 1. Tarkistetaan, onko nimimerkki jo jonkun muun sähköpostin käytössä
    const existingOwner = await db.collection("predictions").findOne({
      username: { $regex: new RegExp(`^${sanitizedUsername}$`, "i") }, // Case-insensitive tarkistus
      userId: { $ne: session.user.email },
    });

    if (existingOwner) {
      return NextResponse.json(
        { message: "Tämä nimimerkki on jo varattu!" },
        { status: 400 },
      );
    }

    // 2. Päivitetään nimimerkki KAIKKIIN tämän käyttäjän tekemiin ennustuksiin
    await db
      .collection("predictions")
      .updateMany(
        { userId: session.user.email },
        { $set: { username: sanitizedUsername } },
      );

    return NextResponse.json({
      message: "Valmista!",
      username: sanitizedUsername,
    });
  } catch (error) {
    return NextResponse.json(
      { message: "Virhe palvelimella" },
      { status: 500 },
    );
  }
}
