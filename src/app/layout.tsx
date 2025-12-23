import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "99 cents",
  description: "A small action. A choice of the strong.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
