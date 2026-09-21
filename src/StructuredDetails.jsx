import React from 'react';
import {structureFor} from './structured-page';
function Grid({title,headers,rows,empty = "None"}) {
 return <section className="contract-table"><h4>{title}</h4>{rows.length ? <div className="table-scroll"><table><thead><tr>{headers.map(h=><th key={h}>{h}</th>)}</tr></thead><tbody>{rows.map((row,i)=><tr key={i}>{row.map((cell,j)=><td key={j}><code>{cell}</code></td>)}</tr>)}</tbody></table></div> : <p className="muted">{empty}</p>}</section>;
}
export default function StructuredDetails({item}) {
 if(item.table) return <Grid title="" headers={item.table.headers} rows={item.table.values} />;
 const data=structureFor(item);
 if(item.section === "Components") {
  const notes = data.props?.some(row => row.length > 3);
  return <><Grid title={item.example ? "Props · sample values" : "Props"} headers={["Prop", "Type", "Value passed", ...(notes ? ["Notes / effect"] : [])]} rows={(data.props || []).map(row => notes ? [row[0], row[1], row[2], row[3] || '—'] : row)} empty={data.props ? "No props." : "Props not documented."}/>{data.permissions?.length>0&&<Grid title="UI permissions & conditions" headers={['Input','Affects','Expression']} rows={data.permissions}/>}</>;
 }
 return <>{data.facts?.length > 0 && <Grid title="API behavior" headers={['Property','Value']} rows={data.facts}/>}{data.props && <Grid title="Props · all required" headers={['Prop','Type','Value passed']} rows={data.props}/>}<Grid title="UI permissions & conditions" headers={['Input / type','Affects','Exact expression']} rows={data.permissions || []} empty={item.section === "Components" ? "No permission condition documented on this component." : "No UI permission binding documented for this operation."}/><small className="muted">UI conditions only; backend authorization is enforced separately.</small></>;
}
