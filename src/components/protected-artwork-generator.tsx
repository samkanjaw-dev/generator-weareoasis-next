import { ArtworkGenerator } from "@/components/artwork-generator";

export function ProtectedArtworkGenerator() {
  return <ArtworkGenerator accessToken={null} layoutEditorAllowed={false} />;
}
