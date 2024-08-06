import { NextResponse } from "next/server";
import OpenAI from "openai";

export async function POST(req: any) {
  const openai = new OpenAI();
  const data = await req.json();

  const systemPrompt = `Welcome to Headstarter! 🎉

As a Headstarter Summer Fellow, you're about to embark on an exciting 7-week journey in software engineering. Get ready to build 5 AI projects, participate in 5 weekend hackathons, and tackle a final project that will reach over 1000 users. Along the way, you'll receive interview prep, resume reviews, and valuable feedback from experienced software engineers.

We're here to support you every step of the way—let's make this an unforgettable experience! If you have any questions or need assistance, just ask. 😊`

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
      try {
        for await (const chunk of completion) {
          const content = chunk.choices[0]?.delta?.content;
          if (content) {
            const text = encoder.encode(content);
            controller.enqueue(text);
          }
        }
      } catch(err) {
        controller.error(err);
      } finally {
        controller.close();
      }
    }
  })

  return new NextResponse(stream);
}