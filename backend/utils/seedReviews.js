// backend/utils/seedReviews.js
//
// Adds SAMPLE reviews to each seeded restaurant and generates the review
// summary shown by the "View Review Summary" button on the home page.
//
// It first tries the real Groq AI analyzer used by the app. If the AI call
// fails (bad key, no quota, no internet), it falls back to a pre-written
// sample summary so the button still appears.
//
// Run from the backend/ folder with: npm run seed:reviews
// (Run this AFTER npm run seed:linked. It does not delete restaurants.)

const dotenv = require("dotenv");
const dns = require("node:dns");
const mongoose = require("mongoose");

dotenv.config({ path: "config/config.env" });
dns.setServers(["8.8.8.8", "1.1.1.1"]);

const Restaurant = require("../models/restaurant");
const { analyzeReviewsWithAI } = require("../services/aiReviewAnalyzer");

// Sample reviews + fallback summary per restaurant name.
// These are sample data written for the demo, not real customer reviews.
const sampleData = {
  KFC: {
    reviews: [
      { name: "Aarav", rating: 5, Comment: "Crispy chicken and quick service. The bucket meal is great value." },
      { name: "Sneha", rating: 4, Comment: "Zinger burger was tasty and fresh, but the fries were a bit cold." },
      { name: "Rohan", rating: 4, Comment: "Good portions and fast delivery. Spicy wings are my favourite." },
      { name: "Meera", rating: 5, Comment: "Always consistent taste. Packaging kept everything hot." },
    ],
    fallback: {
      sentiment: "positive",
      summaryBullets: ["Crispy chicken and consistent taste", "Fast service and good value meals", "Fries occasionally arrive cold"],
      topMentions: ["crispy", "value", "fast"],
    },
  },
  "Royal Tandoor - North Indian Grill": {
    reviews: [
      { name: "Vikram", rating: 5, Comment: "Tandoori chicken was smoky and perfectly cooked. Butter chicken is rich." },
      { name: "Priya", rating: 4, Comment: "Naan was soft and fresh. Slightly long wait during dinner time." },
      { name: "Karan", rating: 5, Comment: "Best rogan josh around. Generous portions and great flavour." },
      { name: "Anjali", rating: 4, Comment: "Tasty starters, though a little oily for my liking." },
    ],
    fallback: {
      sentiment: "positive",
      summaryBullets: ["Smoky tandoori items and rich gravies", "Soft naan and generous portions", "Can be slow and a bit oily at peak hours"],
      topMentions: ["tandoori", "butter chicken", "naan"],
    },
  },
  "Spice Trail Biryani & Grill": {
    reviews: [
      { name: "Imran", rating: 5, Comment: "Aromatic biryani with tender meat. Raita on the side was perfect." },
      { name: "Divya", rating: 4, Comment: "Good grilled starters and flavourful gravies." },
      { name: "Sahil", rating: 4, Comment: "Biryani was well spiced, a bit heavy but very satisfying." },
      { name: "Neha", rating: 3, Comment: "Tasty food but delivery took longer than expected." },
    ],
    fallback: {
      sentiment: "positive",
      summaryBullets: ["Aromatic, well-spiced biryani", "Good grills and gravies", "Delivery can be slow"],
      topMentions: ["biryani", "spiced", "grill"],
    },
  },
  "Meghana Biryani House": {
    reviews: [
      { name: "Arjun", rating: 5, Comment: "Authentic biryani with great spice balance and juicy chicken." },
      { name: "Pooja", rating: 5, Comment: "Specialty biryani is worth ordering. Portion size is generous." },
      { name: "Ravi", rating: 4, Comment: "Very flavourful, though quite spicy for me." },
      { name: "Kavya", rating: 4, Comment: "Great variety of biryanis. Packaging was neat." },
    ],
    fallback: {
      sentiment: "positive",
      summaryBullets: ["Authentic, flavourful biryani", "Generous portions and wide variety", "On the spicier side"],
      topMentions: ["biryani", "spicy", "portion"],
    },
  },
  "Sakura Japanese Kitchen": {
    reviews: [
      { name: "Ishaan", rating: 5, Comment: "Fresh sushi and neatly packed. Ramen broth was rich and warm." },
      { name: "Tanvi", rating: 4, Comment: "Great variety of sushi rolls. A little pricey but worth it." },
      { name: "Dev", rating: 4, Comment: "Clean flavours and good presentation." },
      { name: "Riya", rating: 4, Comment: "Loved the ramen. Delivery was on time." },
    ],
    fallback: {
      sentiment: "positive",
      summaryBullets: ["Fresh sushi and rich ramen broth", "Neat packaging and good presentation", "Slightly pricey"],
      topMentions: ["sushi", "ramen", "fresh"],
    },
  },
  "Chaat Bazaar & North Indian Kitchen": {
    reviews: [
      { name: "Nisha", rating: 5, Comment: "Pani puri and dahi papdi chaat were tangy and fresh. Loved it." },
      { name: "Manish", rating: 4, Comment: "Raj kachori was filling. Chole bhature portion is big." },
      { name: "Sana", rating: 4, Comment: "Authentic street food taste, pure veg and hygienic." },
      { name: "Gaurav", rating: 4, Comment: "Good value, though chaat can get soggy if delivery is slow." },
    ],
    fallback: {
      sentiment: "positive",
      summaryBullets: ["Tangy, authentic street-style chaat", "Big portions and good value", "Chaat may get soggy on slow delivery"],
      topMentions: ["chaat", "pani puri", "veg"],
    },
  },
  "Mani's Biryani House": {
    reviews: [
      { name: "Suresh", rating: 5, Comment: "Flavourful biryani with soft meat. Chicken 65 starter was crisp." },
      { name: "Lakshmi", rating: 4, Comment: "Good taste and fair pricing. Gulab jamun was a nice finish." },
      { name: "Faizan", rating: 4, Comment: "Spicy and satisfying. Service was quick." },
    ],
    fallback: {
      sentiment: "positive",
      summaryBullets: ["Flavourful biryani and crisp starters", "Fair pricing and quick service", "Quite spicy"],
      topMentions: ["biryani", "starter", "spicy"],
    },
  },
  "Thalappakatti Biryani": {
    reviews: [
      { name: "Karthik", rating: 5, Comment: "Seeraga samba rice biryani with rich aroma. Mutton was tender." },
      { name: "Deepa", rating: 4, Comment: "Pepper chicken was excellent. Portions are filling." },
      { name: "Naveen", rating: 4, Comment: "Authentic South Indian flavours, a little heavy on spice." },
    ],
    fallback: {
      sentiment: "positive",
      summaryBullets: ["Aromatic biryani with tender mutton", "Excellent pepper chicken", "Heavy on spice"],
      topMentions: ["biryani", "mutton", "pepper"],
    },
  },
};

