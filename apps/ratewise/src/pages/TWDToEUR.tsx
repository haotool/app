import { CurrencyLandingPage } from '../components/CurrencyLandingPage';
import { getReverseCurrencyLandingPageContent } from '../config/seo-metadata';

const content = getReverseCurrencyLandingPageContent('EUR');

export default function TWDToEUR() {
  return <CurrencyLandingPage {...content} />;
}
