import { BookOpenCheck, CloudOff, FileUp, MonitorSmartphone, ScanSearch, Waypoints, type LucideIcon } from "lucide-react";

/*
 * Textos de la portada. Solo describen lo que PanelVault hace de verdad:
 * nada de cifras inventadas ni tecnologías que el proyecto no usa.
 */

export type Step = { number: string; title: string; text: string; icon: LucideIcon; ai?: boolean };

export const steps: Step[] = [
  {
    number: "01",
    title: "Importa tu cómic",
    text: "Sube archivos CBZ, PDF o imágenes. Los archivos se quedan en tu dispositivo.",
    icon: FileUp,
  },
  {
    number: "02",
    title: "La IA detecta las viñetas",
    text: "El motor de visión por computador encuentra cada viñeta y calcula su orden de lectura, occidental o manga.",
    icon: ScanSearch,
    ai: true,
  },
  {
    number: "03",
    title: "Lee viñeta por viñeta",
    text: "El lector te lleva de una viñeta a la siguiente, cómodo incluso en la pantalla del celular.",
    icon: BookOpenCheck,
  },
];

export type Feature = { title: string; text: string; icon: LucideIcon };

export const features: Feature[] = [
  {
    title: "Lectura guiada",
    text: "Avanza por las viñetas en el orden correcto sin hacer zoom a mano.",
    icon: Waypoints,
  },
  {
    title: "Funciona sin conexión",
    text: "Tu biblioteca vive en el navegador: sigues leyendo aunque no haya internet.",
    icon: CloudOff,
  },
  {
    title: "Tu progreso en todos tus dispositivos",
    text: "La página en la que vas y tus marcadores se sincronizan al volver la conexión.",
    icon: MonitorSmartphone,
  },
];

export type Classic = {
  slug: string;
  title: string;
  author: string;
  year: number;
  publisher: string;
  tone: "accent" | "highlight" | "ai";
};

/** Las mismas tres obras que el backend publica en su catálogo (migración V7). */
export const classics: Classic[] = [
  {
    slug: "little-nemo-in-slumberland",
    title: "Little Nemo in Slumberland",
    author: "Winsor McCay",
    year: 1905,
    publisher: "New York Herald",
    tone: "highlight",
  },
  {
    slug: "the-yellow-kid",
    title: "The Yellow Kid",
    author: "Richard F. Outcault",
    year: 1895,
    publisher: "New York World",
    tone: "accent",
  },
  {
    slug: "krazy-kat",
    title: "Krazy Kat",
    author: "George Herriman",
    year: 1913,
    publisher: "New York Evening Journal",
    tone: "ai",
  },
];
