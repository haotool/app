import { CurrencyLandingPage } from '../components/CurrencyLandingPage';
import { getReverseCurrencyLandingPageContent } from '../config/seo-metadata';

const content = getReverseCurrencyLandingPageContent('USD');

export default function TWDToUSD() {
  return <CurrencyLandingPage {...content} />;
}
