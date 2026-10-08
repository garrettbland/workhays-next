#!/usr/bin/env bash
# Applies all migrations to a throwaway plain-Postgres database (with a Supabase stand-in)
# and runs the pgTAP tests. Needs psql + the pgtap extension installed in that Postgres.
#   TEST_DATABASE_URL=postgres://postgres:postgres@localhost:5432/postgres ./scripts/db-test-local.sh
# With the Supabase CLI and Docker you can instead run: npx supabase test db
set -euo pipefail
: "${TEST_DATABASE_URL:?set TEST_DATABASE_URL}"
DB="workhays_test_$$"
psql "$TEST_DATABASE_URL" -qc "create database $DB"
trap 'psql "$TEST_DATABASE_URL" -qc "drop database if exists $DB"' EXIT
URL="${TEST_DATABASE_URL%/*}/$DB"
cat supabase/tests/_supabase_stub.sql supabase/migrations/*.sql | psql "$URL" -q -v ON_ERROR_STOP=1 >/dev/null
for f in supabase/tests/database/*.test.sql; do
  out=$(psql "$URL" -q -t -A -f "$f" 2>&1)
  echo "$out" | grep -E "^(ok|not ok)" | sed 's/^/  /'
  if echo "$out" | grep -qE "^not ok|ERROR|Looks like"; then echo "$out" | grep -E "not ok|ERROR|Looks like"; exit 1; fi
done
echo "All database tests passed."
