import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { NextAuthOptions } from "next-auth"; // Tuodaan tyyppimäärittely

// 1. Määritellään ja exportataan asetukset muuttujassa
export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.OAUTH_CLIENT_ID!,
      clientSecret: process.env.OAUTH_CLIENT_SECRET!,
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  // Tähän voi lisätä myöhemmin esim. callbacks, jos tarpeen
};

// 2. Luodaan handler käyttämällä noita asetuksia
const handler = NextAuth(authOptions);

// 3. Exportataan handler GET ja POST metodeille
export { handler as GET, handler as POST };
