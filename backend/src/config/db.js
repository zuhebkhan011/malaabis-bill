<<<<<<< HEAD
const dns = require("dns");
dns.setServers(["8.8.8.8", "1.1.1.1"]);

=======
>>>>>>> 8f307e9dc34d0fb8cabee8a6a53f983ecf55b3a9
const mongoose = require("mongoose");

const connectDB = async () => {
    try {
        await
        mongoose.connect(process.env.MONGO_URL,
            {
                serverSelectionTimeoutMS: 5000,
            }
        );
        console.log("mongoose connected successfully");
    } catch(error){
        console.log(error);

        process.exit(1);
    }
    };
module.exports = connectDB;