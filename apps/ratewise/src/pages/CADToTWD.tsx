import { CurrencyLandingPage } from '../components/CurrencyLandingPage';
import { getCurrencyLandingPageContent } from '../config/seo-metadata';

const content = getCurrencyLandingPageContent('CAD');

export default function CADToTWD() {
  return <CurrencyLandingPage {...content} />;
}
