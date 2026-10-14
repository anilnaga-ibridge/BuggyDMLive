# BuggyDM environment secrets

BuggyDM reads local and deployed configuration from environment variables. The
populated `.env` file is intentionally ignored and must never be committed.
Start local setup by copying `.env.example` to `.env` and replacing every
placeholder through the approved secret-management channel.

## Required rotation

An earlier repository commit tracked a populated `.env` file. Treat its
database password and session secret as exposed wherever that Git repository
has been copied or shared.

1. Rotate the database credential and update each authorized environment.
2. Generate a new high-entropy `SESSION_SECRET`; existing sessions may be
   invalidated as part of the rotation.
3. Verify the Redis endpoint is private and authenticated where applicable.
4. Store production values in the deployment platform's encrypted secret
   store, not in source control or build artifacts.
5. Run `npm run security:check` before every release.

Rewriting shared Git history is a separate coordinated operation. Do not force
push a rewritten history until all collaborators and deployment systems have
been migrated to the replacement history.
