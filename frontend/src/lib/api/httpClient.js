/**
 * Thin fetch wrapper used by every feature's api module.
 * Features never call fetch() directly — endpoints live in src/features/<feature>/api/.
 */
import { API_BASE_URL } from '@/config/env';

export class ApiError extends Error {
  /**
   * @param {string} message      Human-readable message (from the backend when available)
   * @param {number} status       HTTP status, or 0 when the server could not be reached
   * @param {unknown} [responseBody]
   */
  constructor(message, status, responseBody) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.responseBody = responseBody;
  }
}

export const HTTP_STATUS = Object.freeze({
  CONFLICT: 409,
});

function parseResponseText(responseText) {
  if (!responseText) return null;
  try {
    return JSON.parse(responseText);
  } catch {
    return responseText;
  }
}

function extractErrorMessage(responseBody, status) {
  const backendMessage =
    responseBody && (responseBody.message || responseBody.error?.message || responseBody.error);
  if (!backendMessage) return `Request failed (${status})`;
  return typeof backendMessage === 'string' ? backendMessage : JSON.stringify(backendMessage);
}

/** Accepts both raw payloads and `{ data: ... }` envelopes. */
function unwrapEnvelope(responseBody) {
  const isEnvelope =
    responseBody !== null &&
    typeof responseBody === 'object' &&
    !Array.isArray(responseBody) &&
    'data' in responseBody;
  return isEnvelope ? responseBody.data : responseBody;
}

async function sendRequest(httpMethod, path, requestBody) {
  const hasRequestBody = requestBody !== undefined;
  let response;
  try {
    response = await fetch(API_BASE_URL + path, {
      method: httpMethod,
      headers: hasRequestBody ? { 'Content-Type': 'application/json' } : undefined,
      body: hasRequestBody ? JSON.stringify(requestBody) : undefined,
    });
  } catch {
    throw new ApiError(`Cannot reach the API at ${API_BASE_URL}. Is the backend running?`, 0);
  }

  const responseBody = parseResponseText(await response.text());
  if (!response.ok) {
    throw new ApiError(extractErrorMessage(responseBody, response.status), response.status, responseBody);
  }
  return unwrapEnvelope(responseBody);
}

export const httpGet = (path) => sendRequest('GET', path);
export const httpPost = (path, requestBody = {}) => sendRequest('POST', path, requestBody);
export const httpPatch = (path, requestBody = {}) => sendRequest('PATCH', path, requestBody);

/** Builds `?a=1&b=2`, skipping empty values. Returns '' when nothing is left. */
export function buildQueryString(queryParams) {
  const definedEntries = Object.entries(queryParams).filter(
    ([, paramValue]) => paramValue !== '' && paramValue != null,
  );
  const queryString = new URLSearchParams(definedEntries).toString();
  return queryString ? `?${queryString}` : '';
}
