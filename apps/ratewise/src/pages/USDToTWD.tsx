import { CurrencyLandingPage } from '../components/CurrencyLandingPage';
import { getCurrencyLandingPageContent } from '../config/seo-metadata';

const content = getCurrencyLandingPageContent('USD');

export default function USDToTWD() {
  return <CurrencyLandingPage {...content} />;
}
