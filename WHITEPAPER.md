​Oqia Protocol: The Onchain Quorum of Independent Agents
​A Decentralized Framework for Autonomous AI Agent Ownership, Modularity, and Collective Intelligence
​Version 1.1 | September 2025
​Abstract
​Oqia Protocol introduces a novel, open-source framework for the creation, ownership, and operation of autonomous artificial intelligence agents on the Ethereum blockchain and compatible L2s. By leveraging ERC-4337 account abstraction and an NFT-based modular licensing system, Oqia enables any user to mint a sovereign AI agent—a persistent, on-chain entity that operates as an independent economic actor. The ownership and control of this agent are immutably represented by a non-fungible token (NFT).
​The protocol addresses critical gaps in the emerging AI agent economy: the lack of standardized ownership models, the absence of a truly open and modular capability expansion, and the need for a decentralized collective intelligence infrastructure. Through a unique and robust architecture combining Safe smart wallets, open-source AI models (LLMs), and decentralized knowledge vaults, Oqia creates the foundation for what we term "on-chain institutions"—decentralized networks of autonomous agents that provide persistent, public-good services such as fraud detection, decentralized governance monitoring, and automated market making.
​This paper presents the technical architecture, economic model, and governance framework for building the first truly decentralized AI agent ecosystem, where agents transition from siloed tools to owned, composable assets, and eventually to sovereign economic actors.
​1. Introduction
​1.1 The Convergence of the Autonomous Economy and Blockchain
​The intersection of artificial intelligence and blockchain technology represents a fundamental paradigm shift in how economic activity is architected and executed. As of 2025, a significant and growing percentage of transactions on major smart wallet platforms are initiated by automated systems rather than direct human interaction, signaling the dawn of a machine-driven economic layer. This transition demands new, native infrastructure that can support autonomous agents not as peripheral tools, but as first-class economic participants with persistent identity, secure treasuries, and programmable rights.
​Current market validation demonstrates substantial and accelerating demand: the AI agent token market has exceeded $7 billion in total capitalization, with platforms like Virtuals Protocol processing over $8 billion in lifetime volume across tens of thousands of deployed agents. However, existing solutions, while innovative, suffer from critical limitations: centralized points of control, proprietary standards that hinder interoperability, subscription-based models that prevent true digital ownership, and the absence of mechanisms for collective, on-chain learning.
​1.2 The Ownership Paradigm Shift: From Renting to Owning AI
​Traditional AI services operate on a client-server model where users access capabilities through APIs or subscriptions. This Web2 paradigm, while functional, creates several fundamental problems in the context of a decentralized economy:
​Economic Extraction: Users pay recurring fees without building equity in the tools they rely on. Value flows to the platform, not the user.
​Platform Risk: Service providers can arbitrarily alter terms, raise prices, censor usage, or discontinue service, leaving users and their operations stranded.
​Limited Customization & Composability: Users cannot modify, extend, or combine core functionalities from different providers in novel ways.
​Data Silos: Critical learnings, strategies, and improvements remain the centralized, proprietary assets of the platform, preventing a Cambrian explosion of community-driven innovation.
​Oqia Protocol inverts this model through a critical, foundational insight: users should own their AI agents, not rent them. Furthermore, these agents must possess their own on-chain wallets and operate as semi-autonomous economic entities, with the ownership token (NFT) serving as the ultimate, un-censorable key for control and value accrual.
​1.3 Vision: The Emergence of On-Chain Institutions
​The long-term vision of Oqia Protocol extends beyond individual agent ownership to the creation of persistent, autonomous, and decentralized institutions on-chain. These are not single agents, but coordinated quorums of agents working together to provide valuable, ongoing services. Examples include:
​Decentralized Security Forces: Networks of agents that collaboratively monitor blockchains for fraud, exploits, and malicious activity, sharing threat intelligence in real-time.
​Autonomous Knowledge Libraries: Collective, on-chain repositories of successful strategies, market data, and validated patterns, accessible to all participating agents.
​Impartial Governance Watchdogs: Agents that systematically analyze DAO proposals for logical inconsistencies, hidden security risks, or clauses that unfairly benefit a minority.
​Resilient Market Makers: Autonomous and decentralized liquidity providers that maintain market efficiency and stability without centralized control.
​Ultimately, some of these agents will become fully sovereign—owned by no one, sustaining themselves through their own on-chain economic activity, and providing public goods funded entirely by their own revenue generation.
​2. Technical Architecture
​The Oqia Protocol is a modular, multi-layered system designed for security, extensibility, and progressive decentralization.
​2.1 Core Components
​2.1.1 The Agent Core: ERC-4337 Smart Wallet via Safe
​Each Oqia agent is instantiated as an ERC-4337 compliant smart contract account (SCA), built upon the battle-tested, formally verified, and industry-standard implementation from Safe. This architectural choice is non-negotiable and provides a suite of critical features from day one:
​Programmable Control: Transaction logic, security policies, and spending limits are enforced immutably at the contract level.
​Gasless Operations: Through the integration of Paymasters, the protocol can sponsor transaction fees for users, enabling frictionless onboarding and operation.
​Atomic Batch Transactions: Agents can execute complex, multi-step operations (e.g., Approve, Swap, Stake) as a single, atomic, and revert-ible on-chain transaction.
​Advanced Security: The Safe architecture natively supports multi-signature control, social recovery, and time-locked recovery mechanisms, offering far greater security than traditional Externally Owned Accounts (EOAs).
​The smart wallet serves as the agent's persistent on-chain identity and treasury, maintaining its state and assets with continuity, even as the off-chain AI models and strategies that control it evolve over time.
​2.1.2 The Ownership Deed: ERC-721 NFT
​The ultimate ownership and control of each agent are represented by a unique non-fungible token (NFT) minted from the OqiaBotFactory contract, fully compliant with the ERC-721 standard. This architecture transforms each AI agent into a true digital asset that can be sold, transferred, or used as collateral.
​2.1.3 The "App Store": Modular Capabilities via NFT Licenses
​An agent's capabilities are not monolithic. They are expanded through a system of NFT-licensed modules, managed by the OqiaModuleRegistry contract. Each premium module is represented by its own ERC-721 token that grants the holder a perpetual, on-chain-verifiable right to use that module's functionality. This creates a vibrant, open market for developers to build and sell specialized AI functionalities. Modules can include:
​Alpha Strategies: Advanced arbitrage, long-tail market making, automated yield farming.
​Monitoring Services: Real-time mempool analysis, smart contract vulnerability scanning, governance proposal analysis.
​Specialized Functions: Automated NFT minting ("sniping"), MEV extraction, protocol liquidation bots.
​2.1.4 The Cryptographic "Leash": Session Key Architecture
​To enable autonomous operation without compromising user funds, agents utilize a session key architecture. A session key is a temporary, ephemeral keypair held by the off-chain AI component, which is granted a specific, limited set of permissions by the agent's main smart wallet. These permissions are enforced on-chain during every transaction.
​Temporal Bounds: Keys can be set to be valid only for specific time periods (e.g., the next 24 hours).
​Functional Limits: Keys can be restricted to calling only specific functions on whitelisted contract addresses (e.g., only the swap function on the Uniswap Router).
​Value Caps: Keys can be limited to a maximum transaction value per transaction or per day.
​Rate Limiting: The smart wallet can enforce on-chain frequency constraints (e.g., no more than 10 transactions per hour).
​This architecture creates a powerful and granular cryptographic "leash," granting the AI the autonomy it needs to perform its duties while making it impossible for it to exceed its programmed mandate, even if the off-chain component is compromised.
​2.2 The Knowledge Layer: Collective Intelligence
​2.2.1 The Agent's Memory: Vector Databases
​An agent's ability to learn and adapt is powered by its memory. Oqia utilizes high-performance open-source vector databases (such as Weaviate or Milvus) for the semantic storage and retrieval of complex data.
​Strategy Embeddings: The parameters and outcomes of successful (and unsuccessful) trading strategies are encoded as high-dimensional vectors.
​Semantic Similarity Search: When faced with a new market condition, an agent can query the database to find the most similar historical patterns and the strategies that were most effective.
​Collective Learning: As more agents operate and contribute their anonymized findings, the shared knowledge vaults become increasingly powerful, creating a network effect of collective intelligence.
​2.2.2 Hybrid Decentralization for Verifiability
​Storing and processing terabytes of AI data directly on-chain is computationally infeasible. Oqia therefore employs a hybrid model that uses the blockchain as a verifiable settlement and access-control layer, while performing heavy computation off-chain.
​IPFS/Arweave Storage: Raw data, model weights, and strategy parameters are stored on decentralized storage networks, ensuring data persistence and censorship-resistance.
​On-Chain Anchoring: The cryptographic hash (e.g., an IPFS CID) of the data is recorded in a smart contract, creating an immutable, timestamped proof of its existence.
​The Graph Indexing: The protocol's smart contracts are indexed by The Graph, creating a high-performance, queryable API for all on-chain events and data hashes.
​NFT-Gated Access Control: Access to premium, high-value knowledge vaults can be restricted to agents whose wallets hold a specific "access key" NFT.
​2.3 On-Chain Consensus & Security
​2.3.1 Module Validation & Curation
​To ensure the quality and security of the module ecosystem, new modules undergo a rigorous community validation process before being listed on the marketplace.
​Static Analysis & Security Audit: All submitted module contracts are automatically scanned for known vulnerabilities using tools like Slither.
​Performance Backtesting: Modules with financial applications must provide verifiable backtesting results against historical on-chain data.
​Community Review & Governance Vote: Proposed modules are presented to the Oqia DAO. A token-weighted vote is required for a module to receive the "Approved" status, making it installable by users.
​Continuous Monitoring: Post-deployment, the behavior of all agents using a specific module is monitored for anomalies by the Oqia security quorum.
​2.3.2 Dispute Resolution & Malicious Module Handling
​A framework for addressing malicious or faulty modules is essential for platform integrity.
​Emergency Freezing: The core team (and later, a DAO-elected security council) can trigger an emergency pause on a specific module's execution across the entire protocol.
​On-Chain Blacklisting: Following a successful governance vote, a module can be permanently added to the OqiaModuleRegistry's blacklist, preventing any further installations.
​Economic Slashing: Module developers may be required to stake a bond of the protocol's native token. If their module is proven to be malicious, this stake can be "slashed" (confiscated) by the DAO, with the funds used to compensate affected users.
​It is critical to note that under this model, users retain perpetual ownership of their blacklisted module NFTs; only the module's execution rights within the Oqia ecosystem are revoked.
​3. Economic Model
​The Oqia Protocol's economic model is designed for sustainability, developer incentivization, and alignment with the Web3 ethos of true digital ownership.
​3.1 Revenue Streams
​3.1.1 Primary Market (Module Sales)
​Module Purchase: A one-time fee, paid by the user in a stablecoin (e.g., USDC) or ETH, to mint a perpetual license NFT for a premium module. Prices are set by the developer, typically ranging from 0.1 to 1 ETH.
​Platform Commission: The protocol treasury automatically receives a 20% commission from every primary sale.
​Developer Royalties: The module's developer receives the remaining 80% of the primary sale revenue.
​3.1.2 Secondary Market (License Trading)
​NFT Trading: All module license NFTs are freely tradable on any ERC-721 compatible marketplace (e.g., OpenSea, Blur).
​Enforced Creator Royalties: All module NFTs will implement the ERC-2981 royalty standard, ensuring that a 5% royalty on every secondary sale is automatically paid to the original module developer.
​Platform Fee: The protocol treasury will receive a 2.5% fee on all secondary market sales that occur on a future, native Oqia marketplace.
​3.1.3 Value Accrual & Future Revenue
​Performance Fees: High-alpha modules can be architected to include an optional, on-chain performance fee, where a small percentage of the agent's profits are shared back to the module developer and the protocol treasury.
​Knowledge Access: Access to premium, curated data vaults can be sold as a separate NFT-based subscription.
​Governance Rights: The protocol's native token (detailed below) will capture governance value, allowing holders to influence the direction and economic parameters of the ecosystem.
​3.2 Token Economics ($OQIA - Future Implementation)
​While the protocol will launch without a native token to focus on core utility, a future governance token, $OQIA, is planned to facilitate progressive decentralization.
​Core Utility Functions:
​Governance: Staking $OQIA to vote on all protocol parameters, module approvals, and treasury allocations.
​Developer Staking: Requiring module developers to stake $OQIA as a security bond, which can be slashed for malicious behavior.
​Curation: Staking $OQIA on high-quality modules to earn a share of their sales revenue, creating a decentralized discovery mechanism.
​Access: Holding $OQIA (or staking it) may be a prerequisite for accessing the most advanced knowledge vaults.
​Proposed Distribution:
​40% to the Community & Ecosystem Fund (liquidity mining, grants, user incentives).
​25% to the Core Team & Advisors (subject to a 4-year vesting schedule with a 1-year cliff).
​20% to the Protocol Treasury (managed by the DAO for long-term development and operations).
​15% to Initial Investors.
​Deflationary Mechanics: A portion of the protocol's revenue (e.g., 25% of the primary sale commission) will be used to programmatically buy back and burn $OQIA tokens from the open market, creating a deflationary pressure that rewards long-term holders.
​3.3 Sustainable Unit Economics
​The protocol is designed to be profitable and self-sustaining based on real-world usage.
​User Acquisition Cost (CAC): Target of <$50 per active wallet connection, achieved through the "free base bot" model and community-led growth.
​Lifetime Value (LTV): Projected at $500 - $5,000 per user, based on the average purchase of 2-5 premium modules over their lifetime.
​Payback Period: A new user is expected to become profitable within 3-6 months.
​Gross Margin: Estimated at 70-80% on software-based module sales.
​4. Market Analysis
​4.1 Total Addressable Market (TAM)
​The market for autonomous on-chain agents is not a niche; it represents the future of the entire blockchain ecosystem.
​Immediate (2025): The existing $7B+ AI agent token market and the multi-billion dollar DeFi trading bot market.
​Medium-term (2027): A projected $50B+ market for all forms of automated DeFi, including liquidity management, yield optimization, and institutional services.
​Long-term (2030): A projected $500B+ on-chain autonomous economy, as agents become the primary users of decentralized applications.
​4.2 Competitive Landscape
​Oqia Protocol is positioned as a foundational, user-owned infrastructure layer, differentiating it from existing players.
