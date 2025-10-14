import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ErrorBoundary } from './components/ErrorBoundary';
import CurrencyConverter from './features/ratewise/RateWise';

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <Routes>
          <Route path="/" element={<CurrencyConverter />} />
        </Routes>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
