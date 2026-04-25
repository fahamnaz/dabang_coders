import dotenv from 'dotenv';

// Loads the variables from the .env file
dotenv.config();
import mongoose from 'mongoose';


// Connect to MongoDB using the URI from your .env file
mongoose.connect("mongodb+srv://ronaksood:ronak123@cluster0.pindx3p.mongodb.net/gugglu?retryWrites=true&w=majority")
    .then(() => {
        console.log('Successfully connected to MongoDB!');
    })
    .catch((error) => {
        console.error('Error connecting to MongoDB:', error.message);
    });
