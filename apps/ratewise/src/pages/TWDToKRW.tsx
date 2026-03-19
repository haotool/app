import { CurrencyLandingPage } from '../components/CurrencyLandingPage';
import { getReverseCurrencyLandingPageContent } from '../config/seo-metadata';

const content = getReverseCurrencyLandingPageContent('KRW');

export default function TWDToKRW() {
  return <CurrencyLandingPage {...content} />;
}
