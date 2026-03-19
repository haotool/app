import { CurrencyLandingPage } from '../components/CurrencyLandingPage';
import { getReverseCurrencyLandingPageContent } from '../config/seo-metadata';

const content = getReverseCurrencyLandingPageContent('AUD');

export default function TWDToAUD() {
  return <CurrencyLandingPage {...content} />;
}
