import { CurrencyLandingPage } from '../components/CurrencyLandingPage';
import { getReverseCurrencyLandingPageContent } from '../config/seo-metadata';

const content = getReverseCurrencyLandingPageContent('VND');

export default function TWDToVND() {
  return <CurrencyLandingPage {...content} />;
}
