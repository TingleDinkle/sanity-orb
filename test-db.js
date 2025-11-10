import { testConnection } from './backend/config/database.js';
import DatabaseStorage from './backend/services/databaseStorage.js';

async function checkData() {
  const connected = await testConnection();
  if (connected) {
    const storage = new DatabaseStorage();
    const data = await storage.getCollectiveData(10, 24);
    console.log('Sample collective data:', JSON.stringify(data, null, 2));

    // Also check recent sessions
    const sessions = await storage.getRecentSessions(5);
    console.log('Recent sessions:', JSON.stringify(sessions, null, 2));
  } else {
    console.log('DB not connected');
  }
}

checkData().catch(console.error);
