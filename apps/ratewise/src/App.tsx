import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ErrorBoundary } from './components/ErrorBoundary';
// import { ReloadPrompt } from './components/ReloadPrompt';
import CurrencyConverter from './features/ratewise/RateWise';

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <Routes>
          <Route path="/" element={<CurrencyConverter />} />
        </Routes>
      </Router>
      {/* <ReloadPrompt /> */}
      {/* TODO: Fix virtual:pwa-register resolution issue */}
    </ErrorBoundary>
  );
}

export default App;
