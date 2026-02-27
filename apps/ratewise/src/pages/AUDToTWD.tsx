import { CurrencyLandingPage } from '../components/CurrencyLandingPage';
import { getCurrencyLandingPageContent } from '../config/seo-metadata';

const content = getCurrencyLandingPageContent('AUD');

export default function AUDToTWD() {
  return <CurrencyLandingPage {...content} />;
}
