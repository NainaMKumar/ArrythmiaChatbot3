import { Configuration, OpenAIApi } from "openai";
import express from "express";
import bodyParser from "body-parser";
import cors from "cors";

const app = express();
const port = 8000;
app.use(bodyParser.json());
app.use(cors());

require('dotenv').config();

console.log("Before chat completion");
const configuration = new Configuration({
  organization: process.env.ORG_ID,
  apiKey: process.env.API_KEY,
});

console.log("After chat completion")
const openai = new OpenAIApi(configuration);

app.post("/", async (request, response) => {
  const { chats } = request.body;

  const result = await openai.createChatCompletion({
    model: "gpt-3.5-turbo",
    messages: [
      {
        role: "system",
        content: "You are a sympathetic doctor that helps patients with arrythmia",
      },
      ...chats,
    ],
  });

  const output = result.data.choices[0].message;
  console.log(output);

  response.json({
    output: output,
  });
});

app.listen(port, () => {
  console.log(`listening on port ${port}`);
});



