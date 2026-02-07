# Security Policy

## Supported Versions

We actively maintain and provide security updates for the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 2.x.x   | :white_check_mark: |
| 1.x.x   | :x:                |

## Reporting a Vulnerability

We take security vulnerabilities seriously. If you discover a security issue, please follow the responsible disclosure process outlined below.

### Reporting Channels

**IMPORTANT: Do not create public GitHub issues for security vulnerabilities.**

1. **GitHub Security Advisories (Preferred)**
   - Navigate to [Security Advisories](https://github.com/haotool/app/security/advisories)
   - Click "Report a vulnerability"
   - Fill in the detailed information

2. **Private Contact**
   - Email: haotool.org@gmail.com
   - Threads: [@azlife_1224](https://threads.net/@azlife_1224)

### Required Information

Please include the following in your report:

- **Vulnerability Type**: e.g., XSS, SQL Injection, CSRF, authentication bypass
- **Affected Versions**: Which versions are impacted
- **Reproduction Steps**: Detailed steps to reproduce the issue
- **Proof of Concept**: Code snippets or screenshots (optional)
- **Impact Assessment**: Potential security impact and affected components
- **Suggested Fix**: Your recommendations if available (optional)

### Report Template

```markdown
## Vulnerability Description

[Brief description of the vulnerability]

## Affected Versions

[e.g., 2.2.5 and earlier]

## Reproduction Steps

1. [Step 1]
2. [Step 2]
3. [Step 3]

## Potential Impact

- [Impact 1]
- [Impact 2]

## Suggested Fix

[Your recommendations if available]
```

## Response Timeline

- **Initial Response**: Within 24 hours of receipt
- **Severity Assessment**: Within 7 days
- **Fix Development Timeline**:
  - Critical: 24-48 hours
  - High: Within 7 days
  - Medium: Within 30 days
  - Low: Within 90 days or next release

## Security Measures

### Application Architecture

This monorepo contains three production applications built with security-first principles:

- **RateWise**: Currency exchange rate calculator
- **NihonName**: Japanese name generation tool
- **haotool**: Main portal application

Technology Stack:

- React 19 with built-in XSS protection
- TypeScript 5.9 with strict type checking
- Vite 7.3 for secure build pipeline
- 92%+ test coverage including security tests

### Layered Defense Architecture

**1. CDN/Edge Layer (Cloudflare)**

- Web Application Firewall (WAF)
- DDoS protection
- Rate limiting
- Security headers enforcement
- SSL/TLS termination

**2. Application Layer**

- Input validation and sanitization
- React's built-in XSS escaping
- Content Security Policy (CSP)
- Error boundary protection
- Secure coding standards (see CLAUDE.md)

**3. Container Layer**

- Non-root user execution (nodejs:1001)
- Multi-stage build for minimal attack surface
- Alpine Linux-based minimal images
- Read-only filesystem where possible

### Continuous Security Monitoring

**Automated Security Scanning**:

- Dependabot vulnerability alerts
- GitHub Advanced Security scanning
- Trivy container image scanning with SARIF reports
- SBOM (Software Bill of Materials) generation
- Daily dependency vulnerability checks

**CI/CD Security Gates**:

All changes must pass:

- `pnpm audit` with critical/high vulnerability blocking
- Dependency review for licensing and security
- Trivy filesystem and container image scanning
- TypeScript strict mode compilation
- 80%+ test coverage requirement

### Dependency Management

We use pnpm with strict version overrides to address known vulnerabilities. Current security overrides:

```json
{
  "pnpm": {
    "overrides": {
      "@isaacs/brace-expansion": ">=5.0.1",
      "lodash": ">=4.17.23",
      "lodash-es": ">=4.17.23",
      "undici": ">=7.18.2",
      "tmp": ">=0.2.4"
    }
  }
}
```

**Security Update Process**:

1. Dependabot creates automated PRs for vulnerabilities
2. CI validates security impact
3. Maintainers review and merge within SLA
4. CHANGELOG.md updated with security fixes
5. New version published

## Security Best Practices for Contributors

### Pre-Commit Security Checks

Before committing code, verify:

- [ ] No hardcoded secrets (API keys, passwords, tokens)
- [ ] All user inputs are validated
- [ ] SQL queries use parameterized statements
- [ ] HTML output is properly escaped
- [ ] Authentication and authorization verified
- [ ] Rate limiting implemented on API endpoints
- [ ] Error messages do not expose sensitive data
- [ ] Tests pass with 80%+ coverage

### Secret Management

**PROHIBITED**:

```typescript
// NEVER hardcode secrets
const apiKey = 'sk-proj-xxxxx';
const dbPassword = 'admin123';
```

**REQUIRED**:

```typescript
// ALWAYS use environment variables
const apiKey = process.env.OPENAI_API_KEY;

if (!apiKey) {
  throw new Error('OPENAI_API_KEY not configured');
}
```

### Input Validation

```typescript
// Use validation libraries
import { z } from 'zod';

const schema = z.object({
  email: z.string().email(),
  age: z.number().int().min(0).max(150),
});

const validated = schema.parse(userInput);
```

### Secure Coding Standards

Refer to CLAUDE.md for comprehensive security guidelines including:

- Immutability principles
- Error handling requirements
- Testing requirements (unit, integration, E2E)
- Code review process

## Known Security Considerations

### Client-Side Data Caching

- **Description**: Exchange rate data cached in localStorage
- **Risk Level**: Low
- **Rationale**: Data is public information from Taiwan Bank API
- **Mitigation**: 5-minute TTL, cache invalidation on errors

### Third-Party Data Sources

- **Description**: Depends on Taiwan Bank API and CDN
- **Risk Level**: Medium
- **Mitigation**: Input validation, error handling, fallback mechanisms

### CORS Policy

- **Description**: Cross-origin requests allowed for rate data
- **Risk Level**: Low
- **Rationale**: Read-only access to public data only

## Disclosure Policy

### Coordinated Disclosure

- Security vulnerabilities disclosed publicly only after fix is available
- 90-day disclosure timeline (may be extended by agreement)
- Credit given to security researchers who report responsibly
- CVE assignment for applicable vulnerabilities

### Security Advisories

Critical security issues published as GitHub Security Advisories including:

- CVE identifier (when applicable)
- CVSS severity rating
- Affected versions and components
- Mitigation steps and workarounds
- Patch availability and upgrade path

## Security Acknowledgments

We thank the following security researchers for responsible disclosure:

(None yet)

If you have reported a security vulnerability and would like to be listed here, please let us know.

## Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [React Security Best Practices](https://react.dev/learn)
- [Docker Security Best Practices](https://docs.docker.com/develop/security-best-practices/)
- [GitHub Security Best Practices](https://docs.github.com/en/code-security)
- [SECURITY_BASELINE.md](./docs/SECURITY_BASELINE.md) - Infrastructure security configuration

## Contact

- **Security Issues**: haotool.org@gmail.com
- **Maintainer**: haotool
- **Threads**: [@azlife_1224](https://threads.net/@azlife_1224)

---

**Last Updated**: 2026-02-07
**Version**: 2.2.5
**License**: GPL-3.0

Copyright (C) 2025 haotool. All rights reserved.
