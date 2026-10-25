const mongoose = require("mongoose");
const dns = require("node:dns");

// Fix for "querySrv ECONNREFUSED" on some Windows machines/networks where
// Node doesn't correctly use the system DNS resolver for mongodb+srv lookups.
dns.setServers(["8.8.8.8", "1.1.1.1"]);

const connectDatabase = () => {
  mongoose
    .connect(process.env.DB_LOCAL_URI, {
      //   useNewUrlParser: true,
      //   useUnifiedTopology: true,
      //   useCreateIndex: true,
    })
    .then((con) => { 
      console.log(
        `MongoDB Database connected with HOST:${con.connection.host}`
      );
    })
    .catch((err) => {
      console.error("MongoDB connection error:", err.message);
    });
};
module.exports = connectDatabase;
