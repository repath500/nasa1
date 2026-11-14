import type { ReactNode } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { ArrowSquareOut } from '@phosphor-icons/react';
import { DEFAULT_PRIORITY, DEFAULT_TOLERANCES } from '@fire/contracts';
import { useAtlas } from '../../state/store';
import { Badge, Banner, Root } from '../atlas/_ui';
import { FIXTURE_LABEL } from '../studies/fixtures';
import { GLOSSARY, GLOSSARY_BY_ID } from './glossary';
import { NTRS_CREDITS, PSI_CREDITS, SOFTWARE_CREDITS } from './credits';

/** Dotted underline glossary term with a hover and focus card. */
export function Term({ id, children }: { id: string; children?: ReactNode }) {
  const g = GLOSSARY_BY_ID.get(id);
  if (!g) return <>{children}</>;
  return (
    <span className="fa-term" tabIndex={0} aria-label={`${g.term}: ${g.short}`}>
      {children ?? g.term}
      <span className="fa-badge__card" role="tooltip">{g.short}</span>
    </span>
  );
}

function Shell({ title, lead, children }: { title: string; lead: string; children: ReactNode }) {
  const link = ({ isActive }: { isActive: boolean }) => `fa-chip fa-chip--edit${isActive ? '' : ' fa-muted'}`;
  return (
    <Root>
      <main className="fa-page fa-page--narrow" id="main">
        <header className="fa-page__head">
          <nav className="fa-chips" aria-label="About pages">
            <NavLink to="/about" end className={link}>About</NavLink>
            <NavLink to="/method" className={link}>Method and limits</NavLink>
            <NavLink to="/credits" className={link}>Credits</NavLink>
          </nav>
          <h1>{title}</h1>
          <p className="fa-muted fa-prose" style={{ fontSize: 15 }}>{lead}</p>
        </header>
        {children}
      </main>
    </Root>
  );
}

const H = ({ id, children }: { id: string; children: ReactNode }) => <h2 id={id} style={{ fontSize: 18 }}>{children}</h2>;
const A = ({ href, children }: { href: string; children: ReactNode }) => <a href={href} target="_blank" rel="noreferrer">{children} <ArrowSquareOut size={12} aria-hidden="true" /></a>;

/* ---------------- About ---------------- */
export default function AboutPage() {
  return (
    <Shell title="About Fire Atlas" lead="Pick where people will live in space. See reported conditions from a curated set of NASA microgravity fire tests, plotted against that air. Every dot opens its source.">
      <section className="fa-sec fa-prose">
        <H id="what">What it is</H>
        <p>Fire Atlas maps the test conditions of NASA microgravity combustion investigations from the Physical Sciences Informatics (PSI) repository. You choose a habitat atmosphere, such as the Moon base example, and the atlas shows which tests ran at oxygen and pressure near it, which did not, and which studies to start with.</p>
        <p>It was built for the NASA Space Apps Challenge "Flame in Freefall". It is a reading aid for researchers, students and engineers. It is not a design tool.</p>
      </section>
      <section className="fa-sec fa-prose">
        <H id="not">What it does not do</H>
        <ul className="fa-list">
          <li>It does not judge any atmosphere. A study being ranked high means it is worth reading early, nothing more.</li>
          <li>It does not describe partial gravity. PSI holds no partial gravity combustion tests, so the Moon and Mars are never inferred from microgravity rows.</li>
          <li>It does not browse raw archives. The video and data archives behind these investigations run to terabytes. Only the experimental tables are used.</li>
          <li>It is not safety guidance. Real habitat decisions need qualified engineers and NASA standards.</li>
        </ul>
      </section>
      <section className="fa-sec fa-prose">
        <H id="free">What is free</H>
        <p>NASA derived evidence is never paywalled: the Gap Map, rankings, source rows, the Caught by code ledger, Learn mode, preset audio overviews and printing the brief are free. Paid plans cover things that cost money to run, such as live AI and voice generation and branded exports. In this build payments run in Stripe test mode and no real charge is made. <Link to="/pricing">See plans</Link>.</p>
      </section>
      <section className="fa-sec fa-prose">
        <H id="trust">How to trust a number</H>
        <p>Every number comes from a parsed table row, a quote that code checked against the source text, or a record that a named human accepted. Open any dot to see the raw cells, the source table hash and the DOI. Where a value is missing the atlas says "not reported" and never shows zero. <Link to="/method">Read the method and limits</Link>.</p>
      </section>
      <section className="fa-sec">
        <H id="who">Who built it</H>
        <div className="fa-card">
          <Badge kind="proposed" label="PLACEHOLDER" hover="The human team writes this section. Agents do not." />
          <p className="fa-flag">[PLACEHOLDER, written by the human team: team name, members and roles.]</p>
        </div>
      </section>
      <Banner tone="neutral">NASA does not endorse this project. It uses no NASA insignia, worm, seal or mission patch. Data credit is text only.</Banner>
    </Shell>
  );
}

