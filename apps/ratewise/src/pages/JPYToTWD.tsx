import { CurrencyLandingPage } from '../components/CurrencyLandingPage';
import { getCurrencyLandingPageContent } from '../config/seo-metadata';

const content = getCurrencyLandingPageContent('JPY');

export default function JPYToTWD() {
  return <CurrencyLandingPage {...content} />;
}
