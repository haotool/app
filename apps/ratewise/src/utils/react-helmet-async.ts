/**
 * Local facade for react-helmet-async compatibility.
 *
 * 目的：保留既有匯入路徑，實際實作由 Vite alias 導向 React 19-safe shim。
 */

import * as HelmetAsync from 'react-helmet-async';

export const Helmet = HelmetAsync.Helmet;
export const HelmetProvider = HelmetAsync.HelmetProvider;
export const HelmetData = HelmetAsync.HelmetData;

export default HelmetAsync;
