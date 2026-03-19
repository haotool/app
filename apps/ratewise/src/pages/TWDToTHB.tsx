import { CurrencyLandingPage } from '../components/CurrencyLandingPage';
import { getReverseCurrencyLandingPageContent } from '../config/seo-metadata';

const content = getReverseCurrencyLandingPageContent('THB');

export default function TWDToTHB() {
  return <CurrencyLandingPage {...content} />;
}
