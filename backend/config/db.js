const dns = require('dns');
const mongoose = require('mongoose');

dns.setDefaultResultOrder('ipv4first');

const OPTIONS = { serverSelectionTimeoutMS: 10000 };
const PUBLIC_DNS = ['8.8.8.8', '1.1.1.1'];
const originalServers = dns.getServers();

function looksLikeDnsProblem(err) {
  const text = `${err && err.message} ${err && err.code} ${err && err.syscall}`;
  return /querySrv|queryTxt|ENOTFOUND|EAI_AGAIN|ETIMEOUT|ECONNREFUSED.*mongodb\.net/i.test(text);
}

async function attempt(uri) {
  try {
    await mongoose.disconnect();
  } catch {
    // nothing to disconnect
  }
  await mongoose.connect(uri, OPTIONS);
}

function connected() {
  console.log(`MongoDB connected (database: ${mongoose.connection.name})`);
}

async function connectDB() {
  const uri = process.env.MONGO_URI;
  const directUri = process.env.MONGO_URI_DIRECT;

  if (!uri && !directUri) {
    console.error('MONGO_URI is missing. Add it to backend/.env.');
    process.exit(1);
  }

  let lastError = null;

  if (uri) {
    // 1. Public DNS servers first (they answered correctly when you tested them)
    try {
      dns.setServers(PUBLIC_DNS);
      await attempt(uri);
      return connected();
    } catch (err) {
      lastError = err;
      if (!looksLikeDnsProblem(err)) {
        console.error('MongoDB connection failed:', err.message);
        console.error('Check the username and password in MONGO_URI, and that your IP is allowed in Atlas (Network Access).');
        process.exit(1);
      }
      console.log('Lookup through public DNS failed. Retrying with the default DNS servers...');
    }

    // 2. The computer's own DNS servers
    try {
      dns.setServers(originalServers);
      await attempt(uri);
      return connected();
    } catch (err) {
      lastError = err;
      if (!looksLikeDnsProblem(err)) {
        console.error('MongoDB connection failed:', err.message);
        process.exit(1);
      }
    }
  }

  // 3. The long connection string that needs no SRV lookup (optional)
  if (directUri) {
    try {
      console.log('Trying the direct connection string (MONGO_URI_DIRECT)...');
      await attempt(directUri);
      return connected();
    } catch (err) {
      lastError = err;
    }
  }

  console.error('\nMongoDB connection failed:', lastError && lastError.message);
  console.error('Add MONGO_URI_DIRECT (a connection string with no SRV lookup) to backend/.env. See the steps in the chat.');
  process.exit(1);
}

module.exports = connectDB;