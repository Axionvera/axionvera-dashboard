import Head from "next/head";
import { useState } from "react";

import Navbar from "@/components/Navbar";
import ProfileForm from "@/components/ProfileForm";
import SecuritySettingsForm from "@/components/SecuritySettingsForm";
import { useSidebar } from "@/hooks/useSidebar";
import { useWallet } from "@/hooks/useWallet";
import { ProfileFormData, SecuritySettingsFormData } from "@/utils/validation";

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState<'profile' | 'security'>('profile');
  const { isOpen } = useSidebar();
  const wallet = useWallet();

  const handleProfileSubmit = async (data: ProfileFormData) => {
    console.log('Profile data:', data);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    alert('Profile updated successfully!');
  };

  const handleSecuritySubmit = async (data: SecuritySettingsFormData) => {
    console.log('Security data:', data);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    alert('Security settings updated successfully!');
  };

  return (
    <>
      <Head>
        <title>Profile · Axionvera</title>
      </Head>
      <main className="min-h-screen transition-colors duration-300">
        <Navbar
          address={wallet.address}
          isConnecting={wallet.isConnecting}
          onConnect={wallet.connect}
          onDisconnect={wallet.disconnect}
        />
        <div className={`transition-all duration-300 ${isOpen ? 'lg:pl-64' : ''}`}>
          <div className="mx-auto max-w-4xl px-6 py-8">
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white transition-colors">Profile Settings</h1>
              <p className="mt-2 text-slate-500 dark:text-slate-400 transition-colors">
                Manage your account settings and preferences.
              </p>
            </div>

            {/* Tab Navigation */}
            <div className="mb-8 border-b border-slate-200 dark:border-slate-800 transition-colors">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`
                    py-2 px-1 border-b-2 text-sm font-medium transition-colors
                    ${activeTab === 'profile'
                      ? 'border-axion-500 text-axion-600 dark:text-axion-400'
                      : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
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
                      ? 'border-axion-500 text-axion-600 dark:text-axion-400'
                      : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                    }
                  `}
                >
                  Security Settings
                </button>
              </nav>
            </div>

            {/* Tab Content */}
            <div className="space-y-6">
              {activeTab === 'profile' && (
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
              )}

              {activeTab === 'security' && (
                <SecuritySettingsForm onSubmit={handleSecuritySubmit} />
              )}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
