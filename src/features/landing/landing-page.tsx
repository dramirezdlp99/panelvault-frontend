import { CallToAction } from "./call-to-action";
import { Classics } from "./classics";
import { Features } from "./features";
import { Hero } from "./hero";
import { HowItWorks } from "./how-it-works";

/** Portada pública: se genera estática en la compilación (no depende de datos del usuario). */
export function LandingPage() {
  return (
    <>
      <Hero />
      <HowItWorks />
      <Features />
      <Classics />
      <CallToAction />
    </>
  );
}
