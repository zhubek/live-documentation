import React from "react";

const paths = {
  person: <><circle cx="12" cy="7" r="4"/><path d="M4 21v-2a8 8 0 0 1 16 0v2"/></>,
  system: <><rect x="3" y="3" width="18" height="18" rx="3"/><path d="M8 8h8v8H8z"/></>,
  application: <><rect x="2" y="3" width="20" height="18" rx="2"/><path d="M2 9h20M6 6h1m3 0h1"/></>,
  service: <><rect x="3" y="3" width="18" height="7" rx="2"/><rect x="3" y="14" width="18" height="7" rx="2"/><path d="M7 6.5h.01M7 17.5h.01M12 6.5h5M12 17.5h5"/></>,
  database: <><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14c0 4 18 4 18 0V5M3 12c0 4 18 4 18 0"/></>,
  external: <><circle cx="12" cy="12" r="10"/><ellipse cx="12" cy="12" rx="4" ry="10"/><path d="M2 12h20"/></>,
  entity: <><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18M9 9v12"/></>,
  component: <><rect x="8" y="3" width="13" height="18" rx="2"/><path d="M3 6h9v5H3zM3 14h9v5H3z"/></>,
  policy: <><path d="m12 2 9 4v6c0 5-9 10-9 10S3 17 3 12V6z"/><path d="m7 12 3 3 7-7"/></>,
  query: <><circle cx="10" cy="10" r="7"/><path d="m15 15 7 7M7 8h6M7 12h4"/></>,
  "use-case": <><circle cx="5" cy="5" r="3"/><circle cx="19" cy="19" r="3"/><path d="M8 5h8a3 3 0 0 1 0 6H8a3 3 0 0 0 0 6h8"/></>,
  task: <><rect x="3" y="3" width="18" height="18" rx="3"/><path d="m7 12 3 3 7-7"/></>,
  gateway: <><path d="m12 2 10 10-10 10L2 12zM9 9l6 6m0-6-6 6"/></>,
  event: <><circle cx="12" cy="12" r="10"/><path d="m10 7 6 5-6 5z"/></>,
};
export default function NodeIcon({ kind }) {
  return <span className="node-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" focusable="false">{paths[kind] || paths.system}</svg></span>;
}
