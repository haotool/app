import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ErrorBoundary } from './components/ErrorBoundary';
import { SEOHelmet } from './components/SEOHelmet';
import CurrencyConverter from './features/ratewise/RateWise';
import FAQ from './pages/FAQ';
import About from './pages/About';

// PWA 自動更新由 vite-plugin-pwa 處理（registerType: 'autoUpdate'）

function App() {
  return (
    <ErrorBoundary>
      <SEOHelmet />
      <Router basename="/ratewise">
        <Routes>
          <Route path="/" element={<CurrencyConverter />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/about" element={<About />} />
        </Routes>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
