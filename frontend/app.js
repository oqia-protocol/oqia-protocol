class OqiaApp {
    constructor() {
        this.provider = null;
        this.signer = null;
        this.userAddress = null;
        this.contracts = {};
        this.agents = [];
        
        this.init();
    }
    
    async init() {
        this.bindEvents();
        await this.checkWalletConnection();
    }
    
    bindEvents() {
        document.getElementById('connect-wallet-btn').addEventListener('click', () => this.connectWallet());
        document.getElementById('get-started-btn').addEventListener('click', () => this.connectWallet());
        document.getElementById('mint-agent-btn').addEventListener('click', () => this.createAgent());
        document.getElementById('grant-session-key-btn').addEventListener('click', () => this.grantSessionKey());
        document.getElementById('notification-close').addEventListener('click', () => this.hideNotification());
    }
    
    async checkWalletConnection() {
        if (typeof window.ethereum !== 'undefined') {
            try {
                const accounts = await window.ethereum.request({ method: 'eth_accounts' });
                if (accounts.length > 0) {
                    await this.setupProvider();
                    this.updateWalletUI(true);
                    await this.loadDashboard();
                }
            } catch (error) {
                console.error('Error checking wallet connection:', error);
            }
        }
    }
    
    async connectWallet() {
        if (typeof window.ethereum === 'undefined') {
            this.showNotification('Please install MetaMask or another Web3 wallet', 'error');
            return;
        }
        
        try {
            this.showLoading(true);
            await window.ethereum.request({ method: 'eth_requestAccounts' });
            await this.setupProvider();
            this.updateWalletUI(true);
            await this.loadDashboard();
            this.showNotification('Wallet connected successfully!');
        } catch (error) {
            console.error('Wallet connection failed:', error);
            this.showNotification('Failed to connect wallet', 'error');
        } finally {
            this.showLoading(false);
        }
    }
    
    async setupProvider() {
        this.provider = new ethers.providers.Web3Provider(window.ethereum);
        this.signer = this.provider.getSigner();
        this.userAddress = await this.signer.getAddress();
        
        // Setup contract instances (you'll need to add the actual deployed addresses)
        // this.contracts.factory = new ethers.Contract(FACTORY_ADDRESS, FACTORY_ABI, this.signer);
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
        // This would load the user's agents from the blockchain
        // For now, we'll use mock data
        this.agents = [
            {
                id: 1,
                address: '0x1234...5678',
                balance: '0.5',
                sessionKeys: 2
            }
        ];
        
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
        try {
            this.showLoading(true);
            
            // This would call the actual contract
            // const tx = await this.contracts.factory.createBot(this.userAddress);
            // await tx.wait();
            
            // Mock success for now
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            this.showNotification('Agent created successfully!');
            await this.loadUserAgents();
        } catch (error) {
            console.error('Failed to create agent:', error);
            this.showNotification('Failed to create agent', 'error');
        } finally {
            this.showLoading(false);
        }
    }
    
    async grantSessionKey() {
        const sessionKeyAddress = document.getElementById('session-key-address').value;
        const functionSelector = document.getElementById('session-key-function').value;
        const duration = document.getElementById('session-key-duration').value;
        const allowance = document.getElementById('session-key-allowance').value;
        
        if (!sessionKeyAddress || !duration || !allowance) {
            this.showNotification('Please fill in all required fields', 'error');
            return;
        }
        
        try {
            this.showLoading(true);
            
            // This would call the actual contract
            // const validUntil = Math.floor(Date.now() / 1000) + (duration * 3600);
            // const valueLimit = ethers.utils.parseEther(allowance);
            // const tx = await this.contracts.sessionManager.authorizeSessionKey(...);
            // await tx.wait();
            
            // Mock success for now
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            this.showNotification('Session key granted successfully!');
            this.clearSessionKeyForm();
        } catch (error) {
            console.error('Failed to grant session key:', error);
            this.showNotification('Failed to grant session key', 'error');
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
                
                // This would send ETH to the agent wallet
                // const tx = await this.signer.sendTransaction({
                //     to: agentAddress,
                //     value: ethers.utils.parseEther(amount)
                // });
                // await tx.wait();
                
                // Mock success for now
                await new Promise(resolve => setTimeout(resolve, 1500));
                
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