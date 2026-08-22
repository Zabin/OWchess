/**
 * Client entry point — scaffold only (IP-0010). No panel components yet;
 * those arrive with IP-8010.
 */
import { createRoot } from 'react-dom/client';

function App() {
  return <div>OW Chess — scaffold placeholder</div>;
}

const container = document.getElementById('root');
if (container) {
  createRoot(container).render(<App />);
}
