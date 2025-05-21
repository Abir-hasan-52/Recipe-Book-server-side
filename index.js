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
    await client.connect();

    const recipesCollection = client.db("recipeDB").collection("recipes");
    const topRecipes = [
      {
        id: 1,
        image:
          "https://i.ibb.co/YT0hXTF9/spaghetti-bolognese-106560-1.jpg",
        title: "Spaghetti Bolognese",
        ingredients: [
          "200g spaghetti",
          "2 tbsp olive oil",
          "1 onion, chopped",
          "2 garlic cloves, minced",
          "250g ground beef",
          "400g canned tomatoes",
          "Salt to taste",
          "Pepper to taste",
          "Parmesan cheese (optional)",
        ],
        instructions: [
          "Boil spaghetti and set aside.",
          "Sauté onions and garlic in olive oil.",
          "Add beef, cook until browned.",
          "Add tomatoes, simmer for 15 mins.",
          "Serve with spaghetti and cheese.",
        ],
        cuisineType: "Italian",
        preparationTime: 30,
        categories: ["Lunch", "Dinner"],
        likeCount: 154,
      },
      {
        id: 2,
        image:
          "https://www.recipetineats.com/wp-content/uploads/2018/04/Chicken-Tikka-Masala_0.jpg",
        title: "Chicken Tikka Masala",
        ingredients: [
          "500g chicken",
          "1 cup yogurt",
          "2 tbsp lemon juice",
          "Spices: cumin, paprika, cinnamon",
          "1 onion",
          "Garlic, ginger",
          "1 can tomato puree",
          "1 cup cream",
        ],
        instructions: [
          "Marinate chicken in yogurt and spices.",
          "Cook chicken in oven or grill.",
          "Sauté onions, garlic, ginger.",
          "Add tomato puree and cream.",
          "Add chicken and simmer.",
        ],
        cuisineType: "Indian",
        preparationTime: 60,
        categories: ["Lunch", "Dinner"],
        likeCount: 230,
      },
      {
        id: 3,
        image:
          "https://i.ibb.co/GQdxwYb3/images-4.jpg",
        title: "Vegetable Stir Fry",
        ingredients: [
          "Bell pepper",
          "Broccoli",
          "Carrots",
          "Snow peas",
          "Garlic",
          "Soy sauce",
          "Oyster sauce",
          "Sesame oil",
        ],
        instructions: [
          "Heat oil and sauté garlic.",
          "Add vegetables, stir fry for 5-7 mins.",
          "Add sauces and cook 2 more mins.",
        ],
        cuisineType: "Chinese",
        preparationTime: 20,
        categories: ["Lunch", "Dinner", "Vegan"],
        likeCount: 180,
      },
      {
        id: 4,
        image:
          "https://i.ibb.co/QvB3Zx2G/Beef-Tacos.webp",
        title: "Beef Tacos",
        ingredients: [
          "500g ground beef",
          "Taco seasoning",
          "Taco shells",
          "Lettuce",
          "Tomatoes",
          "Cheese",
          "Sour cream",
        ],
        instructions: [
          "Cook beef with taco seasoning.",
          "Warm taco shells.",
          "Assemble with toppings.",
        ],
        cuisineType: "Mexican",
        preparationTime: 25,
        categories: ["Lunch", "Dinner"],
        likeCount: 200,
      },
      {
        id: 5,
        image:
          "https://i.ibb.co/chqxLc2m/vegan-pancakes.jpg",
        title: "Vegan Pancakes",
        ingredients: [
          "Flour",
          "Sugar",
          "Baking powder",
          "Salt",
          "Almond milk",
          "Vegetable oil",
          "Vanilla extract",
        ],
        instructions: [
          "Mix dry ingredients.",
          "Add wet ingredients, mix.",
          "Cook pancakes on skillet.",
        ],
        cuisineType: "Others",
        preparationTime: 20,
        categories: ["Breakfast", "Vegan"],
        likeCount: 175,
      },
      {
        id: 6,
        image:
          "https://i.ibb.co/GQdxwYb3/images-4.jpg",
        title: "Vegetable Soup",
        ingredients: [
          "Olive oil",
          "Onion",
          "Garlic",
          "Carrots",
          "Celery",
          "Potatoes",
          "Canned tomatoes",
          "Vegetable broth",
          "Spinach or kale",
        ],
        instructions: [
          "Sauté onion and garlic.",
          "Add vegetables and broth.",
          "Simmer for 30 mins.",
          "Add greens and cook 5 more mins.",
        ],
        cuisineType: "Others",
        preparationTime: 40,
        categories: ["Lunch", "Dinner", "Vegan"],
        likeCount: 210,
      },
    ];

    app.get("/recipes/top", async (req, res) => {
      try {
        const topRecipes = await recipesCollection
          .find({})
          .sort({ likeCount: -1 }) // Sort by likes descending
          .limit(6) // Get top 6
          .toArray();

        res.send(topRecipes);
      } catch (error) {
        res.status(500).send({ message: "Error fetching top recipes" });
      }
    });

    app.get("/recipes", async (req, res) => {
      const cursor = recipesCollection.find();
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
