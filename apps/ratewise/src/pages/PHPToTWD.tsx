import { CurrencyLandingPage } from '../components/CurrencyLandingPage';
import { getCurrencyLandingPageContent } from '../config/seo-metadata';

const content = getCurrencyLandingPageContent('PHP');

export default function PHPToTWD() {
  return <CurrencyLandingPage {...content} />;
}
