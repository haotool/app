import { CurrencyLandingPage } from '../components/CurrencyLandingPage';
import { getCurrencyLandingPageContent } from '../config/seo-metadata';

const content = getCurrencyLandingPageContent('GBP');

export default function GBPToTWD() {
  return <CurrencyLandingPage {...content} />;
}
