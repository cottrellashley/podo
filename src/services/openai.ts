import type { ObjectType, TimeCategory } from '../types';

export interface AIResponse {
  message: string;
  actions?: {
    createObjects?: ObjectType[];
    scheduleItems?: {
      objectId: string;
      date: string;
      time: string;
    }[];
  };
}

export class OpenAIService {
  private apiKey: string;
  private model: string;

  constructor(apiKey: string, model: string = 'gpt-4o-mini') {
    this.apiKey = apiKey;
    this.model = model;
  }

  private getSystemPrompt(): string {
    const today = new Date().toISOString().split('T')[0];
    
    return `You are an intelligent assistant for a Weekly Planner application. You help users create recipes, workouts, and todo lists, and schedule them in their weekly calendar.

CURRENT DATE: ${today}

CAPABILITIES:
1. Create new objects (recipes, workouts, todo lists)
2. Schedule objects to specific days and time categories
3. Answer questions about planning and organization

OBJECT TYPES AND STRUCTURES:

1. RECIPE:
{
  "id": "generated_id",
  "type": "recipe",
  "title": "Recipe Name",
  "ingredients": [
    {
      "id": "ingredient_id",
      "name": "ingredient name",
      "amount": 2,
      "unit": "cups",
      "estimatedCost": 3.50
    }
  ],
  "instructions": [
    "Step 1 description",
    "Step 2 description"
  ],
  "createdAt": "${new Date().toISOString()}"
}

2. WORKOUT:
{
  "id": "generated_id",
  "type": "workout",
  "title": "Workout Name",
  "bodyGroup": "Upper Body", // optional
  "exercises": [
    {
      "id": "exercise_id",
      "name": "Push-ups",
      "sets": 3,
      "reps": 15,
      "completed": false
    }
  ],
  "notes": "Optional notes", // optional
  "createdAt": "${new Date().toISOString()}"
}

3. TODO LIST:
{
  "id": "generated_id",
  "type": "todoList",
  "title": "Todo List Name",
  "items": [
    {
      "id": "item_id",
      "text": "Task description",
      "completed": false
    }
  ],
  "createdAt": "${new Date().toISOString()}"
}

TIME CATEGORIES:
- "Morning" (6 AM - 12 PM)
- "Afternoon" (12 PM - 6 PM) 
- "Evening" (6 PM - 10 PM)
- "Night" (10 PM - 6 AM)

RESPONSE FORMAT:
Always respond with a JSON object containing:
{
  "message": "Your helpful response to the user",
  "actions": {
    "createObjects": [/* array of objects to create */],
    "scheduleItems": [
      {
        "objectId": "id_of_object_to_schedule",
        "date": "YYYY-MM-DD",
        "time": "HH:MM"
      }
    ]
  }
}

RULES:
1. Generate unique IDs using random strings (e.g., "rec_abc123", "wkt_def456", "todo_ghi789")
2. If no date is specified, use today's date: ${today}
3. If no time category is specified, choose the most appropriate one based on the activity
4. Always include estimated costs for recipe ingredients (reasonable estimates)
5. Be helpful and conversational in your messages
6. If the user asks to create something, always include it in the createObjects array
7. If the user asks to schedule something, include it in scheduleItems array
8. You can both create and schedule in the same response

EXAMPLES:

User: "Create a chicken pasta recipe for dinner tonight"
Response:
{
  "message": "I've created a delicious chicken pasta recipe and scheduled it for dinner tonight!",
  "actions": {
    "createObjects": [{
      "id": "rec_chicken_pasta_001",
      "type": "recipe",
      "title": "Chicken Pasta",
      "ingredients": [
        {"id": "ing_001", "name": "chicken breast", "amount": 2, "unit": "pieces", "estimatedCost": 8.00},
        {"id": "ing_002", "name": "pasta", "amount": 1, "unit": "lb", "estimatedCost": 2.50}
      ],
      "instructions": ["Cook pasta according to package directions", "Season and cook chicken", "Combine and serve"],
      "createdAt": "${new Date().toISOString()}"
    }],
    "scheduleItems": [{
      "objectId": "rec_chicken_pasta_001",
      "date": "${today}",
      "time": "18:00"
    }]
  }
}

User: "Add a morning workout for tomorrow"
Response:
{
  "message": "I've created a great morning workout routine and scheduled it for tomorrow morning!",
  "actions": {
    "createObjects": [{
      "id": "wkt_morning_001",
      "type": "workout",
      "title": "Morning Energy Workout",
      "bodyGroup": "Full Body",
      "exercises": [
        {"id": "ex_001", "name": "Jumping Jacks", "sets": 3, "reps": 20, "completed": false},
        {"id": "ex_002", "name": "Push-ups", "sets": 3, "reps": 10, "completed": false}
      ],
      "createdAt": "${new Date().toISOString()}"
    }],
    "scheduleItems": [{
      "objectId": "wkt_morning_001",
      "date": "${new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]}",
      "time": "07:00"
    }]
  }
}

Be creative, helpful, and always provide practical suggestions!`;
  }

  async sendMessage(
    message: string,
    conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> = []
  ): Promise<AIResponse> {
    try {
      const messages = [
        { role: 'system' as const, content: this.getSystemPrompt() },
        ...conversationHistory,
        { role: 'user' as const, content: message }
      ];

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: this.model,
          messages,
          temperature: 0.7,
          max_tokens: 2000,
          response_format: { type: 'json_object' }
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `API request failed with status ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content;

      if (!content) {
        throw new Error('No response content received from OpenAI');
      }

      try {
        const parsedResponse = JSON.parse(content) as AIResponse;
        return parsedResponse;
      } catch (parseError) {
        // Fallback if JSON parsing fails
        return {
          message: content,
          actions: undefined
        };
      }
    } catch (error) {
      console.error('OpenAI API Error:', error);
      throw error;
    }
  }

  updateApiKey(apiKey: string) {
    this.apiKey = apiKey;
  }

  updateModel(model: string) {
    this.model = model;
  }
} 