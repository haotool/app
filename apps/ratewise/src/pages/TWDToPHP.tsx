import { CurrencyLandingPage } from '../components/CurrencyLandingPage';
import { getReverseCurrencyLandingPageContent } from '../config/seo-metadata';

const content = getReverseCurrencyLandingPageContent('PHP');

export default function TWDToPHP() {
  return <CurrencyLandingPage {...content} />;
}
