import React from 'react';
  
  const RenderKeepAlive = () =>  {
	return (
	  <div>
	  </div>
	);
  }
  
  export default RenderKeepAlive;
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export function attachRenderRetry(client, maxRetries = 4) {
  client.interceptors.response.use(
    (response) => response,
    async (error) => {
      const config = error.config;
      if (!config) return Promise.reject(error);

      const retryCount = config.__renderRetryCount || 0;
      if (retryCount >= maxRetries) return Promise.reject(error);

      const status = error.response?.status;
      const shouldRetry =
        !error.response ||
        status === 502 ||
        status === 503 ||
        status === 504 ||
        error.code === "ECONNABORTED" ||
        error.message === "Network Error";

      if (!shouldRetry) return Promise.reject(error);

      config.__renderRetryCount = retryCount + 1;
      await sleep(2500 * config.__renderRetryCount);
      return client(config);
    }
  );
}

export function wakeRenderServer() {
  const base = (import.meta.env.VITE_API_URL || "").replace(/\/+$/, "");
  if (!base) return;

  fetch(`${base}/api/health`, {
    method: "GET",
    cache: "no-store",
    keepalive: true,
  }).catch(() => {});
}
