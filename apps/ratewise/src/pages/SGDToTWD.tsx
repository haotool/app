import { CurrencyLandingPage } from '../components/CurrencyLandingPage';
import { getCurrencyLandingPageContent } from '../config/seo-metadata';

const content = getCurrencyLandingPageContent('SGD');

export default function SGDToTWD() {
  return <CurrencyLandingPage {...content} />;
}
