const mongoose = require('mongoose');

   const openConnection=()=>{
        mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
          })
    }
    const closeConnection=()=>{
        mongoose.connection.close();
    }

module.exports={
    openConnection,
    closeConnection
}