 
const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const dotenv = require("dotenv");
const { createRemoteJWKSet, jwtVerify } = require("jose-cjs");

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// MongoDB Connection
const uri = process.env.MONGODB_URI;

const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    },
});

const db = client.db("wanderlust");
const destinationCollection = db.collection("destinations");
const bookingCollection = db.collection("bookings");

app.get("/featured",async (req,res)=>{
    const result = await  destinationCollection.find().limit(4).toArray()
    res.json(result);
})

// Connect MongoDB once and reuse the connection
let dbConnectionPromise;

const connectToMongoDB = async () => {
    if (!dbConnectionPromise) {
        dbConnectionPromise = client.connect()
            .then(() => {
                console.log("MongoDB connected successfully!");
            })
            .catch((error) => {
                dbConnectionPromise = null;
                throw error;
            });
    }

    return dbConnectionPromise;
};

// Ensure MongoDB connection before handling requests
app.use(async (req, res, next) => {
    try {
        await connectToMongoDB();
        next();
    } catch (error) {
        console.error("MongoDB connection failed:", error);
        res.status(500).json({
            message: "Database connection failed"
        });
    }
});

// JWT Verification
const JWKS = createRemoteJWKSet(
    new URL(`${process.env.CLIENT_URL}/api/auth/jwks`)
);

const verifyToken = async (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    try {
        const { payload } = await jwtVerify(token, JWKS);
        console.log(payload);
        next();
    } catch (error) {
        console.error("JWT verification failed:", error);
        return res.status(403).json({ message: "Forbidden" });
    }
};

// Home route
app.get("/", (req, res) => {
    res.send("Server is running fine!");
});

// Destination routes
app.get("/destination", async (req, res) => {
    const result = await destinationCollection.find().toArray();
    res.json(result);
});

app.post("/destination", async (req, res) => {
    const destinationData = req.body;
    const result = await destinationCollection.insertOne(destinationData);
    res.json(result);
});

app.get("/destination/:id", verifyToken, async (req, res) => {
    const { id } = req.params;

    const result = await destinationCollection.findOne({
        _id: new ObjectId(id),
    });

    res.json(result);
});

app.patch("/destination/:id", async (req, res) => {
    const { id } = req.params;
    const updatedData = req.body;

    const result = await destinationCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: updatedData }
    );

    res.json(result);
});

app.delete("/destination/:id", async (req, res) => {
    const { id } = req.params;

    const result = await destinationCollection.deleteOne({
        _id: new ObjectId(id),
    });

    res.json(result);
});

// Booking routes
app.get("/booking/:userId", async (req, res) => {
    const { userId } = req.params;

    const result = await bookingCollection.find({ userId }).toArray();
    res.json(result);
});

app.post("/booking", verifyToken, async (req, res) => {
    const bookingData = req.body;
    const result = await bookingCollection.insertOne(bookingData);

    res.json(result);
});

app.delete("/booking/:bookingId", verifyToken, async (req, res) => {
    const { bookingId } = req.params;

    const result = await bookingCollection.deleteOne({
        _id: new ObjectId(bookingId),
    });

    res.json(result);
});

// Export Express app for Vercel
module.exports = app;

// Start server locally only
if (require.main === module && process.env.NODE_ENV !== "production") {
    const PORT = process.env.PORT || 5000;

    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
}
