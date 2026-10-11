import type { Metadata } from "next";
import "./globals.css";
import "./v2.css";
import "./v3.css";
import "./v4.css";

export const metadata: Metadata = {
 title: "Quorail | Know What a Payment Changes",
 description: "Quorail is an autonomous financial consequence engine for USDC treasuries on Arc. Weigh real business obligations, protect working capital, and settle permitted USDC payments on Arc.",
 openGraph: { title: "Quorail | The Financial Consequence Engine", description: "Know what money changes.", type: "website" },
 robots: { index: true, follow: true },
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
 return <html lang="en"><body>{children}</body></html>;
}
