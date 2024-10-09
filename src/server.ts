// import {app, startServer} from './app';
// import connectDB from './config/db';

// const PORT = process.env.PORT || 5000;

// async function bootServer() {
//   try {
//     // Ensure database connection is established
//     await connectDB();
//     console.log('Database connection established');

//     // Perform other startup tasks
//     await startServer();
//     console.log('Server startup tasks completed');

//     // Start listening for requests
//     app.listen(PORT, () => {
//       console.log(`Server running on port ${PORT}`);
//     });
//   } catch (error) {
//     console.error('Failed to start server:', error);
//     process.exit(1);
//   }
// }

// bootServer();

import {app, startServer} from './app';

const PORT = process.env.PORT || 5000;

async function bootServer(): Promise<void> {
  try {
    await startServer();
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

bootServer().catch(error => {
  console.error('Unhandled error during server boot:', error);
  process.exit(1);
});
