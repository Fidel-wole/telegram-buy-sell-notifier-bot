import { Telegraf } from 'telegraf';
import Web3 from 'web3';
import cron from 'node-cron';
import dotenv from 'dotenv';


dotenv.config();
// Replace with your bot's token
const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;

// Initialize Telegraf for Telegram bot
const bot = new Telegraf(TELEGRAM_TOKEN);

// Initialize Web3 with your blockchain provider
const web3 = new Web3(process.env.WEB3_PROVIDER_URL);

// Set to store chat IDs of groups the bot is in
const groupChatIds = new Set();

// Command handler for the /start command
bot.start((ctx) => {
  groupChatIds.add(ctx.chat.id);
  ctx.reply('Hello! I will notify you of buy/sell transactions.');
});

// Function to monitor transactions
const monitorTransactions = async () => {
  try {
    const latestBlock = await web3.eth.getBlock('latest', true);

    for (const tx of latestBlock.transactions) {
      const valueInWei = BigInt(tx.value); 
      const txDetails = {
        hash: tx.hash,
        from: tx.from,
        to: tx.to,
        value: web3.utils.fromWei(valueInWei.toString(), 'ether'),  
        timestamp: new Date(Number(latestBlock.timestamp) * 1000).toISOString(),  
      };

      // Placeholder logic for buy/sell detection
      // This would typically involve smart contract interactions or token transfers
      // Here i assume a "buy" is when value is greater than 0 and "sell" is based on a specific condition
      const transactionType = valueInWei > BigInt(0) ? 'Buy' : 'Sell';  

      // Notify groups
      await notifyGroups(transactionType, txDetails);
    }
  } catch (error) {
    console.error('Error monitoring transactions:', error);
  }
};

// Function to notify groups of a transaction
const notifyGroups = async (transactionType, details) => {
  const message = `
📈 *Transaction Alert* 📉

💰 *Type:* ${transactionType}
🔗 *Transaction Hash:* \`${details.hash}\`
🕒 *Timestamp:* ${details.timestamp}
👤 *From:* \`${details.from}\`
🏷 *To:* \`${details.to}\`
💸 *Value:* ${details.value} ETH
  `;

  try {
    for (const chatId of groupChatIds) {
      await bot.telegram.sendMessage(chatId, message, { parse_mode: 'Markdown' });
    }
  } catch (error) {
    console.error('Error sending message:', error);
  }
};


bot.launch();


cron.schedule('* * * * *', monitorTransactions);

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
