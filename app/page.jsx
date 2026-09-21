'use client';
import dynamic from 'next/dynamic';
const Studio=dynamic(()=>import('../src/StudioBackend.jsx'),{ssr:false,loading:()=> <p className="studio-loading">Loading Live documentation…</p>});
export default function Page(){return <Studio/>;}
