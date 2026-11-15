import { notFound } from "next/navigation";
import { ActivityHeatmap } from "@/components/activity";
import { PageIntro } from "@/components/ui";
export const dynamic="force-static";
export default async function ActivityPreview(){if(process.env.NODE_ENV!=="development")notFound();const {activityFixture}=await import("../../../../tests/fixtures/activity");return <div className="container page-body"><PageIntro label="Local development only" title="Activity component preview">DEMO DATA — NOT REAL USAGE. This fixture is never served by production routes.</PageIntro><ActivityHeatmap dataset={activityFixture()} end="2026-11-15"/></div>;}
