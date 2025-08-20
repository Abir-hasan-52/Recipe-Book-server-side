const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

const app = express();
const port = process.env.PORT || 3000;

// middleware

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.kxazpdy.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();

    const recipesCollection = client.db("recipeDB").collection("recipes");

    const userCollection = client.db("recipeDB").collection("users");
    const savedRecipesCollection = client
      .db("recipeDB")
      .collection("savedRecipes");

    app.get("/recipes/top", async (req, res) => {
      try {
        const topRecipes = await recipesCollection
          .find({})
          .sort({ likeCount: -1 })
          .limit(6)
          .toArray();

        res.send(topRecipes);
      } catch (error) {
        res.status(500).send({ message: "Error fetching top recipes" });
      }
    });

    // app.get("/recipes/AllRecipes", async (req, res) => {
    //   const cursor = recipesCollection.find();
    //   const result = await cursor.toArray();
    //   res.send(result);
    // });

    app.get("/recipes/AllRecipes/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await recipesCollection.findOne(query);
      res.send(result);
    });

    // 1️⃣ Get all recipes
    app.get("/recipes/AllRecipes", async (req, res) => {
      const recipes = await recipesCollection.find().toArray();
      res.json(recipes);
    });
    // 2️⃣ Get single recipe
    app.get("/recipes/AllRecipes/:id", async (req, res) => {
      const id = req.params.id;
      const recipe = await recipesCollection.findOne({ _id: new ObjectId(id) });
      res.json(recipe);
    });

    // 3️⃣ Like a recipe
    app.patch("/recipes/like/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const recipe = await recipesCollection.findOne({
          _id: new ObjectId(id),
        });
        if (!recipe)
          return res.status(404).json({ message: "Recipe not found" });

        const result = await recipesCollection.findOneAndUpdate(
          { _id: new ObjectId(id) },
          { $inc: { likeCount: 1 } },
          { returnDocument: "after" }
        );

        res.json(result.value);
      } catch (err) {
        res.status(500).json({ message: err.message });
      }
    });

    // 4️⃣ Save recipe

    // app.post("/savedRecipes", async (req, res) => {
    //   const { userEmail, recipeId } = req.body;
    //   if (!userEmail || !recipeId)
    //     return res.status(400).json({ message: "Missing data" });

    //   const exists = await savedRecipesCollection.findOne({
    //     userEmail,
    //     recipeId: new ObjectId(recipeId),
    //   });
    //   if (exists)
    //     return res.status(400).json({ message: "Recipe already saved" });

    //   const result = await savedRecipesCollection.insertOne({
    //     userEmail,
    //     recipeId: new ObjectId(recipeId),
    //     createdAt: new Date(),
    //   });

    //   res.status(201).json(result);
    // });
    app.post("/savedRecipes", async (req, res) => {
      const recipe = req.body; // এখানে full object আসবে
      const result = await savedRecipesCollection.insertOne(recipe);
      res.send(result);
    });

    // Get all saved recipes for a user
    // app.get("/savedRecipes/:email", async (req, res) => {
    //   try {
    //     const { email } = req.params;
    //     const result = await savedRecipesCollection
    //       .aggregate([
    //         { $match: { userEmail: email } },
    //         {
    //           $lookup: {
    //             from: "recipes", // তোমার main recipes collection এর নাম
    //             localField: "recipeId",
    //             foreignField: "_id",
    //             as: "recipeDetails",
    //           },
    //         },
    //         { $unwind: "$recipeDetails" },
    //         {
    //           $project: {
    //             _id: 1,
    //             recipeId: 1,
    //             userEmail: 1,
    //             createdAt: 1,
    //             name: "$recipeDetails.name",
    //             image: "$recipeDetails.image",
    //             description: "$recipeDetails.description",
    //           },
    //         },
    //       ])
    //       .toArray();

    //     res.send(result);
    //   } catch (err) {
    //     res.status(500).json({ message: err.message });
    //   }
    // });

    app.get("/savedRecipes/:email", async (req, res) => {
      const email = req.params.email;
      const recipes = await savedRecipesCollection
        .find({ userEmail: email })
        .toArray();
      res.send(recipes);
    });

    // 6️⃣ Remove saved recipe
    app.delete("/savedRecipes/:id", async (req, res) => {
      try {
        const id = req.params.id;
        await savedRecipesCollection.deleteOne({ _id: new ObjectId(id) });
        res.json({ message: "Saved recipe removed" });
      } catch (err) {
        res.status(500).json({ message: err.message });
      }
    });

    app.put("/recipes/:id/like", async (req, res) => {
      const recipeId = req.params.id;
      const { userId } = req.body;

      try {
        const recipe = await recipesCollection.findOne({
          _id: new ObjectId(recipeId),
        });

        if (!recipe) {
          return res.status(404).send({ message: "Recipe not found." });
        }

        if (recipe.ownerId === userId) {
          return res
            .status(403)
            .send({ message: "You cannot like your own recipe." });
        }

        const result = await recipesCollection.updateOne(
          { _id: new ObjectId(recipeId) },
          { $inc: { likeCount: 1 } }
        );

        res.send({ message: "Like added successfully", result });
      } catch (error) {
        console.error(error);
        res.status(500).send({ message: "Failed to like the recipe." });
      }
    });

    app.get("/recipes", async (req, res) => {
      const cursor = recipesCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    app.get("/recipes/myRecipe", async (req, res) => {
      const filter = { likeCount: 0 };
      const cursor = recipesCollection.find(filter);
      const result = await cursor.toArray();
      res.send(result);
    });

    app.get("/recipes/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await recipesCollection.findOne(query);
      res.send(result);
    });
    app.put("/recipes/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updatedRecipe = req.body;
      const updatedDoc = {
        $set: updatedRecipe,
      };
      const result = await recipesCollection.updateOne(filter, updatedDoc);
      res.send(result);
    });

    app.post("/recipes", async (req, res) => {
      const newRecipe = req.body;
      console.log(newRecipe);
      const result = await recipesCollection.insertOne(newRecipe);
      res.send(result);
    });

    app.delete("/recipes/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await recipesCollection.deleteOne(query);
      res.send(result);
    });

    // user related APIs

    app.get("/user", async (req, res) => {
      const result = await userCollection.find().toArray();
      res.send(result);
    });

    app.post("/users", async (req, res) => {
      const userProfile = req.body;
      console.log(userProfile);
      const result = await userCollection.insertOne(userProfile);
      res.send(result);
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("recipe server is cooking.");
});

app.listen(port, () => {
  console.log(`recipe server is running on port ${port}`);
});
