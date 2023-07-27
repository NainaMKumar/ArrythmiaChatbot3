import { Configuration, OpenAIApi } from "openai";
import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import { TextToSpeechClient } from "@google-cloud/text-to-speech"; // Import the Google Text-to-Speech client
import { franc } from "franc"; // Use named import for franc

const app = express();
const port = 8000;
app.use(bodyParser.json());
app.use(cors());

require('dotenv').config();

const configuration = new Configuration({
  organization: process.env.ORG_ID,
  apiKey: process.env.API_KEY,
});

const openai = new OpenAIApi(configuration);

// Initialize Google Text-to-Speech client
const ttsClient = new TextToSpeechClient({
  projectId: "proven-aura-382621",
  keyFilename: "C:/Users/lalikumar/Downloads/proven-aura-382621-e2e57a828f89.json",
});

app.post("/", async (request, response) => {
  const {chats, formData} = request.body

  if (formData !== undefined) {
    try {
      // Handle the audio file sent by the user
      const userAudio = formData.get("userAudio")
  
      // Perform language detection on the chatbot's response
      let detectedLanguage;
      try {
        detectedLanguage = franc(userAudio.toString());
      } catch (error) {
        console.error("Error detecting language:", error);
        detectedLanguage = "en"; // Default to English if language detection fails
      }
  
      const result = await openai.createChatCompletion({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are an expert in heart arrythmias",
          },
          ...userAudio,
        ],
      });
  
      const output = result.data.choices[0].message;
      console.log(output);
  
      // Define a dictionary to map the detected language to language code and voice name
      const language_dict = {
        en: { language_code: "en-US", voice_name: "en-US-Wavenet-D" },
        hi: { language_code: "hi-IN", voice_name: "hi-IN-Wavenet-A" },
      };
  
      // Set the language and voice for Google TTS based on the detected language
      const languageCode = language_dict[detectedLanguage]
        ? language_dict[detectedLanguage].language_code
        : "en-US";
      const voiceName = language_dict[detectedLanguage]
        ? language_dict[detectedLanguage].voice_name
        : "en-US-Wavenet-D";
  
      // Convert the chatbot's response to speech using Google TTS API
      try {
        const [speechResponse] = await ttsClient.synthesizeSpeech({
          input: { text: output },
          voice: {
            languageCode: languageCode, // Use detected language or default to "en-US"
            name: voiceName, // Use detected voice name or default to "en-US-Wavenet-D"
          },
          audioConfig: { audioEncoding: "MP3" }, // Adjust audio encoding as needed (e.g., "MP3", "LINEAR16", etc.)
        });
  
        const audioData = speechResponse.audioContent;
  
        // Set the appropriate response headers
        response.setHeader("Content-Type", "audio/mpeg");
        response.setHeader("Content-Disposition", 'attachment; filename="speech.mp3"');
  
        // Send the audio data back to the client
        response.send(audioData);
  
      } catch (err) {
        console.error("Error converting text to speech:", err);
        response.status(500).json({ error: "Error converting text to speech" });
      }
  
    } catch (error) {
      console.error("Error processing audio:", error);
      response.status(500).json({ error: "Error processing audio" });
    }
  }

  else if (chats !== undefined) {
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
      output: output
    })
  }

  else {
    response.status(400).json({ error: "Invalid request. Please provide either 'formData' or 'chats' in the request body." });
  }

});
  
  
app.listen(port, () => {
  console.log(`listening on port ${port}`);
});




