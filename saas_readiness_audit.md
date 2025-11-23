# SaaS Readiness Audit

This document outlines the missing features and integrations required to make the "VerdantAI" SaaS application production-ready ("live").

## 1. Monetization & Billing (Critical)
The `BillingPage.tsx` is currently a static UI with mock data. To go live, the following is needed:

*   **Stripe Integration**:
    *   **Checkout Flow**: Implement a backend API to create Stripe Checkout Sessions when a user clicks "Upgrade".
    *   **Webhooks**: Create a backend endpoint to listen for Stripe events (e.g., `checkout.session.completed`, `invoice.payment_succeeded`, `customer.subscription.deleted`) to automatically update the user's subscription status in the database.
    *   **Customer Portal**: Implement a flow for users to manage their subscription (cancel, upgrade, update card) via Stripe's hosted Customer Portal.
*   **Database Schema**:
    *   Update the `profiles` table or create a new `subscriptions` table to store:
        *   `stripe_customer_id`
        *   `stripe_subscription_id`
        *   `subscription_status` (active, past_due, canceled, trialing)
        *   `current_period_end`
        *   `plan_id`

## 2. Authentication & User Management
The `AuthPage.tsx` handles basic Sign Up/Sign In, but lacks standard SaaS auth features:

*   **Forgot Password**: Implement a flow to request a password reset email and a corresponding page to handle the reset token/password update.
*   **Email Verification**: Handle the state where a user has signed up but not verified their email (if enforced).
*   **Social Login**: Add Google/GitHub login options (standard for developer tools).
*   **Account Management**:
    *   **Change Password**: Add functionality in `SettingsPage.tsx` for users to update their password.
    *   **Delete Account**: Add a "Danger Zone" in settings to permanently delete their account and data (GDPR/CCPA requirement).

## 3. Legal & Compliance
These pages are required by payment processors (Stripe) and for legal protection. They should be linked in the footer or auth screens:

*   **Terms of Service**: Create `src/pages/TermsPage.tsx`.
*   **Privacy Policy**: Create `src/pages/PrivacyPage.tsx`.
*   **Cookie Consent**: Add a cookie consent banner if you are tracking users (e.g., via analytics).

## 4. Support & Documentation
*   **Help Center / Documentation**: Create a section or external site for users to learn how to use the Agent Builder and other features.
*   **Support Channel**: Add a "Contact Us" form or embed your own chat widget to provide customer support.

## 5. Analytics & Data
*   **Real Analytics**: The `AnalyticsPage.tsx` currently generates random mock data (`Math.random()`).
    *   **Data Aggregation**: Implement real SQL queries in Supabase to aggregate data from `chat_sessions` and `usage_logs` (e.g., count conversations, sum tokens used).
    *   **API Integration**: Replace the mock data generation in the frontend with calls to these real data endpoints.

## 6. Emails & Notifications
*   **Transactional Emails**: Integrate with a service like Resend, SendGrid, or AWS SES for:
    *   Welcome emails upon sign-up.
    *   Usage limit warnings (e.g., "You've used 80% of your monthly tokens").
    *   Failed payment notifications.
    *   Password reset emails.

## Summary Checklist to Go Live

- [ ] **Billing**: Implement Stripe Checkout & Webhooks
- [ ] **Auth**: Add "Forgot Password" & "Delete Account" flows
- [ ] **Legal**: Create Terms of Service & Privacy Policy pages
- [ ] **Analytics**: Replace mock data with real DB queries
- [ ] **Support**: Add a Support/Contact method
- [ ] **Emails**: Set up transactional emails
