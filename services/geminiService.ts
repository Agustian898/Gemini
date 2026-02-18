import { GoogleGenAI, Type } from "@google/genai";
import { TimelineStep } from "../types";

// Helper to get a fresh client.
// Note: We are using process.env.API_KEY as per guidelines.
const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key not found. Please ensure process.env.API_KEY is set.");
  }
  return new GoogleGenAI({ apiKey });
};

export const generateTimelinePrompts = async (subject: string): Promise<TimelineStep[]> => {
  const ai = getClient();
  const effectiveSubject = subject || "Aerial drone view of an old abandoned house";

  const renovationInstructions = `
    STRICTLY FOLLOW THIS LUXURY DRONE RENOVATION TIMELINE (Maintain original building shape and spatial layout exactly):
    
    CRITICAL SPATIAL RULES:
    1. The swimming pool MUST always be located on the RIGHT side of the house (or a consistent specific spot).
    2. The main house structure position MUST NOT change.
    3. The driveway/road MUST always be on the LEFT/FRONT.
    4. Do not flip or mirror the image. Keep camera angle locked.

    Step 1: Image: Aerial view of a very old, abandoned house. Roof collapsed. Empty yard on the RIGHT side full of weeds. Driveway path on the left.
    Video Prompt: Cinematic timelapse aerial drone hover, wind blowing through tall grass, gloomy abandoned house, static camera.

    Step 2: Image: Land clearing. Heavy machinery (tractors) clearing weeds. The yard on the RIGHT side is cleared to bare earth. Excavator arriving.
    Video Prompt: Timelapse of heavy machinery clearing vegetation, tractors moving, grass disappearing, dust rising, construction site activation.

    Step 3: Image: Excavation. Excavator digging a rectangular hole for the pool on the RIGHT side of the house. Workers fixing the roof structure.
    Video Prompt: Timelapse of excavator digging pool area on the right, earth moving, workers swarming roof for repairs, rapid construction activity.

    Step 4: Image: Hardscaping. Concrete shell of the pool visible on the RIGHT side. Paving for driveway on the LEFT being laid.
    Video Prompt: Timelapse of concrete pouring for pool shell on the right, road paving progress on the left, busy construction site.

    Step 5: Image: Exterior finishing. New modern roof installed. Pool on the RIGHT side is tiled (empty). Walls plastered.
    Video Prompt: Timelapse of roof completion, wall plastering, windows being fitted, pool tiling, workers on scaffolding moving fast.

    Step 6: Image: Filling & Greenery. Pool on the RIGHT side filled with blue water. Grass planted around the pool. House painted white/cream.
    Video Prompt: Timelapse of painting walls, water filling the swimming pool on the right, instant landscaping growth, grass becoming green.

    Step 7: Image: Furnishing. Deck chairs placed by the pool on the RIGHT. Luxury cars parked on the LEFT driveway. Garden lights installed.
    Video Prompt: Timelapse of finishing touches, furniture appearing by the pool, lights turning on, cleaning up debris, polished look.

    Step 8: Image: FINAL REVEAL. Luxury house. Sparkling pool on the RIGHT side. Luxury cars on the LEFT. Beautiful garden. EXACT same layout as Step 1.
    Video Prompt: Final slow cinematic drone reveal, shimmering pool water on the right, swaying trees, luxury atmosphere, no workers, high-end real estate showcase.
    
    Constraint: "Drone view", "Locked Camera", "Consistent Layout" is MANDATORY.
  `;

  const systemPrompt = `
    Act as an expert timelapse photographer and prompt engineer.
    Subject: "${effectiveSubject}"
    Transformation: "Luxury Renovation Drone View"
    
    ${renovationInstructions}

    Create 8 progressive prompts for a vertical 9:16 timelapse.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: systemPrompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              image: { type: Type.STRING, description: 'The detailed image generation prompt.' },
              video: { type: Type.STRING, description: 'The video generation prompt for timelapse tools.' }
            },
            required: ["image", "video"]
          }
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from Gemini.");
    return JSON.parse(text) as TimelineStep[];
  } catch (error) {
    console.error("Error generating prompts:", error);
    throw error;
  }
};

export const generateInitialImage = async (prompt: string): Promise<string> => {
  const ai = getClient();
  try {
    // Replaced Imagen model with Gemini 2.5 Flash Image to avoid permission errors
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: prompt,
      config: {
        imageConfig: {
          aspectRatio: '9:16'
        }
      }
    });
    
    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData && part.inlineData.data) {
          return `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
        }
      }
    }
    
    throw new Error("No image generated.");
  } catch (error) {
    console.error("Error generating initial image:", error);
    throw error;
  }
};

export const editImageFrame = async (prompt: string, previousImageBase64: string): Promise<string> => {
  const ai = getClient();
  // Strip prefix if present
  const base64Data = previousImageBase64.replace(/^data:image\/\w+;base64,/, "");

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image', // Using 2.5 Flash Image for editing capabilities
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "image/png",
              data: base64Data
            }
          },
          { text: `Change this image to match this description: ${prompt}. Keep exact same composition, background, and camera angle. High quality, realistic.` }
        ]
      },
      config: {
        // We do not set responseMimeType here as it is not supported for nano banana models (gemini-2.5-flash-image)
        imageConfig: {
          aspectRatio: '9:16'
        }
      }
    });

    let resultImage = null;
    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData && part.inlineData.data) {
          resultImage = `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
          break;
        }
      }
    }

    if (!resultImage) {
      // Fallback: If editing fails to produce an image (sometimes it chats instead), try regenerating fresh
      console.warn("Edit did not return an image, falling back to generation.");
      return generateInitialImage(prompt);
    }

    return resultImage;
  } catch (error) {
    console.error("Error editing image:", error);
    throw error;
  }
};