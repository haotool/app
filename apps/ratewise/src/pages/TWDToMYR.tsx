import { CurrencyLandingPage } from '../components/CurrencyLandingPage';
import { getReverseCurrencyLandingPageContent } from '../config/seo-metadata';

const content = getReverseCurrencyLandingPageContent('MYR');

export default function TWDToMYR() {
  return <CurrencyLandingPage {...content} />;
}
