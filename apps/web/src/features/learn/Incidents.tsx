/** SPEC §3.14 item 4. Written plainly and respectfully, with NASA sources. No jokes, no easter eggs near this content. */
const INCIDENTS = [
  { id: 'apollo-1', title: 'Apollo 1, January 1967', href: 'https://www.nasa.gov/mission/apollo-1/', link: 'NASA: Apollo 1',
    text: 'During a launch rehearsal test, a fire in the command module killed astronauts Virgil Grissom, Edward White and Roger Chaffee. The cabin held a high-oxygen atmosphere. The investigation led to major changes in spacecraft materials, hatches and procedures.' },
  { id: 'apollo-13', title: 'Apollo 13, April 1970', href: 'https://www.nasa.gov/mission/apollo-13/', link: 'NASA: Apollo 13',
    text: 'An oxygen tank in the service module failed in flight. Investigators traced the ignition to damaged wire insulation inside the tank. The mission was cut short and all three crew members returned to Earth.' },
  { id: 'mir', title: 'Mir, February 1997', href: 'https://www.nasa.gov/history/SP-4225/', link: 'NASA History: the Shuttle-Mir program',
    text: 'A fire broke out in an oxygen-generating canister aboard the Mir space station while crew from Russia, the United States and Germany were on board. The crew fought the fire and no one was killed. The event is part of the shared history of the Shuttle-Mir program.' },
];

export function Incidents() {
  return (
    <section aria-labelledby="inc-h" className="border-t border-hairline pt-12" data-testid="incidents">
      <h2 id="inc-h" className="text-3xl">Real incidents</h2>
      <p className="mt-2 max-w-[60ch] text-muted">Fire in a spacecraft is not hypothetical. These events are why this research exists. Please read the official accounts.</p>
      <div className="mt-6 grid gap-px border border-hairline bg-hairline md:grid-cols-3">
        {INCIDENTS.map((i) => (
          <article key={i.id} className="bg-surface p-5" aria-labelledby={`inc-${i.id}`}>
            <h3 id={`inc-${i.id}`} className="text-lg">{i.title}</h3>
            <p className="mt-3 text-sm leading-relaxed">{i.text}</p>
            <p className="mt-4 text-sm"><a href={i.href} target="_blank" rel="noreferrer noopener">{i.link}</a></p>
          </article>
        ))}
      </div>
    </section>
  );
}
