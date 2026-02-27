import { CurrencyLandingPage } from '../components/CurrencyLandingPage';
import { getCurrencyLandingPageContent } from '../config/seo-metadata';

const content = getCurrencyLandingPageContent('CHF');

export default function CHFToTWD() {
  return <CurrencyLandingPage {...content} />;
}
