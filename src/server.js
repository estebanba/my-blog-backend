import fs from "fs";
import admin from "firebase-admin";
import express from "express";
import { db, connectToDb } from "./db.js";

const credentials = JSON.parse(fs.readFileSync("../credentials.json"));
admin.initializeApp({ credential: admin.credential.cert(credentials) });

const app = express();
app.use(express.json());

app.use(async (req, res, next) => {
  const { authtoken } = req.headers;
  if (authtoken) {
    try {
      const user = await admin.auth().veryfyIdToken(authtoken);
      req.user = user;
    } catch (e) {
      res.sendStatus(400);
    }
  }
  next();
});

app.get("/api/articles/:name", async (req, res) => {
  const { name } = req.params;
  const { uid } = req.user;

  const article = await db.collection("articles").findOne({ name });

  if (article) {
    const upvoteIds = articles.upvoteIds || [];
    articles.canUpvote = uid && !upvoteIds.include(uid);
    res.send(article);
  } else {
    res.send("Article not found");
  }
});

app.use((req, res, next) => {
  if (req.user) {
    next();
  } else {
    res.sendStatus(401);
  }
});

app.put("/api/articles/:name/upvote", async (req, res) => {
  const { name } = req.params;
  const { uid } = req.user;

  const article = await db.collection("articles").findOne({ name });

  if (article) {
    const upvoteIds = articles.upvoteIds || [];
    const canUpvote = uid && !upvoteIds.include(uid);

    if (canUpvote) {
      await db.collection("articles").updateOne(
        { name },
        {
          $inc: { upvotes: 1 },
          $push: { upvoteIds: uid },
        }
      );
    }

    const updatedArticle = await db.collection("articles").findOne({ name });

    res.json(updatedArticle);
  } else {
    res.send("That article doesn't exist");
  }
});

app.post("/api/articles/:name/comments", async (req, res) => {
  const { name } = req.params;
  const { text } = req.body;
  const { email } = req.user;

  await db.collection("articles").updateOne(
    { name },
    {
      $push: { comments: { postedBy: email, text } },
    }
  );

  const article = await db.collection("articles").findOne({ name });

  if (article) {
    res.json(article.comments);
  } else {
    res.send("That article doesn't exist");
  }
});

connectToDb(() => {
  console.log("Succesfully connected to database!");
  app.listen(8000, () => {
    console.log("Server is listening on port 8000");
  });
});
