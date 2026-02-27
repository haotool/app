import { CurrencyLandingPage } from '../components/CurrencyLandingPage';
import { getCurrencyLandingPageContent } from '../config/seo-metadata';

const content = getCurrencyLandingPageContent('HKD');

export default function HKDToTWD() {
  return <CurrencyLandingPage {...content} />;
}