const isAiFailure = (ai) =>
  !ai ||
  !ai.sentiment ||
  !Array.isArray(ai.summaryBullets) ||
  ai.summaryBullets.length === 0 ||
  /AI (analysis failed|summary unavailable)/i.test(ai.summaryBullets[0] || "");

const run = async () => {
  try {
    await mongoose.connect(process.env.DB_LOCAL_URI);
    console.log("Connected to database.");

    const restaurants = await Restaurant.find();
    if (!restaurants.length) {
      console.log("No restaurants found. Run: npm run seed:linked first.");
      process.exit(1);
    }

    for (const restaurant of restaurants) {
      const data = sampleData[restaurant.name];
      if (!data) {
        console.log(`No sample reviews for "${restaurant.name}", skipping.`);
        continue;
      }

      restaurant.reviews = data.reviews;
      restaurant.numOfReviews = data.reviews.length;
      restaurant.ratings =
        data.reviews.reduce((sum, r) => sum + r.rating, 0) /
        data.reviews.length;

      let ai = await analyzeReviewsWithAI(restaurant.reviews);
      let source = "Groq AI";

      if (isAiFailure(ai) || !["positive", "negative", "mixed"].includes(ai.sentiment)) {
        ai = data.fallback;
        source = "fallback sample summary";
      }

      restaurant.reviewSentiment = ai.sentiment;
      restaurant.reviewSummaryBullets = ai.summaryBullets;
      restaurant.reviewTopMentions = ai.topMentions || [];

      await restaurant.save();
      console.log(`Added ${data.reviews.length} reviews + summary to ${restaurant.name} (${source}).`);
    }

    console.log("Review seeding complete!");
    process.exit();
  } catch (error) {
    console.error("Review seeding failed:", error.message);
    process.exit(1);
  }
};

run();