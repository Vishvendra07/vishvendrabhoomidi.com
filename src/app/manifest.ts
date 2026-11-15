export const dynamic = "force-static";
import type {MetadataRoute} from 'next';
import {site} from '@/data/site';
export default function manifest():MetadataRoute.Manifest{return {name:site.name,short_name:'Vishvendra',description:site.description,lang:'en-US',start_url:'/',scope:'/',display:'browser',background_color:'#111217',theme_color:'#111217',icons:[{src:'/icons/icon-192.png',sizes:'192x192',type:'image/png',purpose:'any'},{src:'/icons/icon-512.png',sizes:'512x512',type:'image/png',purpose:'any'}]};}
