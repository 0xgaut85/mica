const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

let _token = sessionStorage.getItem('mica_token')

export function setToken(token) {
  _token = token
  if (token) sessionStorage.setItem('mica_token', token)
  else sessionStorage.removeItem('mica_token')
}

export function getToken() {
  return _token
}

async function request(path, opts = {}) {
  const headers = { ...opts.headers }
  if (_token) headers.Authorization = `Bearer ${_token}`
  if (opts.body && !(opts.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json'
    opts.body = JSON.stringify(opts.body)
  }
  const res = await fetch(`${API_BASE}${path}`, { ...opts, headers })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(err.error || 'Request failed')
  }
  return res.json()
}

export const api = {
  getNonce: () => request('/auth/nonce', { method: 'POST' }),
  verifyEvm: (message, signature) => request('/auth/verify/evm', { method: 'POST', body: { message, signature } }),
  verifySolana: (publicKey, signature, message) =>
    request('/auth/verify/solana', { method: 'POST', body: { publicKey, signature, message } }),

  getProfile: () => request('/profile'),
  updateProfile: (data) => request('/profile', { method: 'PATCH', body: data }),

  getSubscription: () => request('/subscription'),
  verifyTx: (plan, asset, txHash) => request('/subscription/verify-tx', { method: 'POST', body: { plan, asset, txHash } }),

  getKeys: () => request('/keys'),
  createKey: () => request('/keys', { method: 'POST' }),
  revokeKey: (id) => request(`/keys/${id}`, { method: 'DELETE' }),

  getMvmNode: () => request('/mvm-nodes'),
  registerMvmNode: (data) => request('/mvm-nodes', { method: 'POST', body: data }),
  disconnectMvmNode: (id) => request(`/mvm-nodes/${id}`, { method: 'DELETE' }),
}
