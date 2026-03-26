import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import authRouter from './routes/auth.js'
import profileRouter from './routes/profile.js'
import subscriptionRouter from './routes/subscription.js'
import apiKeysRouter from './routes/apikeys.js'

const app = express()
const PORT = process.env.PORT || 3001

app.use(helmet())
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }))
app.use(express.json())

app.use('/api/auth', authRouter)
app.use('/api/profile', profileRouter)
app.use('/api/subscription', subscriptionRouter)
app.use('/api/keys', apiKeysRouter)

app.get('/api/health', (_req, res) => res.json({ ok: true }))

app.use((err, _req, res, _next) => {
  console.error(err)
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' })
})

app.listen(PORT, () => console.log(`mica-api listening on :${PORT}`))
