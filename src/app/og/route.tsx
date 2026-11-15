export const dynamic = "force-static";
import { ImageResponse } from "next/og";
import { OgCard } from "@/lib/og";
export function GET(){return new ImageResponse(<OgCard/>,{width:1200,height:630});}
