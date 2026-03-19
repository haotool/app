import { CurrencyLandingPage } from '../components/CurrencyLandingPage';
import { getReverseCurrencyLandingPageContent } from '../config/seo-metadata';

const content = getReverseCurrencyLandingPageContent('GBP');

export default function TWDToGBP() {
  return <CurrencyLandingPage {...content} />;
}
