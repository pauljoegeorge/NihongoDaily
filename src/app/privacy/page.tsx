
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function PrivacyPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div className="text-center">
        <h1 className="text-4xl font-headline text-primary">Privacy Policy</h1>
        <p className="text-muted-foreground">Last updated: October 26, 2023</p>
      </div>
      
      <Card className="shadow-lg bg-card">
        <CardHeader>
          <CardTitle className="text-2xl text-primary">Introduction</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-foreground/90">
          <p>
            Welcome to Nihongo Daily. We are committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our application.
          </p>
          <p>
            By using Nihongo Daily, you agree to the collection and use of information in accordance with this policy.
          </p>
        </CardContent>
      </Card>

      <Card className="shadow-lg bg-card">
        <CardHeader>
          <CardTitle className="text-2xl text-primary">Information We Collect</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 text-foreground/90">
          <p>We may collect information about you in a variety of ways. The information we may collect via the Application includes:</p>
          
          <div>
            <h3 className="font-semibold text-lg text-foreground">Personal Data</h3>
            <p>
              When you sign in using your Google account, we automatically access basic account information, such as your name, email address, and profile picture, which are used to personalize your experience within the app. We do not collect or store your Google password.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-lg text-foreground">Application Data</h3>
            <p>
              All vocabulary words, Kanji, definitions, example sentences, and your progress (such as learned status and difficulty ratings) are stored and linked to your user account to provide the core functionality of the app.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-lg text-foreground">Usage Data (via Google Analytics)</h3>
            <p>
              We use Google Analytics to collect anonymous information about your use of the Application. This includes data such as the pages you visit, the features you use, and your general geographic location (but not your precise address). This data is aggregated and does not personally identify you. It helps us understand how our users engage with the app so we can improve it.
            </p>
          </div>
        </CardContent>
      </Card>
      
      <Card className="shadow-lg bg-card">
        <CardHeader>
          <CardTitle className="text-2xl text-primary">How We Use Your Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-foreground/90">
          <p>Having accurate information about you permits us to provide you with a smooth, efficient, and customized experience. Specifically, we may use information collected about you via the Application to:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Create and manage your account.</li>
            <li>Provide you with the core vocabulary and Kanji tracking services.</li>
            <li>Monitor and analyze usage and trends to improve your experience with the Application.</li>
            <li>Maintain the security of our Application.</li>
          </ul>
        </CardContent>
      </Card>

      <Card className="shadow-lg bg-card">
        <CardHeader>
          <CardTitle className="text-2xl text-primary">Data Storage and Security</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-foreground/90">
           <p>
            Your data, including personal information and application data, is stored securely on Google Cloud Firestore, a service provided by Google. We rely on Google's robust security measures to protect your data. While we take reasonable steps to secure your personal information, please be aware that no security measures are perfect or impenetrable, and we cannot guarantee complete security.
          </p>
        </CardContent>
      </Card>
      
      <Card className="shadow-lg bg-card">
        <CardHeader>
          <CardTitle className="text-2xl text-primary">Your Rights and Data Control</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-foreground/90">
           <p>
            You have control over your data. You can add, edit, and delete your vocabulary and Kanji entries directly within the application at any time.
          </p>
           <p>
            If you wish to delete your entire account and all associated data, please contact us at <a href="mailto:privacy@example.com" className="underline text-primary hover:text-primary/80">privacy@example.com</a>. We will process your request in a timely manner.
          </p>
        </CardContent>
      </Card>

      <Card className="shadow-lg bg-card">
        <CardHeader>
          <CardTitle className="text-2xl text-primary">Changes to This Privacy Policy</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-foreground/90">
           <p>
            We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page. You are advised to review this Privacy Policy periodically for any changes.
          </p>
        </CardContent>
      </Card>
      
      <Card className="shadow-lg bg-card">
        <CardHeader>
          <CardTitle className="text-2xl text-primary">Contact Us</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-foreground/90">
           <p>
            If you have any questions or suggestions about our Privacy Policy, do not hesitate to contact us at <a href="mailto:privacy@example.com" className="underline text-primary hover:text-primary/80">privacy@example.com</a>.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
