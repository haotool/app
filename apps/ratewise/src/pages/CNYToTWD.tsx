import { CurrencyLandingPage } from '../components/CurrencyLandingPage';
import { getCurrencyLandingPageContent } from '../config/seo-metadata';

const content = getCurrencyLandingPageContent('CNY');

export default function CNYToTWD() {
  return <CurrencyLandingPage {...content} />;
}