/* ---------------- Method ---------------- */
export function MethodPage() {
  const priority = useAtlas((s) => s.priority);
  const tol = useAtlas((s) => s.tolerances);
  const names: Record<string, string> = {
    pillar_match: 'pillar match (human tag against your concern)',
    covers_count: 'number of rows that cover your air (code)',
    evidence_tier: 'evidence tier (human)',
    near_count: 'number of rows near your air (code)',
  };
  return (
    <Shell title="Method and limits" lead="How the data was parsed, how the two rankers work, what the verifier checks, and what none of this can tell you.">
      <section className="fa-sec fa-prose">
        <H id="pipeline">Pipeline</H>
        <ol className="fa-list">
          <li><strong>Fetch and hash.</strong> Experimental tables and metadata are fetched at build time. Each file is hashed with SHA-256 and the leading 12 hex digits travel with every row.</li>
          <li><strong>Parse by code.</strong> Code reads each table, converts units and records ranges as minimum and maximum. No language model touches a number in a table. Impossible cells are rejected with a reason and shown on the Caught by code tab.</li>
          <li><strong>Review by humans.</strong> Study tags and evidence tiers are set by named people. Until a card is reviewed it is marked as preview.</li>
          <li><strong>Freeze.</strong> The corpus is frozen with a hash of its contents. If the hash does not match, ranking is blocked with an explanation.</li>
        </ol>
      </section>

      <section className="fa-sec fa-prose">
        <H id="rubric">The transparent baseline ranker</H>
        <p>Studies are sorted by a priority order, highest priority at the top. There is no combined score. Ties are broken by accession.</p>
        <ol className="fa-list">{priority.map((k) => <li key={k}>{names[k]}</li>)}</ol>
        <p>
          Window around your air: O₂ ±<span className="fa-num">{tol.o2PctPoints}</span> percentage points, pressure ±<span className="fa-num">{Math.round(tol.pressureFrac * 100)}</span>%. A row covers your air when both fall inside. {priority.join() === DEFAULT_PRIORITY.join() && tol.o2PctPoints === DEFAULT_TOLERANCES.o2PctPoints && tol.pressureFrac === DEFAULT_TOLERANCES.pressureFrac ? <Badge kind="proposed" hover="This is the proposed default, decision D5. A human signs it in data/reviews/d5.json." /> : <span className="fa-muted">(changed from the proposal)</span>}
        </p>
        <p>A row that does not report O₂ or pressure is <Term id="overlap">unknown</Term>, never a mismatch and never zero. Rows whose O₂ is a <Term id="burner-stream">burner stream</Term> are excluded.</p>
        <p><strong>What rank means.</strong> Rank orders a reading list for your question. It is not a measure of how hazardous an atmosphere is, and it says nothing about partial gravity.</p>
      </section>

      <section className="fa-sec fa-prose">
        <H id="sensitivity">Sensitivity</H>
        <p>The ranker is recomputed under all 24 possible priority orders. The badge on the Studies tab says whether the top 3 studies are the same under every order or depend on which key sits at the top.</p>
      </section>

      <section className="fa-sec fa-prose">
        <H id="jev">Baseline versus Jev</H>
        <p>Jev is a model service that returns typed judgements: how relevant the described conditions are (a P(yes) number), how direct the evidence is (a level from 0 to 3) and which fire safety purpose it serves. These are ordinal model judgements. They are not probabilities that the science is true. They are shown in their own columns beside the baseline and never combined into one number.</p>
        <p>The Agreement strip says in words how far the two orders differ. Whether Jev improves on the baseline is decided by humans on a set of labelled study and scenario pairs. Result and number of pairs (n): <strong>not available yet</strong>. Where a Jev value carries the <Badge kind="fixture" /> chip it reads "{FIXTURE_LABEL}".</p>
      </section>

      <section className="fa-sec fa-prose">
        <H id="verifier">The verifier</H>
        <ul className="fa-list">
          <li><strong>Quotes.</strong> A quote is shown only for sources whose terms allow it. Code normalises the text, then requires the quote to appear verbatim on the cited page, at least 25 characters long, with every number in the record present in the quote. Planted fabricated quotes must fail in tests.</li>
          <li><strong>Table rows.</strong> The row index, the cell strings and the table hash must match the source file.</li>
          <li><strong>Paraphrases.</strong> Labelled "Paraphrase (team), not quoted" with a locator. Every numeral must appear on the cited page.</li>
          <li><strong>Models.</strong> Model written explanations must pass a number guard and a banned phrase check, or a code written sentence is shown instead.</li>
        </ul>
      </section>

      <section className="fa-sec fa-prose">
        <H id="limits">Limits</H>
        <ul className="fa-list">
          <li><strong>Gravity.</strong> Every row is a <Term id="microgravity">microgravity</Term> test on the ISS. Partial gravity: none in PSI. Microgravity and normal gravity results do not tell you what happens on the Moon.</li>
          <li><strong>Oxygen.</strong> Only ambient O₂ counts. <Term id="burner-stream">Burner stream</Term> values are not cabin air. <Term id="partial-pressure">Partial pressure</Term> is shown as context only, and equal partial pressure is not equal flammability.</li>
          <li><strong>Unknowns.</strong> Some tables report no O₂ or no pressure. Those rows are counted as unknown, not as absent. The gap sentence names how many tables are unknown.</li>
          <li><strong>Geometry.</strong> A droplet a millimetre across and a fabric sheet tens of centimetres long are different problems. The Compare page declines to set studies side by side when fuel phase or geometry scale differs by more than 10 times.</li>
          <li><strong>Sample width.</strong> Narrower samples in space than on the ground confound any gravity comparison, so none is made.</li>
          <li><strong>Words.</strong> The measured outcome is the <Term id="extinction-diameter">visible flame extinction diameter</Term>, which is a result of one test and not a boundary. Dates on investigations are investigation dates, not run dates.</li>
          <li><strong>Flow.</strong> ISS ventilation is described as around 15 to 20 cm/s in NASA slides. Table flows range more widely, and direction (<Term id="flow-direction">concurrent or opposed</Term>) matters.</li>
          <li><strong>Presets.</strong> Habitat presets are illustrative examples with sources, not design values.</li>
        </ul>
      </section>

      <section className="fa-sec">
        <H id="glossary">Glossary</H>
        <dl className="fa-dl">
          {GLOSSARY.map((g) => (
            <div key={g.id} id={`g-${g.id}`}>
              <dt>{g.term}</dt>
              <dd>{g.long}</dd>
            </div>
          ))}
        </dl>
      </section>
    </Shell>
  );
}

