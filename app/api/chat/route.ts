import { NextResponse } from "next/server";
import OpenAI from "openai";
import documents from "@/documents.json";
import { cosineSimilarity } from "@/utils";


async function getRelevantDocuments(query: string) {
  const openai = new OpenAI();

  // Generate embeddings for the query
  const queryEmbeddingResponse = await openai.embeddings.create({
    input: query,
    model: "text-embedding-ada-002"
  });

  // Extract the embedding vector
  const queryEmbedding = queryEmbeddingResponse.data[0].embedding;

  // Generate embeddings for documents and calculate cosine similarity
  const similarities = await Promise.all(
    documents.map(async (doc) => {
      const docEmbeddingResponse = await openai.embeddings.create({
        input: doc.content,
        model: "text-embedding-ada-002"
      });

      // Extract the embedding vector
      const docEmbedding = docEmbeddingResponse.data[0].embedding;

      // Calculate and return cosine similarity
      return cosineSimilarity(queryEmbedding, docEmbedding);
    })
  );

  // Get the document with the highest similarity
  const maxIndex = similarities.indexOf(Math.max(...similarities));
  return documents[maxIndex];
}

export async function POST(req: Request) {
  try {
    const openai = new OpenAI();
    const data = await req.json();

    const userQuery = data.find((msg: any) => msg.role === "user")?.content;
    const relevantDocument = await getRelevantDocuments(userQuery);

    const systemPrompt = `Welcome to Headstarter! 🎉

    As a Headstarter Summer Fellow, you're about to embark on an exciting 7-week journey in software engineering. Get ready to build 5 AI projects, participate in 5 weekend hackathons, and tackle a final project that will reach over 1000 users. Along the way, you'll receive interview prep, resume reviews, and valuable feedback from experienced software engineers.

    We're here to support you every step of the way—let's make this an unforgettable experience! If you have any questions or need assistance, just ask. 😊

    Here is some relevant information based on your query: ${relevantDocument.title} - ${relevantDocument.content}`

    const completion = await openai.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        ...data
      ],
      model: "gpt-3.5-turbo",
      stream: true
    });

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        for await (const chunk of completion) {
          const content = chunk.choices[0]?.delta?.content;
          if (content) {
            const text = encoder.encode(content);
            controller.enqueue(text);
          }
        }
        controller.close();
      }
    });

    return new NextResponse(stream);
  } catch (error) {
    console.error("Error in POST handler:", error);
    return new NextResponse("An error occurred while processing your request.", { status: 500 });
  }
}