import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

function loadEnv() {
  const raw = readFileSync(resolve(process.cwd(), '.env.local'), 'utf8')
  const env = {}

  for (const line of raw.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const index = trimmed.indexOf('=')
    if (index <= 0) continue
    env[trimmed.slice(0, index)] = trimmed.slice(index + 1)
  }

  return env
}

function reportStep(label, payload) {
  console.log(`\n=== ${label} ===`)
  console.log(JSON.stringify(payload, null, 2))
}

const env = loadEnv()
const url = env.VITE_SUPABASE_URL
const anonKey = env.VITE_SUPABASE_ANON_KEY
const loginOnly = process.argv.includes('--login-only')
const loginEmail = process.env.AUTH_TEST_EMAIL ?? process.argv[2]
const loginPassword = process.env.AUTH_TEST_PASSWORD ?? process.argv[3]

if (!url || !anonKey) {
  console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient(url, anonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
})

async function testSignIn(email, password, label) {
  const signIn = await supabase.auth.signInWithPassword({ email, password })

  reportStep(label, {
    error: signIn.error
      ? { message: signIn.error.message, status: signIn.error.status, name: signIn.error.name }
      : null,
    userId: signIn.data.user?.id ?? null,
    emailConfirmedAt: signIn.data.user?.email_confirmed_at ?? null,
    hasSession: Boolean(signIn.data.session),
  })

  return signIn
}

async function main() {
  if (loginOnly) {
    if (!loginEmail || !loginPassword) {
      console.error('Usage: AUTH_TEST_EMAIL=... AUTH_TEST_PASSWORD=... node scripts/test-auth-signup-login.mjs --login-only')
      console.error('   or: node scripts/test-auth-signup-login.mjs --login-only email@example.com password')
      process.exit(1)
    }

    const signIn = await testSignIn(loginEmail.trim().toLowerCase(), loginPassword, 'login-only signIn')

    if (signIn.error) {
      reportStep('Result', {
        ok: false,
        reason: signIn.error.message,
        hint:
          signIn.error.message.toLowerCase().includes('email not confirmed')
            ? 'auth.users.email_confirmed_at is NULL. Confirm the user in Supabase Dashboard or run the SQL in supabase/customer-auth-setup.sql'
            : 'Check credentials or rate limit cooldown',
      })
      process.exit(3)
    }

    reportStep('Result', { ok: true, message: 'Login succeeded', email: loginEmail })
    return
  }

  const stamp = Date.now()
  const testEmail = `twotwoshop.test+${stamp}@example.com`
  const testPassword = `TestPass${stamp.toString().slice(-4)}`

  reportStep('Test account', { email: testEmail, password: testPassword })

  const signUp = await supabase.auth.signUp({
    email: testEmail,
    password: testPassword,
    options: {
      data: {
        display_name: '테스트유저',
        phone: '01012345678',
        marketing_consent: false,
      },
    },
  })

  reportStep('signUp response', {
    error: signUp.error
      ? { message: signUp.error.message, status: signUp.error.status, name: signUp.error.name }
      : null,
    userId: signUp.data.user?.id ?? null,
    emailConfirmedAt: signUp.data.user?.email_confirmed_at ?? null,
    hasSession: Boolean(signUp.data.session),
  })

  if (signUp.error) {
    reportStep('Result', {
      ok: false,
      reason: signUp.error.message,
      hint:
        signUp.error.status === 429
          ? 'Wait for cooldown, then retry or use --login-only with an existing account'
          : 'See error above',
    })
    process.exit(1)
  }

  if (!signUp.data.session) {
    reportStep('Result', {
      ok: false,
      reason: 'signUp succeeded but no session returned',
      hint: 'Confirm email may still be ON in Supabase Dashboard',
    })
    process.exit(2)
  }

  await supabase.auth.signOut()

  const signIn = await testSignIn(testEmail, testPassword, 'post-signup signIn')

  if (signIn.error) {
    reportStep('Result', {
      ok: false,
      reason: signIn.error.message,
      testEmail,
      testPassword,
    })
    process.exit(3)
  }

  reportStep('Result', {
    ok: true,
    message: 'Confirm email OFF flow works: signup session + login succeeded',
    testEmail,
    testPassword,
  })
}

main().catch((error) => {
  console.error('Unexpected error:', error)
  process.exit(99)
})
