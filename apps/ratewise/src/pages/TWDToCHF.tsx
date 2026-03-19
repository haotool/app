import { CurrencyLandingPage } from '../components/CurrencyLandingPage';
import { getReverseCurrencyLandingPageContent } from '../config/seo-metadata';

const content = getReverseCurrencyLandingPageContent('CHF');

export default function TWDToCHF() {
  return <CurrencyLandingPage {...content} />;
}
