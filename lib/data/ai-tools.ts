export interface AiTool {
  name: string;
  use: string;
}

export const aiTools: AiTool[] = [
  { name: "Claude", use: "Thinking through product direction and writing" },
  { name: "ChatGPT", use: "Fast exploration of ideas and copy variants" },
  { name: "Gemini", use: "In-product AI features and multimodal prototyping" },
  { name: "Cursor", use: "Accelerated implementation and refactors" },
  { name: "Codex", use: "Scaffolding and pairing on code" },
  { name: "Figma AI / Figma Make", use: "Rapid interface and prototype exploration" },
];
