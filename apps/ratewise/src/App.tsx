import { ErrorBoundary } from './components/ErrorBoundary';
import CurrencyConverter from './features/ratewise/RateWise';

function App() {
  return (
    <ErrorBoundary>
      <CurrencyConverter />
    </ErrorBoundary>
  );
}

export default App;
