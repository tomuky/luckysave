"use client";

import cardStyles from "@/components/ui/Card.module.css";
import textStyles from "@/components/ui/Text.module.css";
import drawStyles from "@/components/megapot/MegapotDraw.module.css";

export default function MegapotDrawPanelDisconnected() {
  return (
    <div className={drawStyles.drawPanelRow}>
      <div className={cardStyles.card}>
        <div className={cardStyles.cardHeader}>
          <h2>Lottery Results</h2>
        </div>
        <p className={textStyles.muted}>
          Connect on Base to see results and your lines.
        </p>
      </div>
    </div>
  );
}
