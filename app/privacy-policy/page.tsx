import React from "react";

export default function PrivacyPolicyPage() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-12 text-base text-foreground">
      <h1 className="text-3xl font-bold mb-2">Silhouette AI – Privacy Policy</h1>
      <div className="text-sm text-muted-foreground mb-6">
        <span>Effective Date: 25 June 2025</span>
        <span className="mx-2">|</span>
        <span>Last updated: 25 June 2025</span>
      </div>
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2">1. Who we are</h2>
        <p>
          Silhouette AI (&ldquo;we&rdquo;, &ldquo;our&rdquo;, &ldquo;us&rdquo;) is developed and operated by Sultan Temuruly, sole proprietor.<br />
          Contact email: <a href="mailto:sultantemuruly@gmail.com" className="underline hover:text-primary">sultantemuruly@gmail.com</a>.
        </p>
      </section>
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2">2. What this policy covers</h2>
        <p>
          This policy explains how we collect, use, store and share information when you use the Silhouette AI web application available at <a href="https://www.silhai.com" className="underline hover:text-primary">https://www.silhai.com</a> (the &ldquo;Service&rdquo;).
        </p>
      </section>
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2">3. Information we collect</h2>
        <div className="overflow-x-auto mb-4">
          <table className="min-w-full border text-sm">
            <thead>
              <tr className="bg-muted">
                <th className="border px-2 py-1 text-left">Category</th>
                <th className="border px-2 py-1 text-left">Details</th>
                <th className="border px-2 py-1 text-left">Stored?</th>
                <th className="border px-2 py-1 text-left">Legal basis*</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border px-2 py-1">Account data</td>
                <td className="border px-2 py-1">• Email address<br/>• First & last name<br/>• Internal user IDs (id, clerk_id)<br/>• Account creation time</td>
                <td className="border px-2 py-1">Yes – in our encrypted PostgreSQL database</td>
                <td className="border px-2 py-1">Contract (we need it to provide the Service)</td>
              </tr>
              <tr>
                <td className="border px-2 py-1">Google OAuth tokens</td>
                <td className="border px-2 py-1">• access_token<br/>• refresh_token<br/>• expiry_date</td>
                <td className="border px-2 py-1">Yes – encrypted at rest</td>
                <td className="border px-2 py-1">Contract</td>
              </tr>
              <tr>
                <td className="border px-2 py-1">Gmail content</td>
                <td className="border px-2 py-1">Temporary, read-only access to messages via the scope <span className="break-all">https://www.googleapis.com/auth/gmail.readonly</span>. We do not store message bodies, attachments, metadata or headers on our servers. <b>We do not use your email content for analytics or tracking.</b></td>
                <td className="border px-2 py-1">No – kept only in RAM for the duration of the session</td>
                <td className="border px-2 py-1">Consent</td>
              </tr>
              <tr>
                <td className="border px-2 py-1">Usage logs & analytics</td>
                <td className="border px-2 py-1">Standard server logs (IP address, user-agent, timestamps). <b>We also collect aggregate analytics such as number of users, page views, and general usage patterns. No sensitive email data is collected for analytics.</b></td>
                <td className="border px-2 py-1">Yes – max 30 days (logs); analytics are aggregated and do not contain personal or email content.</td>
                <td className="border px-2 py-1">Legitimate interest (security, debugging, and product improvement)</td>
              </tr>
              <tr>
                <td className="border px-2 py-1">Payment data (planned)</td>
                <td className="border px-2 py-1">If you buy a paid plan we&apos;ll direct you to [Stripe or other PSP]. Card details are handled only by the payment processor.</td>
                <td className="border px-2 py-1">No</td>
                <td className="border px-2 py-1">Contract</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-xs text-muted-foreground mb-2">*If you reside in the European Economic Area, UK or another GDPR-aligned region.</p>
        <p className="mb-2">We do not intentionally collect special-category data, location data, marketing preferences, or information about children under 13. <b>Analytics are limited to aggregate usage statistics and do not include your email content.</b></p>
      </section>
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2">4. How we use information</h2>
        <ul className="list-disc pl-6 space-y-1">
          <li>Authenticate you and maintain your session.</li>
          <li>Retrieve and display your Gmail messages inside the app.</li>
          <li>Provide customer support and communicate service-related notices.</li>
          <li>Protect the Service against abuse, bugs or security threats.</li>
          <li>Analyze aggregate usage statistics (e.g., number of users, page views) to improve the Service. <b>No sensitive email data is used for analytics.</b></li>
          <li>Planned: process payments and manage subscriptions.</li>
        </ul>
      </section>
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2">5. How we share information</h2>
        <p className="mb-2">We never sell or rent your personal information. We share it only with:</p>
        <div className="overflow-x-auto mb-4">
          <table className="min-w-full border text-sm">
            <thead>
              <tr className="bg-muted">
                <th className="border px-2 py-1 text-left">Recipient</th>
                <th className="border px-2 py-1 text-left">Purpose</th>
                <th className="border px-2 py-1 text-left">Safeguards</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border px-2 py-1">Google LLC</td>
                <td className="border px-2 py-1">Access to Gmail via Google APIs</td>
                <td className="border px-2 py-1">OAuth 2.0; data use limited by Google API Services User Data Policy</td>
              </tr>
              <tr>
                <td className="border px-2 py-1">Clerk, Inc.</td>
                <td className="border px-2 py-1">Authentication & user management</td>
                <td className="border px-2 py-1">EU–US Data Privacy Framework participant</td>
              </tr>
              <tr>
                <td className="border px-2 py-1">Vercel Inc.</td>
                <td className="border px-2 py-1">Hosting of the web application</td>
                <td className="border px-2 py-1">SCCs for EU data</td>
              </tr>
              <tr>
                <td className="border px-2 py-1">[Database host / cloud provider]</td>
                <td className="border px-2 py-1">Encrypted storage of user and token tables</td>
                <td className="border px-2 py-1">Industry-standard encryption</td>
              </tr>
              <tr>
                <td className="border px-2 py-1">Stripe, Inc. (future)</td>
                <td className="border px-2 py-1">Payment processing</td>
                <td className="border px-2 py-1">PCI-DSS-compliant</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p>We may disclose data if required by law or to protect rights, property or safety.</p>
      </section>
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2">6. Google API Services disclosure</h2>
        <p>
          Silhouette AI&apos;s use and transfer of information received from Google APIs will adhere to the Google API Services User Data Policy, including the Limited Use requirements. We access Gmail only to read messages you explicitly permit; we do not store, share or allow human access to message content except with your explicit consent or for security/legal reasons.
        </p>
      </section>
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2">7. Data retention</h2>
        <div className="overflow-x-auto mb-4">
          <table className="min-w-full border text-sm">
            <thead>
              <tr className="bg-muted">
                <th className="border px-2 py-1 text-left">Data</th>
                <th className="border px-2 py-1 text-left">Retention rule</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border px-2 py-1">Account data & tokens</td>
                <td className="border px-2 py-1">Until you delete your account or after 12 months of continuous inactivity, whichever comes first.</td>
              </tr>
              <tr>
                <td className="border px-2 py-1">Gmail message content</td>
                <td className="border px-2 py-1">Not stored. Vanishes when you close the browser tab or sign out.</td>
              </tr>
              <tr>
                <td className="border px-2 py-1">Server logs</td>
                <td className="border px-2 py-1">Automatically deleted after 30 days.</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p>
          You can delete your account at any time from <b>Settings → Delete account</b> or by emailing <a href="mailto:sultantemuruly@gmail.com" className="underline hover:text-primary">sultantemuruly@gmail.com</a>.
        </p>
      </section>
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2">8. Your rights</h2>
        <p className="mb-2">Depending on your jurisdiction, you may have the right to:</p>
        <ul className="list-disc pl-6 space-y-1 mb-2">
          <li>Request a copy of your data (&quot;access&quot;).</li>
          <li>Ask us to correct or delete data.</li>
          <li>Object to or restrict processing.</li>
          <li>Lodge a complaint with a supervisory authority (e.g. your local data-protection regulator in the EU).</li>
        </ul>
        <p>
          Contact us at <a href="mailto:sultantemuruly@gmail.com" className="underline hover:text-primary">sultantemuruly@gmail.com</a> to exercise these rights.
        </p>
      </section>
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2">9. International transfers</h2>
        <p>
          We are based in Kazakhstan and use service providers in the United States and EU. Where required, we rely on Standard Contractual Clauses or adequacy decisions to protect EU/UK data when it is transferred outside your region.
        </p>
      </section>
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2">10. Security</h2>
        <p>
          We follow industry best practices: HTTPS for all traffic, encryption-at-rest for databases, access-token encryption, and least-privilege IAM policies. No method of transmission is 100% secure, but we strive to protect your information.
        </p>
      </section>
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2">11. Children</h2>
        <p>
          The Service is not directed to children under 13. If you believe we have inadvertently collected such data, please contact us and we will delete it promptly.
        </p>
      </section>
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2">12. Changes to this policy</h2>
        <p>
          We may update this Privacy Policy from time to time. We will post the new version on this page and, if the changes are material, notify you via email or an in-app banner at least 7 days before they take effect.
        </p>
      </section>
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2">13. Contact us</h2>
        <p>
          If you have questions about privacy or this policy, email <a href="mailto:sultantemuruly@gmail.com" className="underline hover:text-primary">sultantemuruly@gmail.com</a>.
        </p>
      </section>
    </main>
  );
} 