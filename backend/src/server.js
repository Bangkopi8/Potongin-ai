const app = require('./app');
const { env } = require('./config/env');

const PORT = env.PORT;

app.listen(PORT, () => {
  console.log(`Potongin AI backend listening on port ${PORT}`);
});
