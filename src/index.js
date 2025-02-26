const express = require('express');
const { Server } = require('http');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Import utilities
const { useEnv } = require('./utils/useEnv');
const { initNearContract } = require('./utils/nearContract');
const { initChains } = require('./utils/chains');
const { executeEvmTransaction } = require('./utils/evmTransactions');

// Environment variables with fallback to 3001
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;

// Create Express application
const app = express();

// Middleware setup
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Basic route that executes an EVM transaction
app.get('/', async (req, res) => {
  try {
    const { chainSigContract } = await initNearContract();
    const chains = initChains(chainSigContract);

    // Execute EVM transaction
    const txHash = await executeEvmTransaction({
      chainSigContract,
      evm: chains.evm,
      predecessorId: useEnv().nearAccount,
    });

    res.json({ 
      message: 'EVM transaction executed successfully', 
      txHash 
    });
  } catch (error) {
    console.error('Error executing EVM transaction:', error);
    res.status(500).json({ 
      error: 'Failed to execute EVM transaction',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

// Start the server
const server = app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

// Handle server shutdown gracefully
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});

module.exports = app; 