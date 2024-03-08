import { Header } from "@/components/container/header";

const PrivacyPage = () => {
  return (
    <div className="flex items-center justify-center flex-col">
      <div className="p-6 w-full">
        <Header backTo="/" title="Privacy Policy" />
      </div>
      <pre className="w-[calc(100vw)] h-[calc(100vh-88px)] overflow-auto">
        {`
      Privacy Policy for Splitify App

      Effective Date: 01/03/2014
      
      This Privacy Policy describes how Splitify ("we," "us," or "our") collects, uses, 
      and shares information when you use our mobile application available on the Google Play Store (the "App").
      By downloading, installing, or using the App, you agree to the terms of this Privacy Policy.
      
      1. Information We Collect:
      
         a. Personal Information:
            - When you create an account, we may collect personal information such as your name, email address, and profile picture.
            - When you invite friends to join Splitify, we may collect their email addresses for invitation purposes.
      
         b. Transaction Information:
            - We collect information related to your transactions, including details about expenses, participants, and payment methods.
      
         c. Device Information:
            - We may collect information about the device you use to access the App, including device type, operating system, 
              and unique device identifiers.
      
         d. Log Data:
            - We automatically collect log data when you use the App, including IP address, browser type, and pages visited.
      
      2. How We Use Your Information:
      
         a. Provide and Improve the App:
            - We use your information to provide and improve the App's functionality, features, and user experience.
      
         b. Communication:
            - We may use your email address to send you updates, newsletters, and important announcements related to the App.
      
         c. Customer Support:
            - We use the information you provide to respond to your inquiries, troubleshoot issues, and address concerns.
      
         d. Research and Analytics:
            - We may use aggregated and anonymized data for research, analytics, and to improve our services.
      
      3. Sharing of Information:
      
         a. Third-Party Services:
            - We may share your information with third-party service providers to assist us in providing and maintaining the App.
      
         b. Legal Compliance:
            - We may disclose your information if required by law or in response to a valid legal request.
      
      4. Security:
      
         - We implement security measures to protect your information from unauthorized access, alteration, disclosure, or destruction.
      
      5. Your Choices:
      
         a. Account Information:
            - You can update or delete your account information at any time through the App settings.
      
         b. Communication Preferences:
            - You can manage your communication preferences by adjusting your notification settings in the App.
      
      6. Children's Privacy:
      
         - The App is not intended for use by individuals under the age of 13. We do not knowingly collect personal information from children.
      
      7. Changes to this Privacy Policy:
      
         - We may update this Privacy Policy to reflect changes in our practices or for legal reasons. 
           We will notify you of any significant changes.
      
      8. Contact Us:
      
         - If you have any questions or concerns about this Privacy Policy, please contact us at panditankit1995@gmail.com.
      
      By using the Splitify App, you agree to the terms outlined in this Privacy Policy.`}
      </pre>
    </div>
  );
};

export default PrivacyPage;
