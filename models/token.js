const mongoose = require("mongoose");
const tokenSchema=mongoose.Schema({
    token:{
        type:String,
        required:true
    },
    date_expiration:{
        type:Date,
        required:true
    },
    id_admin:{
        type:String,
        required:true
    }
}, { collection:'token' });
const Token=mongoose.model('Token',tokenSchema)
module.exports=Token;