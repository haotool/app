import { CurrencyLandingPage } from '../components/CurrencyLandingPage';
import { getCurrencyLandingPageContent } from '../config/seo-metadata';

const content = getCurrencyLandingPageContent('NZD');

export default function NZDToTWD() {
  return <CurrencyLandingPage {...content} />;
}
