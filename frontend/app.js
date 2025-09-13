import { createWeb3Modal, defaultConfig } from 'https://unpkg.com/@walletconnect/web3modal@latest/dist/index.js'

class OqiaApp {
    constructor() {
        this.web3Modal = null;
        this.provider = null;
        this.signer = null;
        this.userAddress = null;
        this.contracts = {};
        this.agents = [];
        
        // Contract addresses from your deployed contracts
        this.contractAddresses = {
            OqiaBotFactory: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
            OqiaModuleRegistry: "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
            OqiaSessionKeyManager: "0x0165878A594ca255338adfa4d48449f69242Eb8F"
        };
        
        this.init();
    }
    
    async init() {
        await this.setupWalletConnect();
        this.bindEvents();
        await this.checkWalletConnection();
    }
    
    async setupWalletConnect() {
        // WalletConnect configuration
        const projectId = 'c29ea61b-8cf9-462f-9fd3-3c033bbd7bf8';
        
        const metadata = {
            name: 'Oqia Protocol',
            description: 'Autonomous AI Agents on Blockchain',
            url: 'https://oqia.ai',
            icons: ['https://avatars.githubusercontent.com/u/37784886']
        };

        const chains = [
            {
                chainId: 1,
                name: 'Ethereum',
                currency: 'ETH',
                explorerUrl: 'https://etherscan.io',
                rpcUrl: 'https://cloudflare-eth.com'
            },
            {
                chainId: 11155111,
                name: 'Sepolia',
                currency: 'ETH',
                explorerUrl: 'https://sepolia.etherscan.io',
                rpcUrl: 'https://ethereum-sepolia.publicnode.com'
            },
            {
                chainId: 31337,
                name: 'Localhost',
                currency: 'ETH',
                explorerUrl: 'http://localhost:8545',
                rpcUrl: 'http://localhost:8545'
            }
        ];

        const config = defaultConfig({
            metadata,
            chains,
            projectId,
            enableAnalytics: true
        });

        this.web3Modal = createWeb3Modal({
            config,
            projectId,
            chains
        });
    }
    
    bindEvents() {
        document.getElementById('connect-wallet-btn').addEventListener('click', () => this.connectWallet());
        document.getElementById('get-started-btn').addEventListener('click', () => this.connectWallet());
        document.getElementById('mint-agent-btn').addEventListener('click', () => this.createAgent());
        document.getElementById('grant-session-key-btn').addEventListener('click', () => this.grantSessionKey());
        document.getElementById('notification-close').addEventListener('click', () => this.hideNotification());
    }
    
    async checkWalletConnection() {
        try {
            const walletProvider = this.web3Modal.getWalletProvider();
            if (walletProvider) {
                await this.setupProvider(walletProvider);
                this.updateWalletUI(true);
                await this.loadDashboard();
            }
        } catch (error) {
            console.error('Error checking wallet connection:', error);
        }
    }
    
    async connectWallet() {
        try {
            this.showLoading(true);
            const walletProvider = await this.web3Modal.open();
            
            if (walletProvider) {
                await this.setupProvider(walletProvider);
                this.updateWalletUI(true);
                await this.loadDashboard();
                this.showNotification('Wallet connected successfully!');
            }
        } catch (error) {
            console.error('Wallet connection failed:', error);
            this.showNotification('Failed to connect wallet', 'error');
        } finally {
            this.showLoading(false);
        }
    }
    
    async setupProvider(walletProvider) {
        this.provider = new ethers.BrowserProvider(walletProvider);
        this.signer = await this.provider.getSigner();
        this.userAddress = await this.signer.getAddress();
        
        // Setup contract instances with ABIs
        await this.setupContracts();
    }
    
