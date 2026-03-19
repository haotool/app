import { CurrencyLandingPage } from '../components/CurrencyLandingPage';
import { getReverseCurrencyLandingPageContent } from '../config/seo-metadata';

const content = getReverseCurrencyLandingPageContent('NZD');

export default function TWDToNZD() {
  return <CurrencyLandingPage {...content} />;
}
