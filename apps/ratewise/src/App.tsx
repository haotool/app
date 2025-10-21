import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ErrorBoundary } from './components/ErrorBoundary';
import { SEOHelmet } from './components/SEOHelmet';
import { UpdatePrompt } from './components/UpdatePrompt';
import CurrencyConverter from './features/ratewise/RateWise';
import FAQ from './pages/FAQ';
import About from './pages/About';

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
      {/* PWA 更新通知 - 液態玻璃效果 + 微動畫 */}
      <UpdatePrompt />
    </ErrorBoundary>
  );
}

export default App;
