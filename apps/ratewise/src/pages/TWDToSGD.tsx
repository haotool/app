import { CurrencyLandingPage } from '../components/CurrencyLandingPage';
import { getReverseCurrencyLandingPageContent } from '../config/seo-metadata';

const content = getReverseCurrencyLandingPageContent('SGD');

export default function TWDToSGD() {
  return <CurrencyLandingPage {...content} />;
}
