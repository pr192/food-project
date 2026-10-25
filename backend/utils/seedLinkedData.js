// backend/utils/seedLinkedData.js
//
// Seeds the database using the REAL, linked food item + menu data
// (data/foodItem.json + data/menus.json), preserving the original menu
// category structure (e.g. "Chaats", "Biryani Varities", "KFC Meal").
// Since no restaurant-name file was provided, each of the 8 restaurant IDs
// referenced in menus.json is given a sensible name/address based on what
// it actually sells.
//
// Run from the backend/ folder with: npm run seed:linked

const dotenv = require("dotenv");
const dns = require("node:dns");
const mongoose = require("mongoose");

dotenv.config({ path: "config/config.env" });
dns.setServers(["8.8.8.8", "1.1.1.1"]);

const Restaurant = require("../models/restaurant");
const Menu = require("../models/menu");
const FoodItem = require("../models/foodItem");

const foodItemsRaw = require("../data/foodItem.json");
const menusRaw = require("../data/menus.json");

// Extract a plain id string whether it's "abc123" or { "$oid": "abc123" }
const oid = (x) => (typeof x === "string" ? x : x.$oid);

// Restaurant metadata, keyed by the original restaurant _id found in
// menus.json. Names/addresses assigned based on what each one sells.
const restaurantMeta = {
  "66716cb0e1a78e67dc8c8dbf": {
    name: "Chaat Bazaar & North Indian Kitchen",
    isVeg: true,
    address: "22 Aminabad Market, Lucknow, Uttar Pradesh",
    coordinates: [80.9106, 26.8489],
  },
  "6671719fe1a78e67dc8c8dce": {
    name: "Mani's Biryani House",
    isVeg: false,
    address: "17 Alambagh, Lucknow, Uttar Pradesh",
    coordinates: [80.9004, 26.8148],
  },
  "667167a4a0215dd827e9d81e": {
    name: "Thalappakatti Biryani",
    isVeg: false,
    address: "9 Rajajipuram, Lucknow, Uttar Pradesh",
    coordinates: [80.8843, 26.8598],
  },
  "667164e6bd4249c429fee778": {
    name: "KFC",
    isVeg: false,
    address: "3 Gomti Nagar Extension, Lucknow, Uttar Pradesh",
    coordinates: [81.0169, 26.8626],
  },
  "66716f8c945c5a8b80d4631e": {
    name: "Royal Tandoor - North Indian Grill",
    isVeg: false,
    address: "5 Hazratganj, Lucknow, Uttar Pradesh",
    coordinates: [80.9346, 26.8515],
  },
  "667176756b69467538f24983": {
    name: "Spice Trail Biryani & Grill",
    isVeg: false,
    address: "40 Chowk, Lucknow, Uttar Pradesh",
    coordinates: [80.9066, 26.8663],
  },
  "66717b16e1a78e67dc8c8df1": {
    name: "Meghana Biryani House",
    isVeg: false,
    address: "31 Indira Nagar, Lucknow, Uttar Pradesh",
    coordinates: [81.0002, 26.8756],
  },
  "667158dec45b2f6c5ad027d3": {
    name: "Sakura Japanese Kitchen",
    isVeg: false,
    address: "14 Vibhuti Khand, Lucknow, Uttar Pradesh",
    coordinates: [81.0056, 26.8601],
  },
};

const placeholderImage = (label, bg) => [
  {
    public_id: `demo_${label.toLowerCase().replace(/[^a-z0-9]+/g, "_")}`,
    url: `https://placehold.co/500x400/${bg}/ffffff?text=${encodeURIComponent(
      label
    )}`,
  },
];

const seed = async () => {
  try {
    await mongoose.connect(process.env.DB_LOCAL_URI);
    console.log("Connected to database.");

    console.log("Clearing existing Restaurant, Menu, FoodItem data...");
    await Restaurant.deleteMany();
    await Menu.deleteMany();
    await FoodItem.deleteMany();

    // Index raw food items by their original _id for quick lookup
    const foodById = {};
    for (const item of foodItemsRaw) {
      foodById[oid(item._id)] = item;
    }

    for (const menuDocRaw of menusRaw) {
      const restaurantOldId = oid(menuDocRaw.restaurant);
      const meta = restaurantMeta[restaurantOldId];

      if (!meta) {
        console.warn(`No metadata for restaurant ${restaurantOldId}, skipping.`);
        continue;
      }

      const restaurant = await Restaurant.create({
        name: meta.name,
        isVeg: meta.isVeg,
        address: meta.address,
        location: { type: "Point", coordinates: meta.coordinates },
        images: placeholderImage(meta.name, "ea580c"),
        ratings: 4,
      });

      const menuCategories = [];

      for (const cat of menuDocRaw.menu) {
        const itemIds = [];

        for (const rawItemRef of cat.items) {
          const oldId = oid(rawItemRef);
          const raw = foodById[oldId];

          if (!raw) {
            console.warn(`  Food item ${oldId} not found, skipping.`);
            continue;
          }

          const foodItem = await FoodItem.create({
            name: raw.name,
            price: raw.price,
            description: raw.description,
            ratings: raw.ratings || 0,
            images:
              raw.images && raw.images.length
                ? raw.images
                : placeholderImage(raw.name, "f97316"),
            stock: raw.stock ?? 50,
            numOfReviews: raw.numOfReviews || 0,
            reviews: raw.reviews || [],
            restaurant: restaurant._id,
          });

          itemIds.push(foodItem._id);
        }

        menuCategories.push({ category: cat.category, items: itemIds });
      }

      const menuDoc = await Menu.create({
        menu: menuCategories,
        restaurant: restaurant._id,
      });

      await FoodItem.updateMany(
        { restaurant: restaurant._id },
        { $set: { menu: menuDoc._id } }
      );

      const totalItems = menuCategories.reduce(
        (sum, c) => sum + c.items.length,
        0
      );
      console.log(`Seeded ${meta.name} with ${totalItems} items across ${menuCategories.length} categories.`);
    }

    console.log("Linked real-data seeding complete!");
    process.exit();
  } catch (error) {
    console.error("Seeding failed:", error.message);
    process.exit(1);
  }
};

seed();
