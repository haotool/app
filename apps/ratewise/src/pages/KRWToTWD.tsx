import { CurrencyLandingPage } from '../components/CurrencyLandingPage';
import { getCurrencyLandingPageContent } from '../config/seo-metadata';

const content = getCurrencyLandingPageContent('KRW');

export default function KRWToTWD() {
  return <CurrencyLandingPage {...content} />;
}
