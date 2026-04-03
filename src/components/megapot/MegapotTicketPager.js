"use client";

import drawStyles from "@/components/megapot/MegapotDraw.module.css";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/Icons";

export default function MegapotTicketPager({ page, total, onPrev, onNext }) {
  return (
    <div
      className={drawStyles.ticketPager}
      role="navigation"
      aria-label="Ticket navigation"
    >
      <button
        type="button"
        className={drawStyles.ticketPagerBtn}
        onClick={onPrev}
        disabled={page <= 0}
        aria-label="Previous ticket"
      >
        <ChevronLeftIcon size={16} />
      </button>
      <span className={drawStyles.ticketPagerCount}>
        {page + 1} of {total}
      </span>
      <button
        type="button"
        className={drawStyles.ticketPagerBtn}
        onClick={onNext}
        disabled={page >= total - 1}
        aria-label="Next ticket"
      >
        <ChevronRightIcon size={16} />
      </button>
    </div>
  );
}
