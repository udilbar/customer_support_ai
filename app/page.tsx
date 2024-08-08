"use client";

import AssistantOutlinedIcon from '@mui/icons-material/AssistantOutlined';
import { Box, Divider, TextField, List, ListItem, ListItemText, Button } from '@mui/material';
import { useState } from 'react';
import Markdown from 'react-markdown';

type Message = {
  role: "user" | "assistant";
  content: string;
  sentAt: string;
};

export default function Home() {

  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hi! I'm the Headstarter support assistant. How can I help you today?",
      sentAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [message, setMessage] = useState<string>("");

  const sendMessage = async () => {
    if (!message.trim()) return;

    const userMessage: Message = {
      role: "user",
      content: message,
      sentAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    const newMessage: Message = {
      role: "assistant",
      content: "...",
      sentAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessage("");
    setMessages((messages: any) => [...messages, userMessage, newMessage]);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify([...messages, userMessage])
      });

      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let partialMessage = "";
    
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        partialMessage += decoder.decode(value, { stream: true });

        setMessages(prevMessages => {
          const lastMessage = prevMessages[prevMessages.length - 1];
          if (lastMessage.role === "assistant") {
            lastMessage.content = partialMessage;
            return [...prevMessages.slice(0, -1), lastMessage];
          }
          return prevMessages;
        });
      }
    } catch (error) {
      console.error("Error fetching the message:", error);
      setMessages(prevMessages => [...prevMessages.slice(0, -1), { ...newMessage, content: "Sorry, something went wrong." }]);
    }
    
  }

  return (
    <Box display="flex" alignItems="center" justifyContent="center" width="100%" height="100vh">
      <Box display="flex" flexDirection="column" width="700px" height="75%" border="1px solid #cccccc" borderRadius="10px" bgcolor="#ffffff">
        <List sx={{display: "flex", flexDirection: "column", flexGrow: 1, overflowY: "auto", padding: "30px 15px", gap: "30px"}}>
          {
            messages.map((message: Message, key: number) => (
              // message.role === "assistant" ? (
              <ListItem key={key} sx={{display: "flex", width: "auto", maxWidth: "90%", gap: "15px", alignItems: "flex-start", ...(message.role === "user" ? { alignSelf: "flex-end", bgcolor: "rgb(244,244,244)", borderRadius: "20px" } : {})}}>
                {message.role === "assistant" && (
                  <Box sx={{ width: "40px", height: "40px", border: "1px solid #ececec", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <AssistantOutlinedIcon />
                  </Box>
                )}
                <Box display="flex" flexDirection="column" textAlign={message.role === "user" ? "right" : "left"}>
                  <ListItemText primary={
                    <Markdown>{message.content}</Markdown>
                  }/>
                  <ListItemText secondary={message.sentAt}/>
                </Box>
              </ListItem>
            ))
          }
        </List>
        <Divider />
        <Box display="flex" alignItems="baseline" padding="20px 10px" gap="10px">
          <TextField
            label="Enter message"
            fullWidth
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && sendMessage()}
          />
          <Button variant="contained" sx={{padding: "15px"}} onClick={sendMessage}>Send</Button>
        </Box>
      </Box>
    </Box>
  );
}