    async setupContracts() {
        // Simplified ABIs for the main functions we need
        const factoryABI = [
            "function createBot(address botOwner) external returns (address)",
            "function botWalletOf(uint256 tokenId) external view returns (address)",
            "function tokenOfWallet(address wallet) external view returns (uint256)",
            "function ownerOf(uint256 tokenId) external view returns (address)",
            "function balanceOf(address owner) external view returns (uint256)",
            "event BotCreated(uint256 indexed tokenId, address indexed owner, address wallet)"
        ];
        
        const sessionManagerABI = [
            "function authorizeSessionKey(address agentWallet, address sessionKey, bytes4 allowedFunction, uint256 validUntil, uint256 valueLimit) external",
            "function revokeSessionKey(address agentWallet, address sessionKey) external",
            "function getActiveSessionKeys(address agentWallet) external view returns (address[] memory)",
            "event SessionKeyAuthorized(address indexed agentWallet, address indexed sessionKey, bytes4 allowedFunction, uint256 validUntil, uint256 valueLimit)"
        ];
        
        this.contracts.factory = new ethers.Contract(
            this.contractAddresses.OqiaBotFactory,
            factoryABI,
            this.signer
        );
        
        this.contracts.sessionManager = new ethers.Contract(
            this.contractAddresses.OqiaSessionKeyManager,
            sessionManagerABI,
            this.signer
        );
    }
    
    updateWalletUI(connected) {
        const statusIndicator = document.getElementById('status-indicator');
        const walletStatus = document.getElementById('wallet-status');
        const walletAddress = document.getElementById('wallet-address');
        const connectBtn = document.getElementById('connect-wallet-btn');
        
        if (connected) {
            statusIndicator.classList.add('connected');
            walletStatus.textContent = 'Connected';
            walletAddress.textContent = this.formatAddress(this.userAddress);
            connectBtn.textContent = 'Connected';
            connectBtn.disabled = true;
        } else {
            statusIndicator.classList.remove('connected');
            walletStatus.textContent = 'Not Connected';
            walletAddress.textContent = '';
            connectBtn.textContent = 'Connect Wallet';
            connectBtn.disabled = false;
        }
    }
    
    async loadDashboard() {
        document.getElementById('welcome').style.display = 'none';
        document.getElementById('dashboard').style.display = 'block';
        
        await this.loadUserAgents();
        this.updateStats();
    }
    
    async loadUserAgents() {
        try {
            this.agents = [];
            
            // Get user's agent count
            const agentCount = await this.contracts.factory.balanceOf(this.userAddress);
            
            // For now, we'll create a simple representation
            // In a full implementation, you'd iterate through tokenIds
            for (let i = 0; i < agentCount; i++) {
                // This is simplified - you'd need to get actual tokenIds
                const agent = {
                    id: i + 1,
                    address: '0x' + Math.random().toString(16).substr(2, 40),
                    balance: '0.0',
                    sessionKeys: 0
                };
                this.agents.push(agent);
            }
            
        } catch (error) {
            console.error('Error loading agents:', error);
            this.agents = [];
        }
        
        this.renderAgents();
    }
    
