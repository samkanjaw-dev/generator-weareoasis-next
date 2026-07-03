import type { Metadata } from "next";

import { ProtectedArtworkGenerator } from "@/components/protected-artwork-generator";

export const metadata: Metadata = {
  title: "Photomosaic Artwork Generator",
  description: "Generate platform-neutral campaign artwork from a portrait, a photo library, copy, and logos."
};

export default function ArtworkGeneratorPage() {
  return <ProtectedArtworkGenerator />;
}