/* ---------------- Credits ---------------- */
export function CreditsPage() {
  return (
    <Shell title="Credits and disclosure" lead="Every source with its licence, the software and services behind the atlas, and how AI was used.">
      <section className="fa-sec">
        <H id="psi">NASA PSI investigations</H>
        <p className="fa-prose">Physical Sciences Informatics, Combustion Science. All records are licensed CC0-1.0. Record versions and modified dates are as fetched. <A href="https://psi.nasa.gov/">PSI repository</A>.</p>
        <div className="fa-tablewrap">
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 640 }}>
            <thead>
              <tr>{['Accession', 'Study', 'DOI', 'Version', 'Modified', 'Licence'].map((h) => <th key={h} scope="col" className="fa-tcell" style={{ textAlign: 'left', fontFamily: 'var(--fa-mono)', fontSize: 10.5, textTransform: 'uppercase', color: 'var(--fa-muted)', fontWeight: 500 }}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {PSI_CREDITS.map((p) => (
                <tr key={p.accession} style={{ borderTop: '1px solid var(--fa-hair)' }}>
                  <td className="fa-tcell fa-mono"><Link to={`/study/${p.accession}`}>{p.accession}</Link></td>
                  <td className="fa-tcell"><strong>{p.acronym}</strong> <span className="fa-muted">{p.title}{p.role === 'reserve' ? ' (reserve)' : ''}</span></td>
                  <td className="fa-tcell fa-mono"><a href={`https://doi.org/${p.doi}`} target="_blank" rel="noreferrer">{p.doi}</a></td>
                  <td className="fa-tcell fa-num" style={{ textAlign: 'left' }}>v{p.version}</td>
                  <td className="fa-tcell fa-mono">{p.modified}</td>
                  <td className="fa-tcell fa-mono">CC0-1.0</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="fa-muted" style={{ fontSize: 12 }}>FLEX-2 (PSI-68) is a planned range, not measured tests, and is not plotted. The AWS Open Data registry entry for PSI states no restrictions on the use of this data.</p>
      </section>

      <section className="fa-sec">
        <H id="ntrs">NASA Technical Reports Server</H>
        <p className="fa-prose">Each report carries a copyright determination from NTRS. Verbatim quotes appear only where the determination allows. Everything else is shown as a team paraphrase.</p>
        <ul className="fa-list" style={{ listStyle: 'none', padding: 0, gap: 12 }}>
          {NTRS_CREDITS.map((n) => (
            <li key={n.id} className="fa-card">
              <span><A href={`https://ntrs.nasa.gov/citations/${n.id}`}><span className="fa-mono">NTRS {n.id}</span></A></span>
              <strong>{n.title}</strong>
              <span className="fa-muted">{n.authors}. {n.year}. {n.kind}.</span>
              <span><span className="fa-chip fa-chip--edit" style={{ height: 'auto', padding: '1px 8px' }}>{n.determination}</span> <span className="fa-muted">{n.use}</span></span>
            </li>
          ))}
        </ul>
      </section>

      <section className="fa-sec">
        <H id="software">Software and fonts</H>
        <ul className="fa-list">
          {SOFTWARE_CREDITS.map((s) => <li key={s.name}>{s.name}: <span className="fa-mono">{s.licence}</span>{s.note ? <span className="fa-muted">. {s.note}</span> : null}</li>)}
        </ul>
        <p className="fa-muted" style={{ fontSize: 12 }}>Licences are as declared by each package. A full licence audit runs before submission.</p>
      </section>

      <section className="fa-sec fa-prose">
        <H id="services">Model and hosted services</H>
        <ul className="fa-list">
          <li><strong>Jev 1.14</strong> (TypeSafe): typed relevance, directness and pillar judgements. Called from our server only. Shown as <Badge kind="si" modelId="jev-1.14.0" />.</li>
          <li><strong>Gemini 4 Hydrogen</strong> (Google): proposes table column maps and paper extracts at build time, parses questions, and drafts explanations that must pass a number guard.</li>
          <li><strong>Gemini decision-1</strong> (Google): fallback for the judgements. Always labelled decision-1, never as Jev.</li>
          <li><strong>ElevenLabs</strong>: the AI-generated voice in audio overviews. A stock library voice is used. No cloned or impersonated voice, and no imitation of any NASA voice. Each overview says so aloud and in text.</li>
          <li><strong>Stripe</strong>: hosted checkout in <strong>test mode</strong> for this build. No real charge is made. Judges may use Stripe's test card.</li>
        </ul>
        <p>These services are proprietary and are not redistributed. Where a value carries the <Badge kind="fixture" /> chip it is a placeholder, not model output.</p>
      </section>

      <section className="fa-sec">
        <H id="si">Use of AI disclosure (draft)</H>
        <div className="fa-card fa-prose">
          <div className="fa-chips"><Badge kind="proposed" label="DRAFT, NOT SIGNED" hover="Edit to match what actually happened. The human team owns this text (decision D12)." /></div>
          <p><strong>SI use.</strong> Planning documents for this project were drafted with AI assistance before the team decided what to build. The code was written by AI coding agents (Claude, GPT and DeepSeek workers) working in separate branches and reviewed by the team. At runtime, deterministic code parses PSI tables, normalises units, checks quotes verbatim against the source text, computes condition overlap and the baseline ranking.</p>
          <p><strong>Gemini 4 Hydrogen</strong> proposed column maps and structured extracts from cited NASA papers, parses questions in Ask, and drafts explanations from accepted records only. <strong>Jev 1.14</strong> and <strong>Gemini decision-1</strong> supplied typed judgements under a published rubric. They are ordinal model outputs and are not probabilities that the science is true. <strong>ElevenLabs</strong> supplies an AI-generated voice for the audio overviews, disclosed in speech and in text. Stripe runs in test mode only.</p>
          <p className="fa-flag" role="note"><strong>[PLACEHOLDER, written by the human team (decision D12):</strong> what the team decided, wrote, checked and verified, in its own words. This must name the people and what each did. AI may not originate the idea, so the team states here that it chose the project, the user, the scenarios, the ranking priorities, the corpus and every accepted record.<strong>]</strong></p>
          <p>This disclosure covers planning, code, data extraction, judgements and audio. This is not safety guidance.</p>
        </div>
      </section>

      <Banner tone="flag"><strong>NASA does not endorse this project.</strong> No NASA insignia, worm, seal, flag or mission patch is used. Data credit is text only.</Banner>
    </Shell>
  );
}
