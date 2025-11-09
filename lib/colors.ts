// Anthropic-themed color palette for agent nodes
export const AGENT_COLORS = [
  {
    bg: '#63B0CD',
    border: '#4A8BA6',
    text: '#2C5568',
  },
  {
    bg: '#71816D',
    border: '#5A6A56',
    text: '#3A4438',
  },
  {
    bg: '#C17B6C',
    border: '#A66454',
    text: '#6B3E32',
  },
  {
    bg: '#8B9DC3',
    border: '#6F82A8',
    text: '#4A5670',
  },
  {
    bg: '#B8A88A',
    border: '#9A8C6F',
    text: '#5C5340',
  },
  {
    bg: '#7EAAA0',
    border: '#648C83',
    text: '#3F5954',
  },
  {
    bg: '#A88CB8',
    border: '#8C6F9A',
    text: '#53405C',
  },
  {
    bg: '#B8B88A',
    border: '#9A9A6F',
    text: '#5C5C40',
  },
];

// Global counter for assigning colors in rotation
let colorCounter = 0;

export function getNextColorIndex(): number {
  const index = colorCounter % AGENT_COLORS.length;
  colorCounter++;
  return index;
}

export function getAgentColor(colorIndex: number = 0) {
  return AGENT_COLORS[colorIndex % AGENT_COLORS.length];
}
