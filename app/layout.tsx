import type { Metadata } from "next";
import "./globals.css";
import "./v2.css";
import "./return-console.css";
import "./v5-direct-wallet.css";

export const metadata: Metadata = {
 title: "Quorail | Every Payment Has a Consequence",
 description: "Quorail is an autonomous financial consequence engine for USDC treasuries on Arc. Weigh real business obligations, protect working capital, and settle permitted USDC payments on Arc.",
 openGraph: { title: "Quorail | The Financial Consequence Engine", description: "Know what money changes.", type: "website" },
 robots: { index: true, follow: true },
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
 return <html lang="en"><body>{children}</body></html>;
}
