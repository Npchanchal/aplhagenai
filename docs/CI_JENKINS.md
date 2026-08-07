# CI/CD — Jenkins Pipeline

The repo root `Jenkinsfile` is a declarative pipeline that mirrors the local
verification gate. One rule: **CI runs exactly what an analyst-dev runs
locally** via `scripts/ci-verify.sh` — no CI-only test logic.

## Pipeline stages

| Stage | What it runs | Fails when |
|---|---|---|
| Backend tests | `pytest` over `backend/tests` with `--junitxml=reports/pytest.xml` | Any unit/functional/gap test fails |
| Frontend test + build | `npm ci && npm test && npm run build` in `frontend/` | Vitest failure or TypeScript build error |
| Compose up + E2E | `docker compose up --build -d`, wait for `/health`, Playwright against `:8080` | Health never turns ok, or an E2E spec fails |
| Package images | `docker build` for `intellens-api` / `intellens-web`, tagged with short SHA + `latest` | Image build error |
| Deploy to AWS | `scripts/aws-deploy.sh` (Terraform + ECR push + ECS redeploy) | Deploy script exit ≠ 0 |

Compose is always torn down (`docker compose down -v`) in the stage `post`
block, so a failed E2E run does not leave ports 8000/8080 occupied.

Test results are published from `backend/reports/pytest.xml` and
`e2e/reports/junit.xml` (the Playwright JUnit reporter is enabled whenever
`CI=true` — see `e2e/playwright.config.ts`). The frontend `dist/` is archived
as a build artifact.

## Deploy gating

- The deploy stage only exists on the `main` branch (`when { branch 'main' }`).
- It is guarded by a manual `input` step — a human clicks **Deploy** in the
  Jenkins UI. Every other stage is fully automatic on every branch/PR build.

## Agent prerequisites

The Jenkins agent (or the container it runs builds in) needs:

- Docker Engine with compose v2 (`docker compose`, not `docker-compose`)
- Node.js 20+ and npm (frontend build, Playwright)
- Python 3.12+ with pip (backend + pytest)
- `curl`, `git`
- For the deploy stage only: Terraform ≥ 1.5 and the AWS CLI v2

Playwright downloads its own Chromium (`npx playwright install chromium`);
on a fresh Linux agent you may need the system deps once:
`npx playwright install-deps chromium`.

## Credentials

| Jenkins credential id | Type | Used by |
|---|---|---|
| `aws-intellens` | AWS access key pair (AmazonWebServicesCredentialsBinding) | Deploy stage → `scripts/aws-deploy.sh` (Terraform, ECR, ECS in `ap-south-1`) |

No other secrets are required — tests run against seed/demo data with the
built-in demo API key.

## Job setup (multibranch, recommended)

1. Install plugins: *Pipeline*, *Git*, *JUnit*, *AWS Credentials*,
   *Timestamper*.
2. New Item → **Multibranch Pipeline** → point the branch source at this repo.
3. Build configuration: *by Jenkinsfile*, script path `Jenkinsfile` (default).
4. Add the `aws-intellens` credential (only needed if you want the deploy
   stage to work; other stages run without it).
5. Optional: webhook from your Git host so pushes trigger builds immediately.

## Local parity

```bash
# Reproduce the CI gate locally, including JUnit reports and teardown:
CI=true ./scripts/ci-verify.sh
```

`scripts/verify-all.sh` remains the developer-friendly variant (leaves the
compose stack running and prints the UI/API URLs at the end).

## Related docs

- [AWS deployment](AWS_DEPLOYMENT.md) — what `aws-deploy.sh` provisions
- [Product definition](PRODUCT_DEFINITION.md) — success metrics the gate protects