    renderAgents() {
        const agentsList = document.getElementById('agents-list');
        
        if (this.agents.length === 0) {
            agentsList.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: #6b7280;">
                    <p>No agents created yet. Create your first autonomous AI agent!</p>
                </div>
            `;
            return;
        }
        
        agentsList.innerHTML = this.agents.map(agent => `
            <div class="agent-card">
                <h3>🤖 Agent #${agent.id}</h3>
                <div class="agent-address">${agent.address}</div>
                <div class="agent-balance">${agent.balance} ETH</div>
                <div style="display: flex; gap: 8px; margin-top: 16px;">
                    <button class="btn btn-secondary" onclick="app.manageAgent(${agent.id})">Manage</button>
                    <button class="btn btn-primary" onclick="app.fundAgent(${agent.id})">Fund</button>
                </div>
            </div>
        `).join('');
    }
    
    updateStats() {
        document.getElementById('agent-count').textContent = this.agents.length;
        document.getElementById('session-count').textContent = this.agents.reduce((sum, agent) => sum + agent.sessionKeys, 0);
        document.getElementById('total-value').textContent = `${this.agents.reduce((sum, agent) => sum + parseFloat(agent.balance), 0).toFixed(3)} ETH`;
    }
    
    async createAgent() {
        if (!this.contracts.factory) {
            this.showNotification('Please connect your wallet first', 'error');
            return;
        }
        
        try {
            this.showLoading(true);
            
            console.log('Creating agent for:', this.userAddress);
            const tx = await this.contracts.factory.createBot(this.userAddress);
            console.log('Transaction sent:', tx.hash);
            
            this.showNotification('Transaction sent! Waiting for confirmation...');
            const receipt = await tx.wait();
            console.log('Transaction confirmed:', receipt);
            
            this.showNotification('Agent created successfully!');
            await this.loadUserAgents();
            
        } catch (error) {
            console.error('Failed to create agent:', error);
            let errorMessage = 'Failed to create agent';
            
            if (error.reason) {
                errorMessage += ': ' + error.reason;
            } else if (error.message) {
                errorMessage += ': ' + error.message;
            }
            
            this.showNotification(errorMessage, 'error');
        } finally {
            this.showLoading(false);
        }
    }
    
    async grantSessionKey() {
        if (!this.contracts.sessionManager) {
            this.showNotification('Please connect your wallet first', 'error');
            return;
        }
        
        const sessionKeyAddress = document.getElementById('session-key-address').value;
        const functionSelector = document.getElementById('session-key-function').value;
        const duration = document.getElementById('session-key-duration').value;
        const allowance = document.getElementById('session-key-allowance').value;
        
        if (!sessionKeyAddress || !duration || !allowance) {
            this.showNotification('Please fill in all required fields', 'error');
            return;
        }
        
        if (!ethers.isAddress(sessionKeyAddress)) {
            this.showNotification('Invalid session key address', 'error');
            return;
        }
        
        try {
            this.showLoading(true);
            
            // For demo purposes, use the first agent if available
            if (this.agents.length === 0) {
                this.showNotification('Please create an agent first', 'error');
                return;
            }
            
            const agentWallet = this.agents[0].address; // This would be the actual agent wallet address
            const validUntil = Math.floor(Date.now() / 1000) + (duration * 3600);
            const valueLimit = ethers.parseEther(allowance);
            const allowedFunction = functionSelector || '0x00000000';
            
            const tx = await this.contracts.sessionManager.authorizeSessionKey(
                agentWallet,
                sessionKeyAddress,
                allowedFunction,
                validUntil,
                valueLimit
            );
            
            this.showNotification('Transaction sent! Waiting for confirmation...');
            await tx.wait();
            
            this.showNotification('Session key granted successfully!');
            this.clearSessionKeyForm();
            
        } catch (error) {
            console.error('Failed to grant session key:', error);
            let errorMessage = 'Failed to grant session key';
            
            if (error.reason) {
                errorMessage += ': ' + error.reason;
            } else if (error.message) {
                errorMessage += ': ' + error.message;
            }
            
            this.showNotification(errorMessage, 'error');
        } finally {
            this.showLoading(false);
        }
    }
    
    clearSessionKeyForm() {
        document.getElementById('session-key-address').value = '';
        document.getElementById('session-key-function').value = '0x00000000';
        document.getElementById('session-key-duration').value = '';
        document.getElementById('session-key-allowance').value = '';
    }
    
    async manageAgent(agentId) {
        this.showNotification(`Managing agent #${agentId} - Feature coming soon!`);
    }
    
    async fundAgent(agentId) {
        const amount = prompt('Enter amount to fund (ETH):');
        if (amount && parseFloat(amount) > 0) {
            try {
                this.showLoading(true);
                
                const agent = this.agents.find(a => a.id === agentId);
                if (!agent) {
                    this.showNotification('Agent not found', 'error');
                    return;
                }
                
                const tx = await this.signer.sendTransaction({
                    to: agent.address,
                    value: ethers.parseEther(amount)
                });
                
                this.showNotification('Transaction sent! Waiting for confirmation...');
                await tx.wait();
                
                this.showNotification(`Agent #${agentId} funded with ${amount} ETH!`);
                await this.loadUserAgents();
                
            } catch (error) {
                console.error('Failed to fund agent:', error);
                this.showNotification('Failed to fund agent', 'error');
            } finally {
                this.showLoading(false);
            }
        }
    }
    
    formatAddress(address) {
        if (!address) return '';
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    }
    
    showLoading(show) {
        document.getElementById('loading').style.display = show ? 'flex' : 'none';
    }
    
    showNotification(message, type = 'success') {
        const notification = document.getElementById('notification');
        const messageEl = document.getElementById('notification-message');
        
        messageEl.textContent = message;
        notification.className = `notification ${type}`;
        notification.style.display = 'block';
        
        setTimeout(() => this.hideNotification(), 5000);
    }
    
    hideNotification() {
        document.getElementById('notification').style.display = 'none';
    }
}

// Initialize the app when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.app = new OqiaApp();
});