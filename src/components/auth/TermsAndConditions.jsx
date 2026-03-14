import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function TermsAndConditions() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-950 text-gray-200 px-4 py-8 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-amber-400 hover:text-amber-300 transition-colors mb-6 text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        <div className="bg-gray-900 rounded-xl p-6 sm:p-10 space-y-6 leading-relaxed">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">Terms and Conditions</h1>
            <p className="text-gray-400 text-sm mt-1">Last Updated: March 2026</p>
          </div>

          <Section title="1. About Likhavat">
            <p>Likhavat is a creative writing and real-time messaging platform allowing users to write, share, and collaborate on books, scripts, and poems.</p>
          </Section>

          <Section title="2. User Eligibility">
            <p>You must be at least 13 years old to use Likhavat. By creating an account you confirm that all information you provide is accurate and up to date.</p>
          </Section>

          <Section title="3. Account Responsibility">
            <p>You are solely responsible for maintaining the security of your account credentials. Do not share your password with anyone. Any activity under your account is your responsibility.</p>
          </Section>

          <Section title="4. Acceptable Use">
            <p>You agree not to use Likhavat to:</p>
            <ul className="list-disc list-inside mt-2 space-y-1 text-gray-300">
              <li>Harass, threaten, or abuse other users</li>
              <li>Send spam or unsolicited messages</li>
              <li>Upload malicious content or malware</li>
              <li>Impersonate other individuals</li>
              <li>Violate any applicable laws or regulations</li>
            </ul>
          </Section>

          <Section title="5. Privacy">
            <p>The platform collects email addresses and account data necessary for operation. We do not sell your personal data to third parties. Your content remains yours — we only use it to provide the service.</p>
          </Section>

          <Section title="6. Service Availability">
            <p>The service is provided "as is" without warranties of any kind. We may update, modify, or discontinue features at any time without prior notice.</p>
          </Section>

          <Section title="7. Limitation of Liability">
            <p>The creators of Likhavat are not responsible for service interruptions, data loss, or any damages arising from your use of the platform.</p>
          </Section>

          <Section title="8. Changes to Terms">
            <p>We reserve the right to update these terms at any time. Continued use of the platform after changes constitutes acceptance of the new terms.</p>
          </Section>

          <p className="text-gray-500 text-xs pt-4 border-t border-gray-800">
            By signing up, you acknowledge that you have read and agree to these Terms and Conditions.
          </p>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="space-y-2">
      <h2 className="text-lg sm:text-xl font-semibold text-white">{title}</h2>
      <div className="text-gray-300 text-sm sm:text-base">{children}</div>
    </div>
  );
}
