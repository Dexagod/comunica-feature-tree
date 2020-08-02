import { NameSpaces } from './NameSpaces';
export function compareURLs(url1: string, url2: string) {
  return cleanURL(url1) === cleanURL(url2);
}

/**
 * Helper function to clean starting http:// | https:// | http://www. | https://www.
 * @param {string} url 
 * @param {any} subject
 * @param {any} predicate
 * @param {any} value
 */
export function cleanURL(url: string) {
  return url.replace(/^http(s)*:\/\/(www\.)*/, '') || url;
}
