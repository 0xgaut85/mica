import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me'

export function signToken(walletAddress, chain) {
  return jwt.sign({ sub: walletAddress, chain }, JWT_SECRET, { expiresIn: '7d' })
}

export function requireAuth(req, res, next) {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing auth token' })
  }
  try {
    const payload = jwt.verify(header.slice(7), JWT_SECRET)
    req.wallet = payload.sub
    req.chain = payload.chain
    next()
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' })
  }
}
