import { CurrencyLandingPage } from '../components/CurrencyLandingPage';
import { getReverseCurrencyLandingPageContent } from '../config/seo-metadata';

const content = getReverseCurrencyLandingPageContent('IDR');

export default function TWDToIDR() {
  return <CurrencyLandingPage {...content} />;
}
