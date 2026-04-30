import { useState, useEffect } from "react";

interface FAQItem {
  question: string;
  answer: string;
}

const faqData: FAQItem[] = [
  {
    question: "What is Soroban?",
    answer: "Soroban is Stellar's smart contract platform, enabling decentralized applications on the Stellar network. It uses WebAssembly (WASM) for secure and efficient contract execution.",
  },
  {
    question: "How are rewards calculated?",
    answer: "Rewards are calculated based on your vault deposits and the vault's performance. The APY (Annual Percentage Yield) is dynamically adjusted based on the strategy returns and token emissions.",
  },
  {
    question: "How do I connect my wallet?",
    answer: "Click the 'Connect Wallet' button in the top right corner. This will open Freighter, Stellar's official browser extension. Make sure Freighter is installed and funded.",
  },
  {
    question: "What is the Axionvera Vault?",
    answer: "The Axionvera Vault is a yield-optimizing smart contract that deposits your assets into various DeFi strategies on Stellar, automatically compounding your returns.",
  },
  {
    question: "How do I withdraw my funds?",
    answer: "Go to the Dashboard, enter the amount you wish to withdraw in the Withdraw form, and confirm the transaction in Freighter. withdrawals are processed at the next epoch.",
  },
  {
    question: "Is my funds safe?",
    answer: "The vault contracts are audited and use industry-standard security practices. However, as with all DeFi protocols, there are inherent risks. Please do your own research before depositing.",
  },
  {
    question: "What tokens can I deposit?",
    answer: "Currently, you can deposit XLM (Stellar's native token) and wrapped assets. Check the Dashboard for the latest supported assets.",
  },
  {
    question: "Where can I find full documentation?",
    answer: "Visit our official documentation site for comprehensive guides, API references, and security audits.",
  },
];

export default function HelpDrawer() {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleDrawer = () => setIsOpen(!isOpen);
  const toggleFAQ = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  if (!mounted) {
    return (
      <button
        className="fixed bottom-6 right-20 p-3 rounded-full bg-background-secondary/50 border border-border-primary w-12 h-12"
        aria-label="Open Help"
      />
    );
  }

  return (
    <>
      {/* Help Icon Button */}
      <button
        onClick={toggleDrawer}
        className="fixed bottom-6 right-20 p-3 rounded-full bg-background-secondary border border-border-primary text-text-primary shadow-xl hover:shadow-axion-500/20 transition-all z-50 focus:outline-none focus:ring-2 focus:ring-axion-500"
        aria-label="Open Help"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </button>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm transition-opacity"
          onClick={toggleDrawer}
          aria-hidden="true"
        />
      )}

      {/* Drawer Panel */}
      <div
        className={`fixed right-0 top-0 z-50 h-full w-full max-w-md bg-background-primary border-l border-border-primary shadow-2xl transform transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Help drawer"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border-primary px-6 py-4">
          <h2 className="text-lg font-semibold text-text-primary">Help & FAQ</h2>
          <button
            onClick={toggleDrawer}
            className="p-2 rounded-lg text-text-secondary hover:bg-background-secondary transition-colors"
            aria-label="Close Help"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* FAQ Content */}
        <div className="overflow-y-auto h-[calc(100%-65px)] p-4 space-y-3">
          {faqData.map((item, index) => (
            <div
              key={index}
              className="border border-border-primary rounded-xl overflow-hidden"
            >
              <button
                onClick={() => toggleFAQ(index)}
                className="w-full flex items-center justify-between p-4 text-left bg-background-secondary hover:bg-background-tertiary transition-colors"
                aria-expanded={expandedIndex === index}
              >
                <span className="font-medium text-text-primary pr-4">{item.question}</span>
                <svg
                  className={`w-5 h-5 text-text-secondary flex-shrink-0 transform transition-transform duration-200 ${
                    expandedIndex === index ? "rotate-180" : ""
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {expandedIndex === index && (
                <div className="px-4 pb-4 pt-2 border-t border-border-primary">
                  <p className="text-sm text-text-secondary leading-relaxed">{item.answer}</p>
                </div>
              )}
            </div>
          ))}

          {/* External Documentation Link */}
          <div className="mt-6 pt-4 border-t border-border-primary">
            <a
              href="https://docs.axionvera.network"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full p-4 rounded-xl bg-axion-500/10 text-axion-500 hover:bg-axion-500/20 transition-colors font-medium"
            >
              <span>View Full Documentation</span>
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </>
  );
}