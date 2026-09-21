import React from 'react';
export default function NetworkCard({item}) {
 const stream=item.section==='Realtime';
 const contract=item.contract;
 const settings=item.tanstackQuery || contract.tanstackExample;
 const example=!item.tanstackQuery && !!contract.tanstackExample;
 return <>
  <dl className="network-fields"><dt>Transport</dt><dd><code>{item.transport}</code></dd>
  <dt>{stream?'Subscribe when':'Called when'}</dt><dd>{item.trigger}</dd>
  {stream && <><dt>On event</dt><dd>{item.onEvent || (contract.name === 'WorkspaceChanges' ? 'workspaceChanged → refresh() (200 ms coalescing)' : 'Not documented')}</dd><dt>Disconnect</dt><dd>{item.cleanup || (contract.name === 'WorkspaceChanges' ? 'Unmount / actor change → unsubscribe + dispose' : 'Not documented')}</dd></>}
  </dl>
  <div className="dto-columns"><div><b>{stream?'Subscription / input':'Request DTO'}</b><pre>{contract.request}</pre></div><div><b>{stream?'Event DTO':'Response DTO'}</b><pre>{contract.response}</pre></div></div>
  {!stream && <details className="behavior-details" open={!!settings}><summary>TanStack Query · {example?'sample settings':settings?'configured':'not used'}</summary>{example && <p className="muted">Example values · not implemented in application code. Times are in milliseconds.</p>}{settings ? <dl className="network-fields">{Object.entries(settings).map(([key,value])=><React.Fragment key={key}><dt>{key}</dt><dd><code>{typeof value==='string'?value:JSON.stringify(value)}</code></dd></React.Fragment>)}</dl> : <p className="muted">Current implementation: custom fetch / React hook. No TanStack Query settings.</p>}</details>}
  <small className="muted">Selected response data, not live traffic. ? optional · | null nullable.</small>
 </>;
}
