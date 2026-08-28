/**
 * Build-time site surface flags.
 * Architecture & design is for local/dev review — hidden on production bundles.
 */
export const showArchitecturePage = import.meta.env.DEV;
