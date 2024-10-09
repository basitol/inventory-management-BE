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
