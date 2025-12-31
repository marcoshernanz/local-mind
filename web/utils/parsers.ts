/**
 * Parses WhatsApp chat exports (iOS and Android) into a semantic format.
 *
 * Android Format: 9/9/24, 15:16 - Sender: Message
 * iOS Format: [27/12/18, 12:31:08] Sender: Message
 */
export function parseWhatsAppChat(text: string): string {
  const lines = text.split("\n");
  const processed: string[] = [];

  // Regex for iOS: [DD/MM/YY, HH:MM:SS] Sender: Message
  // Captures: 1=Date/Time, 2=Sender, 3=Message
  const iosRegex =
    /^\[(\d{1,2}\/\d{1,2}\/\d{2,4}, \d{1,2}:\d{2}:\d{2})\] (.*?): (.*)/;

  // Regex for Android: MM/DD/YY, HH:MM - Sender: Message
  // Captures: 1=Date/Time, 2=Sender, 3=Message
  const androidRegex =
    /^(\d{1,2}\/\d{1,2}\/\d{2,4}, \d{1,2}:\d{2}) - (.*?): (.*)/;

  let currentMessage = "";

  for (const line of lines) {
    // Try to match start of a new message
    const match = line.match(iosRegex) || line.match(androidRegex);

    if (match) {
      // If we were building a previous message, save it now
      if (currentMessage) {
        processed.push(currentMessage);
      }

      const date = match[1];
      const sender = match[2];
      const message = match[3];

      // Format for semantic search: "On [Date], [Sender] said: [Message]"
      // This structure helps the embedding model understand who said what and when.
      currentMessage = `On ${date}, ${sender} said: ${message}`;
    } else {
      // This line doesn't start with a timestamp.
      // It could be:
      // 1. A continuation of the previous message (multi-line message)
      // 2. A system message (e.g., "Messages are encrypted") which we usually ignore for semantic search
      // 3. Garbage/Empty line

      // We only append if we have an active message context and it's not a system message pattern
      // (System messages usually start with date but fail the 'Sender:' check, so they end up here)
      // But we want to avoid appending system messages to the previous user's message.

      const isSystemMessageStart = /^\[?\d{1,2}\/\d{1,2}\/\d{2,4}/.test(line);

      if (!isSystemMessageStart && currentMessage && line.trim()) {
        currentMessage += "\n" + line;
      }
    }
  }

  // Push the last message
  if (currentMessage) {
    processed.push(currentMessage);
  }

  console.log(`Parsed ${processed.length} WhatsApp messages.`);
  return processed.join("\n\n");
}
