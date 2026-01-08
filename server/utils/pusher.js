const Pusher = require('pusher');

const pusher = new Pusher({
  appId: "2013371",
  key: "562e97ac482dc6689524",
  secret: "079bd4e825345639a708",
  cluster: "ap2",
  useTLS: true,
});

module.exports = pusher;