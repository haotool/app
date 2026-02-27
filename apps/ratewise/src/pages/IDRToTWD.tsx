import { CurrencyLandingPage } from '../components/CurrencyLandingPage';
import { getCurrencyLandingPageContent } from '../config/seo-metadata';

const content = getCurrencyLandingPageContent('IDR');

export default function IDRToTWD() {
  return <CurrencyLandingPage {...content} />;
}
