import {resolveSiteOrigin} from '@/lib/site-origin';
import {publicRelease} from '@/lib/release';
export { stack } from "./toolkit";
export const site = {
  name: "Vishvendra Reddy Bhoomidi",
  shortName: "Vishvendra",
  title: "Founder, engineer, always building.",
  description: "The personal home of Vishvendra Reddy Bhoomidi. Founder of Kaarya AI, AI engineer, and builder of systems that turn intelligence into execution.",
  headline: "I build intelligent systems that do real work.",
  timezone: "America/Detroit",
  // Owner-confirmed canonical domain. Environment overrides must remain valid root origins.
  url: resolveSiteOrigin(process.env.NEXT_PUBLIC_SITE_URL || "https://vishvendrabhoomidi.com",publicRelease),
  location: "Michigan, United States",
  contact: { email: "vishvendrabhoomidi@gmail.com", linkedin: "https://www.linkedin.com/in/vishvendra-reddy-bhoomidi/", github: "https://github.com/Vishvendra07", instagram: "https://www.instagram.com/vishvendrabhoomidi/", x: "https://x.com/VishvendraReddy" },
  venture: { name: "Kaarya AI", url: "https://kaaryaai.com" },
  resume: "/media/vishvendra-bhoomidi-backend-resume.pdf",
  milestones: [
    { date:"Sep 2021 — Feb 2022", title:"Surge Business Development", role:"Team Manager · Business and Technology Intern", kind:"Experience", description:"Cross-functional delivery for a TensorFlow recommendation-engine project." },
    { date:"May 2023 — Dec 2024", title:"V&U Intellect Consultants", role:"Director", kind:"Experience", description:"Consultancy operations, AWS-hosted AI services, and TensorFlow inference profiling." },
    { date:"May 2024", title:"Computer Science, B.S.", role:"The Pennsylvania State University", kind:"Education", description:"A foundation in software, algorithms, and systems." },
    { date:"Jan — May 2025", title:"University of Michigan–Dearborn", role:"Teaching Assistant / Grader", kind:"Experience", description:"Programming and project feedback in Computer Game Design and Understanding Customers." },
    { date:"Apr — Sep 2025", title:"Propvia", role:"Team Lead · Software Development Engineer Intern", kind:"Experience", description:"React/TypeScript dashboards, property analytics, and stakeholder-led iteration." },
    { date:"Aug 2025 — Present", title:"Kaarya AI", role:"Founder & Lead Engineer", kind:"Experience", description:"AI execution for service businesses, from discovery and product design to engineering and onboarding." },
    { date:"Dec 2025", title:"Artificial Intelligence, M.S.", role:"University of Michigan–Dearborn", kind:"Education", description:"Machine Learning concentration · High Distinction." },
  ],
};

export const pages = [
  { href: "/", title: "Home", description: "Founder, engineer, always building.", type: "Page" },
  { href: "/work", title: "Work", description: "Selected systems and the decisions behind them.", type: "Page" },
  { href: "/work/kaarya-ai", title: "Kaarya AI", description: "Intelligence, connected to execution.", type: "Case study" },
  { href: "/work/nutrilens-ai", title: "NutriLensAI", description: "An OCR and neural-classification prototype for nutrition labels.", type: "Case study" },
  { href: "/work/eatfit", title: "EatFit", description: "A team-built e-commerce platform with storefront and admin workflows.", type: "Case study" },
  { href: "/work/email-classifier", title: "Email Classifier", description: "Comparing classical and neural approaches to email classification.", type: "Case study" },
  { href: "/work/bayesian-inference", title: "Bayesian Inference", description: "Exact enumeration and sampling for probabilistic reasoning.", type: "Case study" },
  { href: "/writing", title: "Writing", description: "Notes on AI, systems, and the craft of building.", type: "Page" },
  { href: "/about", title: "About", description: "Engineer at heart. Founder by choice.", type: "Page" },
  { href: "/lab", title: "Lab", description: "Small experiments. Useful intuitions.", type: "Page" },
  { href: "/lab/message-pipeline", title: "From message to action", description: "Explore an AI execution pipeline.", type: "Experiment" },
  { href: "/lab/latency-budget", title: "The latency budget", description: "Find the critical path in a voice response.", type: "Experiment" },
  { href: "/now", title: "Now", description: "A dated snapshot, not a live status feed.", type: "Page" },
  { href: "/stack", title: "Stack", description: "A toolkit for making useful things.", type: "Page" },
  { href: "/credits", title: "Credits", description: "Ideas, tools, and acknowledgments.", type: "Page" },
  { href: "/contact", title: "Contact", description: "Start a conversation.", type: "Page" },
  { href: "/resume", title: "Résumé", description: "Education and founder background.", type: "Page" },
  { href: "/activity/methodology", title: "Activity methodology", description: "What the work in dots actually measures.", type: "Page" },
];

export const labs = [
  { slug: "message-pipeline", number: "01", title: "From message to action", description: "Follow a request through understanding, tools, and execution. Move the pieces. Inspect the handoffs.", tags: "AI SYSTEMS · INTERACTIVE", color: "violet" },
  { slug: "latency-budget", number: "02", title: "The latency budget", description: "A response is only as fast as its critical path. Explore which work can happen at the same time.", tags: "VOICE · SYSTEMS THINKING", color: "blue" },
];
