import { CurrencyLandingPage } from '../components/CurrencyLandingPage';
import { getCurrencyLandingPageContent } from '../config/seo-metadata';

const content = getCurrencyLandingPageContent('MYR');

export default function MYRToTWD() {
  return <CurrencyLandingPage {...content} />;
}
