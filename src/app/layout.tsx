import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "99 cents",
  description: "A small action. A choice of the strong.",
  metadataBase: new URL("https://99cents.one"),
  openGraph: {
    title: "99 cents",
    description: "A small action. A choice of the strong.",
    url: "https://99cents.one",
    siteName: "99 cents",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
