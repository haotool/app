import { CurrencyLandingPage } from '../components/CurrencyLandingPage';
import { getCurrencyLandingPageContent } from '../config/seo-metadata';

const content = getCurrencyLandingPageContent('EUR');

export default function EURToTWD() {
  return <CurrencyLandingPage {...content} />;
}
