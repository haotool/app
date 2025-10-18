import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ErrorBoundary } from './components/ErrorBoundary';
import { SEOHelmet } from './components/SEOHelmet';
import CurrencyConverter from './features/ratewise/RateWise';

// PWA 自動更新由 vite-plugin-pwa 處理（registerType: 'autoUpdate'）

function App() {
  return (
    <ErrorBoundary>
      <SEOHelmet />
      <Router>
        <Routes>
          <Route path="/" element={<CurrencyConverter />} />
        </Routes>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
