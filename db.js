const mongoose = require('mongoose')

const openConnection = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        // console.log("Connected to ", process.env.MONGO_URI);
    } catch (error) {
        console.error("Connection error:", error);
    }
};



const closeConnection = () => {
  mongoose.connection.close()
}

module.exports = {
  openConnection,
  closeConnection
}
