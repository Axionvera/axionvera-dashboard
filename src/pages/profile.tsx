import Head from "next/head";
import { useRouter } from "next/router";
import { useState } from "react";

import Navbar from "@/components/Navbar";
import ProfileForm from "@/components/ProfileForm";
import SecuritySettingsForm from "@/components/SecuritySettingsForm";
import { UserProfileSkeleton } from "@/components/Skeletons";
import { useSidebar } from "@/hooks/useSidebar";
import { useWalletContext } from "@/hooks/useWallet";
import { ProfileFormData, SecuritySettingsFormData } from "@/utils/validation";
import { useEffect } from "react";

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState<'profile' | 'security'>('profile');
  const [isLoading, setIsLoading] = useState(true);
  const { isOpen } = useSidebar();
  const wallet = useWalletContext();
  const router = useRouter();

  // Redirect to landing page if wallet is disconnected while on a protected route
  useEffect(() => {
    if (!wallet.isConnected && !wallet.isConnecting) {
      router.replace('/');
    }
  }, [wallet.isConnected, wallet.isConnecting, router]);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  const handleProfileSubmit = async (data: ProfileFormData) => {
    console.log('Profile data:', data);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
  };

  const handleSecuritySubmit = async (data: SecuritySettingsFormData) => {
    console.log('Security data:', data);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
  };

  return (
    <>
      <Head>
        <title>Profile · Axionvera</title>
      </Head>
      <main className="min-h-screen bg-background-primary">
        <Navbar
          publicKey={wallet.publicKey}
          isConnecting={wallet.isConnecting}
          onConnect={wallet.connect}
          onDisconnect={wallet.disconnect}
        />
        <div className={`transition-all duration-300 ${isOpen ? 'lg:pl-64' : ''}`}>
          <div className="mx-auto max-w-4xl px-6 py-8">
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-text-primary">Profile Settings</h1>
              <p className="mt-2 text-text-muted">
                Manage your account settings and preferences.
              </p>
            </div>

            {/* Tab Navigation */}
            <div className="mb-8 border-b border-border-primary">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`
                    py-2 px-1 border-b-2 text-sm font-medium transition-colors
                    ${activeTab === 'profile'
                      ? 'border-axion-500 text-axion-400'
                      : 'border-transparent text-text-muted hover:text-text-secondary'
                    }
                  `}
                >
                  Profile Information
                </button>
                <button
                  onClick={() => setActiveTab('security')}
                  className={`
                    py-2 px-1 border-b-2 text-sm font-medium transition-colors
                    ${activeTab === 'security'
                      ? 'border-axion-500 text-axion-400'
                      : 'border-transparent text-text-muted hover:text-text-secondary'
                    }
                  `}
                >
                  Security Settings
                </button>
              </nav>
            </div>

            {/* Tab Content */}
            <div className="space-y-6">
              {isLoading ? (
                <UserProfileSkeleton />
              ) : activeTab === 'profile' ? (
                <ProfileForm
                  initialData={{
                    firstName: 'John',
                    lastName: 'Doe',
                    email: 'john.doe@example.com',
                    bio: 'Passionate about decentralized finance and blockchain technology.',
                    website: 'https://johndoe.dev',
                    location: 'San Francisco, CA',
                  }}
                  onSubmit={handleProfileSubmit}
                />
              ) : (
                <SecuritySettingsForm onSubmit={handleSecuritySubmit} />
              )}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
