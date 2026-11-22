/** Monospace chip for short outlet codes such as "DHA". */
export function OutletCodeTag({ outletCode }) {
  if (!outletCode) return null;
  return (
    <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs font-semibold text-foreground">
      {outletCode}
    </span>
  );
}
