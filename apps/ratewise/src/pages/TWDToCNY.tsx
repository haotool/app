import { CurrencyLandingPage } from '../components/CurrencyLandingPage';
import { getReverseCurrencyLandingPageContent } from '../config/seo-metadata';

const content = getReverseCurrencyLandingPageContent('CNY');

export default function TWDToCNY() {
  return <CurrencyLandingPage {...content} />;
}
