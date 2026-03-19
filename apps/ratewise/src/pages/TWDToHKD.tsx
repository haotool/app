import { CurrencyLandingPage } from '../components/CurrencyLandingPage';
import { getReverseCurrencyLandingPageContent } from '../config/seo-metadata';

const content = getReverseCurrencyLandingPageContent('HKD');

export default function TWDToHKD() {
  return <CurrencyLandingPage {...content} />;
}
