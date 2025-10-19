import type { AIService } from './api';
import { config } from '../config/environment';

// Mock conversation responses for different types of queries
const mockResponses = {
  greetings: [
    "Hello! I'm here to help you learn and explore any topic you're interested in. What would you like to know about?",
    "Hi there! I'm ready to assist you with questions, explanations, or deep dives into any subject. What's on your mind?",
    "Welcome! I can help you understand complex topics, provide explanations, and guide your learning journey. What would you like to explore?"
  ],
  
  science: [
    "That's a fascinating scientific question! Let me break this down for you with clear explanations and examples.",
    "Science is full of amazing discoveries and principles. I'll help you understand the key concepts and their real-world applications.",
    "Great scientific inquiry! Understanding these concepts will give you insights into how our world works at a fundamental level."
  ],
  
  technology: [
    "Technology is constantly evolving! Let me explain the current state and future possibilities in this area.",
    "That's an excellent technology question. I'll cover both the technical details and practical implications.",
    "Technology shapes our daily lives in countless ways. Let's explore how this particular aspect works and why it matters."
  ],
  
  history: [
    "History provides valuable context for understanding our present. Let me walk you through the key events and their significance.",
    "That's an important historical topic! Understanding the past helps us make sense of current events and future trends.",
    "History is full of fascinating stories and lessons. I'll help you understand the causes, events, and consequences."
  ],
  
  general: [
    "That's an interesting question! Let me provide you with a comprehensive explanation that covers the key aspects.",
    "I'd be happy to help you understand this topic better. Let me break it down into digestible parts.",
    "Great question! I'll give you a thorough explanation with examples to make it clear and engaging."
  ]
};

// Mock detailed notes templates
const notesTemplates = {
  science: `# Scientific Concepts Overview

## Key Principles
- **Fundamental Laws**: Core scientific principles that govern natural phenomena
- **Experimental Method**: How scientists test hypotheses and validate theories
- **Real-world Applications**: Practical uses and implications in daily life

## Important Details
- Historical development of the field
- Current research frontiers
- Connections to other scientific disciplines

## Further Exploration
- Recommended experiments or observations
- Related topics for deeper study
- Current debates and open questions`,

  technology: `# Technology Deep Dive

## Core Concepts
- **Technical Architecture**: How the technology is structured and operates
- **Key Components**: Essential parts and their functions
- **Performance Characteristics**: Capabilities and limitations

## Implementation Details
- Development process and methodologies
- Integration with existing systems
- Security and privacy considerations

## Future Outlook
- Emerging trends and innovations
- Potential challenges and solutions
- Impact on society and industry`,

  history: `# Historical Analysis

## Timeline and Context
- **Key Events**: Major occurrences and their chronological order
- **Historical Context**: Social, political, and economic conditions
- **Cause and Effect**: How events influenced each other

## Important Figures
- Influential people and their contributions
- Different perspectives and viewpoints
- Legacy and long-term impact

## Lessons and Significance
- What we can learn from these events
- Connections to contemporary issues
- Ongoing historical debates`,

  general: `# Comprehensive Overview

## Main Concepts
- **Core Ideas**: Fundamental principles and definitions
- **Key Components**: Important elements and their relationships
- **Practical Applications**: Real-world uses and examples

## Detailed Analysis
- Different perspectives and approaches
- Advantages and disadvantages
- Common misconceptions and clarifications

## Additional Resources
- Recommended further reading
- Related topics for exploration
- Current developments and trends`
};

export class MockAIService implements AIService {
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private categorizeQuery(message: string): keyof typeof mockResponses {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
      return 'greetings';
    }
    
    if (lowerMessage.includes('science') || lowerMessage.includes('physics') || 
        lowerMessage.includes('chemistry') || lowerMessage.includes('biology') ||
        lowerMessage.includes('experiment') || lowerMessage.includes('theory')) {
      return 'science';
    }
    
    if (lowerMessage.includes('technology') || lowerMessage.includes('computer') || 
        lowerMessage.includes('software') || lowerMessage.includes('programming') ||
        lowerMessage.includes('ai') || lowerMessage.includes('digital')) {
      return 'technology';
    }
    
    if (lowerMessage.includes('history') || lowerMessage.includes('historical') || 
        lowerMessage.includes('past') || lowerMessage.includes('ancient') ||
        lowerMessage.includes('war') || lowerMessage.includes('civilization')) {
      return 'history';
    }
    
    return 'general';
  }

  private getRandomResponse(category: keyof typeof mockResponses): string {
    const responses = mockResponses[category];
    return responses[Math.floor(Math.random() * responses.length)];
  }

  private generateDetailedResponse(message: string, category: keyof typeof mockResponses): string {
    const baseResponse = this.getRandomResponse(category);
    
    // Add some context-specific details based on the message
    const contextualDetails = [
      `\n\nRegarding "${message.slice(0, 50)}${message.length > 50 ? '...' : ''}", here are some key points to consider:`,
      `\n• This topic connects to several important concepts`,
      `\n• There are practical applications you might find interesting`,
      `\n• Understanding this can help with related questions you might have`
    ].join('');
    
    return baseResponse + contextualDetails;
  }

  async sendMessage(_conversationId: string, message: string): Promise<string> {
    // Simulate realistic API delay using environment config
    const delayRange = config.ai.mockDelayMax - config.ai.mockDelayMin;
    const delay = Math.random() * delayRange + config.ai.mockDelayMin;
    await this.delay(delay);
    
    // Simulate occasional network issues using environment config
    if (Math.random() < config.ai.mockErrorRate) {
      throw new Error('Network timeout - please try again');
    }
    
    const category = this.categorizeQuery(message);
    const response = this.generateDetailedResponse(message, category);
    
    return response;
  }

  async generateNotes(
    _conversationId: string, 
    messages: Array<{ role: 'user' | 'assistant'; content: string }>
  ): Promise<string> {
    // Simulate longer processing time for note generation (use 1.5x the base delay)
    const baseDelayRange = config.ai.mockDelayMax - config.ai.mockDelayMin;
    const delay = (Math.random() * baseDelayRange + config.ai.mockDelayMin) * 1.5;
    await this.delay(delay);
    
    // Simulate occasional processing issues (slightly lower rate than messages)
    if (Math.random() < config.ai.mockErrorRate * 0.6) {
      throw new Error('Note generation failed - please try again');
    }
    
    // Analyze the conversation to determine the best template
    const conversationText = messages.map(m => m.content).join(' ').toLowerCase();
    let category: keyof typeof notesTemplates = 'general';
    
    if (conversationText.includes('science') || conversationText.includes('physics') || 
        conversationText.includes('chemistry') || conversationText.includes('biology')) {
      category = 'science';
    } else if (conversationText.includes('technology') || conversationText.includes('computer') || 
               conversationText.includes('programming') || conversationText.includes('ai')) {
      category = 'technology';
    } else if (conversationText.includes('history') || conversationText.includes('historical') || 
               conversationText.includes('past') || conversationText.includes('ancient')) {
      category = 'history';
    }
    
    // Get base template and customize it
    let notes = notesTemplates[category];
    
    // Add conversation-specific content
    const userQuestions = messages.filter(m => m.role === 'user').map(m => m.content);
    if (userQuestions.length > 0) {
      notes += `\n\n## Discussion Points\n`;
      userQuestions.forEach((question, index) => {
        notes += `\n${index + 1}. ${question}`;
      });
    }
    
    // Add timestamp and conversation reference
    notes += `\n\n---\n*Generated from conversation on ${new Date().toLocaleDateString()}*`;
    
    return notes;
  }
}

// Export singleton instance
export const mockAIService = new MockAIService();