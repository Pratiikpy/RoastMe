import type { Metadata } from "next";

const APP_URL = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const imageUrl = `${APP_URL}/api/og/${id}`;

  return {
    title: "Onchain Roast Me",
    description: "Someone just got roasted by AI. Can you handle the heat?",
    openGraph: {
      title: "Onchain Roast Me",
      description: "Someone just got roasted by AI. Can you handle the heat?",
      images: [imageUrl],
    },
    other: {
      "fc:frame": "vNext",
      "fc:frame:image": imageUrl,
      "fc:frame:image:aspect_ratio": "1.91:1",
      "fc:frame:button:1": "Open Roast",
      "fc:frame:button:1:action": "link",
      "fc:frame:button:1:target": `${APP_URL}/roast/${id}`,
    },
  };
}

export default function RoastDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
