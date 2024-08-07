"use client";

import AssistantOutlinedIcon from '@mui/icons-material/AssistantOutlined';
import { Box, Divider, TextField, List, ListItem, ListItemText, Button } from '@mui/material';
import { useState } from 'react';
import Markdown from 'react-markdown';

export default function Home() {

  const [messages, setMessages] = useState<any>([
    {
      role: "assistant",
      content: "Hi! I'm the Headstarter support assistant. How can I help you today?",
      sentAt: new Date().toLocaleTimeString()
    }
  ]);
  const [message, setMessage] = useState<any>("");

  const sendMessage = async () => {
    const userMessage = {role: "user", content: message, sentAt: new Date().toLocaleTimeString()};
    setMessage("");
    setMessages((messages: any) => [...messages, userMessage, {role: "assistant", content: "...", sentAt: new Date().toLocaleTimeString()}])
    fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify([...messages, userMessage])
    }).then(async (res) => {
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let result = "";
      if (reader) {
        return reader.read().then(function processText({done, value}): string | Promise<string> {
          if (done) return result;
          const text = decoder.decode(value || new Uint8Array(), {stream: true});
          setMessages((messages: any) => {
            const lastMessage = messages[messages.length - 1];
            const otherMessages = messages.slice(0, messages.length - 1);
            if (lastMessage.content === "...") {
              lastMessage.content = "";
            }
            return [...otherMessages, {...lastMessage, content: lastMessage.content + text}]
          })
          return reader.read().then(processText)
        })
      }
    })
    
    // setMessages((messages: any) => [...messages, {role: "assistant", content: data.message}])
  }

  return (
    <Box display="flex" alignItems="center" justifyContent="center" width="100%" height="100vh">
      <Box display="flex" flexDirection="column" width="700px" height="75%" border="1px solid #cccccc" borderRadius="10px">
        <List sx={{display: "flex", flexDirection: "column", flexGrow: 1, overflowY: "auto", padding: "30px 15px"}}>
          {
            messages.map((message: any, key: number) => (
              message.role === "assistant" ? (
                <ListItem key={key} sx={{display: "flex", gap: "15px", alignItems: "flex-start"}}>
                  <Box sx={{width: "40px", height: "40px", border: "1px solid #ececec", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0}}>
                    <AssistantOutlinedIcon />
                  </Box>
                  <Box display="flex" flexDirection="column">
                    <ListItemText primary={
                      <Markdown>{message.content}</Markdown>
                    }></ListItemText>
                    <ListItemText secondary={message.sentAt}></ListItemText>
                  </Box>
                </ListItem>
              ) : (
                <ListItem key={key} sx={{display: "flex", gap: "15px", alignSelf: "flex-end", bgcolor: "rgb(244,244,244)", width: "fit-content", borderRadius: "20px"}} >
                  <Box display="flex" flexDirection="column" textAlign="right">
                    <ListItemText primary={message.content}></ListItemText>
                    <ListItemText secondary={message.sentAt}></ListItemText>
                  </Box>
                </ListItem>
              )
            ))
          }
        </List>
        <Divider />
        <Box display="flex" alignItems="baseline" padding="20px 10px" gap="10px">
          <TextField
            id="outlined-basic-email"
            label="Enter message"
            fullWidth
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <Button variant="contained" aria-label="add" sx={{padding: "15px"}} onClick={sendMessage}>Send</Button>
        </Box>
      </Box>
    </Box>
  );
}
