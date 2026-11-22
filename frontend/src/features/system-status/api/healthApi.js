import { httpGet } from '@/lib/api/httpClient';

/** Backend liveness check (backend/src/modules/health). Throws ApiError when unreachable. */
export const fetchApiHealth = () => httpGet('/health');
