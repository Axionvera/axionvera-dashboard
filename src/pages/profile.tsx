import Head from "next/head";
import Link from "next/link";
import { useState } from "react";

import Navbar from "@/components/Navbar";
import ProfileForm from "@/components/ProfileForm";
import SecuritySettingsForm from "@/components/SecuritySettingsForm";
import { UserProfileSkeleton } from "@/components/Skeletons";
import { useSidebar } from "@/hooks/useSidebar";
import { useWalletContext } from "@/hooks/useWallet";
import { ProfileFormData, SecuritySettingsFormData } from "@/utils/validation";
import { useEffect } from "react";
import WalletAvatar from "@/components/WalletAvatar";
import { shortenAddress } from "@/utils/contractHelpers";
import CopyButton from "@/components/CopyButton";

export default function ProfilePage() {
  const [isLoading, setIsLoading] = useState(true);
  const { isOpen } = useSidebar();
  const wallet = useWalletContext();

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
        <title>Profile · AxionVera</title>
        <meta name="description" content="Manage your AxionVera profile settings and security preferences. Update your account information and security options." />
        
        {/* Open Graph */}
        <meta property="og:title" content="Profile · AxionVera" />
        <meta property="og:description" content="Manage your AxionVera profile settings and security preferences." />
        <meta property="og:type" content="website" />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Profile · AxionVera" />
        <meta name="twitter:description" content="Manage your AxionVera profile settings and security preferences." />
      </Head>
      <main className="min-h-screen bg-background-primary">
        <Navbar
          publicKey={wallet.publicKey}
          isConnecting={wallet.isConnecting}
          onConnect={wallet.connect}
          onDisconnect={wallet.disconnect}
        />
        <div className={`transition-all duration-300 ${isOpen ? 'lg:pl-64' : ''}`}>
          <div className="mx-auto max-w-7xl px-6 py-8">
            {/* Breadcrumb Navigation */}
            <nav className="mb-6" aria-label="Breadcrumb">
              <ol className="flex items-center space-x-2 text-sm">
                <li>
                  <Link 
                    href="/dashboard" 
                    className="text-text-muted hover:text-axion-400 transition-colors"
                  >
                    Dashboard
                  </Link>
                </li>
                <li className="text-text-muted">/</li>
                <li>
                  <span className="text-text-primary font-medium" aria-current="page">
                    Profile
                  </span>
                </li>
              </ol>
            </nav>

            {/* Page Header */}
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-text-primary">Profile Settings</h1>
              <p className="mt-2 text-text-muted">
                Manage your account settings and preferences.
              </p>
            </div>

            {/* Wallet Info */}
            {wallet.publicKey && (
              <div className="mb-8 rounded-2xl border border-border-primary bg-background-primary/30 p-6">
                <h2 className="text-lg font-semibold text-text-primary mb-4">Wallet Information</h2>
                <div className="flex items-center gap-3">
                  <WalletAvatar publicKey={wallet.publicKey} size={40} />
                  <div>
                    <p className="text-sm font-medium text-text-primary">
                      {shortenAddress(wallet.publicKey, 8)}
                    </p>
                    <p className="text-xs text-text-muted">Connected Wallet</p>
                  </div>
                  <CopyButton text={wallet.publicKey} label="Copy full address" />
                </div>
              </div>
            )}

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
            {/* Two-Column Layout */}
            {isLoading ? (
              <div className="space-y-6">
                <UserProfileSkeleton />
              </div>
            ) : (
              <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
                {/* Left Column - Profile Information */}
                <div className="space-y-6">
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
                </div>

                {/* Right Column - Security Settings */}
                <div className="space-y-6">
                  <SecuritySettingsForm onSubmit={handleSecuritySubmit} />
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
