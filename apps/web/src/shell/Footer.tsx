import { Link } from 'react-router-dom';

/** Credit, non-endorsement, SI disclosure (SPEC §3.1 item 6, §21). Text only: no NASA logos. */
export function Footer() {
  return (
    <footer className="border-t border-hairline">
      <div className="mx-auto flex max-w-[1200px] flex-col gap-3 px-4 py-6 text-sm text-muted md:flex-row md:items-start md:justify-between">
        <p className="max-w-[60ch]">Test data from the NASA Physical Sciences Informatics archive (CC0-1.0). NASA does not endorse this project. Built with AI coding agents and AI models; see the disclosure on the credits page.</p>
        <nav aria-label="Footer" className="flex flex-wrap gap-x-5 gap-y-1">
          <Link to="/method">Method and limits</Link><Link to="/credits">Credits</Link><Link to="/about">About</Link><Link to="/pricing">Pricing</Link>
        </nav>
      </div>
    </footer>
  );
}
