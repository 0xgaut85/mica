/** Tailored legal copy for mica landing (not a substitute for counsel). */

export const TERMS_TITLE = 'Terms of Service'
export const PRIVACY_TITLE = 'Privacy Policy'
export const CONDITIONS_TITLE = 'Acceptable use & conditions'

export const TERMS_BODY = `
Last updated: March 2026

1. Agreement
By accessing or using mica’s website, APIs, or related services (collectively, the “Services”), you agree to these Terms. If you do not agree, do not use the Services.

2. The Services
mica provides infrastructure and software for distributed, energy-aware AI training and related APIs. Features, availability, and pricing may change. We may suspend or discontinue any part of the Services with reasonable notice where practicable.

3. Accounts and API use
You are responsible for credentials, API keys, and activity under your account. You must comply with applicable laws, not misuse the Services (including attempting to bypass limits, probe vulnerabilities without authorization, or overload systems), and not submit unlawful or infringing content.

4. Your data and models
You retain rights to your models, datasets, and outputs you submit, subject to the license you grant us as needed to operate the Services (e.g. processing, storage, and improvement of reliability). You represent that you have the rights to submit such content.

5. Energy and scheduling
Energy budgets, routing, and scheduling are provided on a best-effort basis. Results (including energy reports and metrics) are informational and not guarantees of specific savings or performance.

6. Disclaimers
THE SERVICES ARE PROVIDED “AS IS” WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.

7. Limitation of liability
TO THE MAXIMUM EXTENT PERMITTED BY LAW, MICA AND ITS AFFILIATES WILL NOT BE LIABLE FOR INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR EXEMPLARY DAMAGES, OR ANY LOSS OF PROFITS, DATA, OR GOODWILL.

8. Changes
We may update these Terms. Continued use after changes constitutes acceptance of the revised Terms.

9. Contact
For questions about these Terms, contact us through the channels listed on this site.
`.trim()

export const PRIVACY_BODY = `
Last updated: March 2026

1. Who we are
This policy describes how mica (“we”, “us”) handles information when you use our website and Services related to distributed AI training infrastructure.

2. Information we collect
• Account and contact data you provide (e.g. email, organization).
• Technical data (e.g. IP address, device/browser type, logs) for security and operations.
• Usage and API data necessary to run training jobs, billing, and energy reporting.
• Content you submit (e.g. model configs, datasets) as required to perform the Services.

3. How we use information
We use data to provide and improve the Services, secure our systems, comply with law, communicate with you, and analyze aggregate usage (including energy and performance metrics).

4. Sharing
We do not sell your personal information. We may share data with subprocessors (e.g. hosting, analytics) under contracts, or when required by law. Aggregated or de-identified data may be used for research and product improvement.

5. Retention
We retain information as long as needed for the purposes above, unless a longer period is required by law.

6. Security
We implement appropriate technical and organizational measures; no method of transmission or storage is 100% secure.

7. Your rights
Depending on your location, you may have rights to access, correct, delete, or restrict processing of your personal data, or to object to certain processing. Contact us to exercise these rights.

8. International transfers
If you are outside the country where we operate, data may be processed in other jurisdictions with appropriate safeguards where required.

9. Children
Our Services are not directed at children under 16.

10. Changes
We may update this policy. We will post the revised version and update the “Last updated” date.

11. Contact
For privacy requests, contact us through the channels listed on this site.
`.trim()

export const CONDITIONS_BODY = `
Last updated: March 2026

1. Purpose
These conditions supplement our Terms of Service and describe rules for using mica’s website, documentation, and APIs in a fair, lawful way.

2. Acceptable use
You may not: (a) probe, scan, or test vulnerabilities without authorization; (b) overload, disrupt, or attempt to gain unauthorized access to our systems or other users’ data; (c) use the Services to train or deploy models for illegal, deceptive, or harmful purposes; (d) circumvent energy budgets, rate limits, or technical restrictions; (e) misrepresent affiliation with mica or resell access in breach of our Terms.

3. Content you submit
You are responsible for ensuring datasets, prompts, and checkpoints comply with law and third-party rights. We may suspend use that creates legal or security risk.

4. API & trial use
Beta or preview features may change or end without notice. Abuse of free tiers or promotional access may result in termination.

5. Enforcement
We may investigate violations and suspend or terminate access. Nothing here limits remedies available under the Terms of Service or applicable law.

6. Contact
Questions about these conditions: use the contact options published on this site.
`.trim()

export const LEGAL_DOCUMENTS = {
  terms: { title: TERMS_TITLE, body: TERMS_BODY },
  privacy: { title: PRIVACY_TITLE, body: PRIVACY_BODY },
  conditions: { title: CONDITIONS_TITLE, body: CONDITIONS_BODY },
}
