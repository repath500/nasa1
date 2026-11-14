import { DitherCanvas } from '../../components/DitherCanvas';
import { LinkButton } from '../../components/Button';
import { dropletLum } from '../../components/flame';

/** SPEC §9: "This page drifted out of the corpus." The droplet drifts slowly (CSS drift, paused under reduced motion). */
export default function NotFoundPage() {
  return (
    <div className="mx-auto grid min-h-[70dvh] max-w-[1000px] items-center gap-10 px-4 py-16 md:grid-cols-[1fr_320px]">
      <div>
        <h1 className="text-4xl md:text-5xl">This page drifted out of the corpus.</h1>
        <p className="mt-4 max-w-[48ch] text-muted">Nothing is stored at this address. The map, the studies and the sources are all still here.</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <LinkButton to="/" variant="primary">Back home</LinkButton>
          <LinkButton to="/atlas">Open the atlas</LinkButton>
          <LinkButton to="/learn" variant="ghost">Learn how flames behave</LinkButton>
        </div>
      </div>
      <div className="fa-drift mx-auto w-full max-w-[280px]">
        <DitherCanvas lum={dropletLum} cell={5} className="aspect-square w-full" label="A dithered droplet floating in the dark" />
      </div>
    </div>
  );
}
