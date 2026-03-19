import { CurrencyLandingPage } from '../components/CurrencyLandingPage';
import { getReverseCurrencyLandingPageContent } from '../config/seo-metadata';

const content = getReverseCurrencyLandingPageContent('CAD');

export default function TWDToCAD() {
  return <CurrencyLandingPage {...content} />;
}
