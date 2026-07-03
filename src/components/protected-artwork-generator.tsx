"use client";

import { ArtworkAuthGate } from "@/components/artwork-auth-gate";
import { ArtworkGenerator } from "@/components/artwork-generator";

export function ProtectedArtworkGenerator() {
  return (
    <ArtworkAuthGate>
      {({ accessToken, canEditLayout }) => (
        <ArtworkGenerator accessToken={accessToken} layoutEditorAllowed={canEditLayout} />
      )}
    </ArtworkAuthGate>
  );
}
