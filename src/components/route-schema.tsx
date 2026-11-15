import {routeGraph,safeJsonLd} from '@/lib/seo';
export function RouteSchema({path,title,description}:{path:string;title?:string;description?:string}){return <script type="application/ld+json" dangerouslySetInnerHTML={{__html:safeJsonLd(routeGraph(path,title,description))}}/>;}
