import type { Metadata } from "next";
import "./globals.css";
import "./v2.css";
import "./v3.css";

export const metadata: Metadata = {
 title: "Quorail | Financial Consequence Intelligence",
 description: "Quorail is an autonomous financial consequence engine for USDC treasuries on Arc. Model tomorrow. Decide with evidence. Settle with proof.",
 openGraph: { title: "Quorail | The Financial Consequence Engine", description: "Know what money changes.", type: "website" },
 robots: { index: true, follow: true },
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
 return <html lang="en"><body>{children}</body></html>;
}
