const interceptors = [];
let originalFetch;
let installed = false;

function install() {
  if (installed) return;
  originalFetch = global.fetch;
  global.fetch = async function mockedFetch(input, init = {}) {
    const url = typeof input === 'string' ? input : input.url;
    const method = (init.method || 'GET').toUpperCase();
    for (let i = 0; i < interceptors.length; i++) {
      const icp = interceptors[i];
      if (icp.used && !icp.persist) continue;
      if (icp.method !== method) continue;
      if (!icp.matchUrl(url)) continue;
      icp.used = true;
      return makeResponse(icp.status, icp.body);
    }
    const err = new Error(`No interceptor matched: ${method} ${url}`);
    err.code = 'NO_MOCK_MATCH';
    throw err;
  };
  installed = true;
}

function makeResponse(status, body) {
  const bodyStr = typeof body === 'string' ? body : JSON.stringify(body || {});
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: new Map(),
    async json() { return body; },
    async text() { return bodyStr; }
  };
}

function enableFetchMocking() {
  install();
  interceptors.length = 0;
}

function resetFetchMocks() {
  interceptors.length = 0;
}

function disableFetchMocking() {
  interceptors.length = 0;
  if (originalFetch) global.fetch = originalFetch;
  installed = false;
}

function mockPost(baseUrl, path, { status = 200, body = {}, persist = false } = {}) {
  install();
  const fullUrl = `${baseUrl}${path}`;
  interceptors.push({
    method: 'POST',
    status,
    body,
    persist,
    used: false,
    matchUrl: (u) => u === fullUrl
  });
}

function mockGet(baseUrl, path, { status = 200, body = {}, persist = false } = {}) {
  install();
  const fullUrl = `${baseUrl}${path}`;
  interceptors.push({
    method: 'GET',
    status,
    body,
    persist,
    used: false,
    matchUrl: (u) => u === fullUrl
  });
}

module.exports = {
  enableFetchMocking,
  resetFetchMocks,
  disableFetchMocking,
  mockPost,
  mockGet
};
