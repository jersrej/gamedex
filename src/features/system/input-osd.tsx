/**
 * The television's input read-out: "VIDEO 1 / NTSC", held in the top-right
 * corner of the picture for as long as the set is on. It sits above the page
 * but below dialogs, so the search screen and image viewer cover it, and it
 * is hidden while the boot sequence plays (see `.input-osd` in globals.css).
 *
 * Purely set dressing: it states nothing the visitor needs, cannot be
 * clicked through to, and is hidden from assistive technology.
 */
export function InputOsd() {
  return (
    <div
      aria-hidden
      className="input-osd pointer-events-none fixed top-[calc(var(--deck-top)+1rem)] right-[calc(var(--screen-x)+1.25rem)] z-[45] text-right font-mono text-[#6dff92] uppercase [text-shadow:0_0_10px_rgb(61_255_110/0.8),2px_2px_0_rgb(0_0_0/0.9)] md:top-[calc(var(--deck-top)+2.25rem)] md:right-[calc(var(--screen-x)+3.25rem)]"
    >
      <p className="text-sm leading-none tracking-[0.2em] md:text-xl">Video 1</p>
      <p className="mt-1.5 text-[0.6875rem] leading-none tracking-[0.3em] md:mt-2 md:text-sm">
        NTSC
      </p>
    </div>
  );
}
