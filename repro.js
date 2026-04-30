const mockStorage = {};
const globalAny = global;

if (typeof globalAny.window === 'undefined') {
    globalAny.window = {};
}

globalAny.window.localStorage = {
    getItem: (key) => mockStorage[key] || null,
    setItem: (key, val) => { mockStorage[key] = val; },
};

mockStorage['axionvera:vault:testnet:G_WIT'] = JSON.stringify({
    balance: '100',
    rewards: '0',
    txs: []
});

function getStorageKey(walletAddress, network) {
    return `axionvera:vault:${network}:${walletAddress}`;
}

function loadVault(walletAddress, network) {
    if (typeof window === "undefined") return { balance: "0", rewards: "0", txs: [] };
    const raw = window.localStorage.getItem(getStorageKey(walletAddress, network));
    if (!raw) return { balance: "0", rewards: "0", txs: [] };
    try {
        const parsed = JSON.parse(raw);
        return {
            balance: typeof parsed.balance === "string" ? parsed.balance : "0",
            rewards: typeof parsed.rewards === "string" ? parsed.rewards : "0",
            txs: Array.isArray(parsed.txs) ? parsed.txs : []
        };
    } catch {
        return { balance: "0", rewards: "0", txs: [] };
    }
}

function saveVault(walletAddress, network, vault) {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(getStorageKey(walletAddress, network), JSON.stringify(vault));
}

function toFixedString(n) {
    return n.toString();
}

const vault = loadVault('G_WIT', 'testnet');
console.log('INITIAL VAULT:', vault);

vault.txs = [{ id: '1' }];
saveVault('G_WIT', 'testnet', vault);

const amount = '40';
const balance = Math.max(0, Number(vault.balance) - Number(amount));

const next = {
    balance: toFixedString(balance),
    rewards: vault.rewards,
    txs: vault.txs
};
saveVault('G_WIT', 'testnet', next);

const finalVault = loadVault('G_WIT', 'testnet');
console.log('FINAL VAULT:', finalVault);
