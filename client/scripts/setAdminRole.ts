/**
 * One-time bootstrap script: promote a Clerk user to the 'admin' role.
 *
 * Usage:
 *   npx tsx scripts/setAdminRole.ts <clerk_user_id>
 *
 * Example:
 *   npx tsx scripts/setAdminRole.ts user_2abc123XYZ
 *
 * Prerequisites:
 *   - CLERK_SECRET_KEY must be set in your .env.local (or exported in the shell).
 *   - Run from the client/ directory.
 */

import 'dotenv/config';
import { createClerkClient } from '@clerk/backend';

const userId = process.argv[2];

if (!userId) {
  console.error(`
╔══════════════════════════════════════════════════════════════╗
║              Blueprint.ai — Set Admin Role                   ║
╠══════════════════════════════════════════════════════════════╣
║  Usage:   npx tsx scripts/setAdminRole.ts <clerk_user_id>   ║
║                                                              ║
║  Example: npx tsx scripts/setAdminRole.ts user_2abc123XYZ   ║
║                                                              ║
║  You can find your Clerk user ID in:                         ║
║    • Clerk Dashboard → Users → click your user               ║
║    • Or from the browser: run console.log((await             ║
║        (await import('@clerk/nextjs')).auth()).userId)        ║
╚══════════════════════════════════════════════════════════════╝
`);
  process.exit(1);
}

const secretKey = process.env.CLERK_SECRET_KEY;
if (!secretKey) {
  console.error(
    '✗ CLERK_SECRET_KEY is not set. Add it to .env.local or export it in your shell before running this script.',
  );
  process.exit(1);
}

async function main() {
  const clerk = createClerkClient({ secretKey });

  console.log(`\n→ Fetching user ${userId}…`);
  const user = await clerk.users.getUser(userId);
  const name =
    [user.firstName, user.lastName].filter(Boolean).join(' ') ||
    user.emailAddresses[0]?.emailAddress ||
    userId;

  const currentRole = (user.publicMetadata as Record<string, unknown>)?.role ?? '(unset)';
  console.log(`  Found: ${name}`);
  console.log(`  Current role: ${currentRole}`);

  console.log(`\n→ Setting publicMetadata.role = "admin"…`);
  await clerk.users.updateUserMetadata(userId, {
    publicMetadata: { role: 'admin' },
  });

  console.log(`\n✓ Success! "${name}" is now an admin.\n`);
  console.log('  They will need to sign out and sign back in for the role to');
  console.log('  take effect in any active browser sessions.\n');
}

main().catch((err: unknown) => {
  const msg = err instanceof Error ? err.message : String(err);
  console.error(`\n✗ Failed to set admin role: ${msg}\n`);
  process.exit(1);
});
