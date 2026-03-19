import { CurrencyLandingPage } from '../components/CurrencyLandingPage';
import { getReverseCurrencyLandingPageContent } from '../config/seo-metadata';

const content = getReverseCurrencyLandingPageContent('JPY');

export default function TWDToJPY() {
  return <CurrencyLandingPage {...content} />;
}
