import React from 'react';
import { SummaryCard } from './SummaryCard';
import type { Card, SummaryContent } from '../../types';

// Demo component to test SummaryCard functionality
export const SummaryCardDemo: React.FC = () => {
  const mockSummaryCard: Card = {
    id: 'demo-summary-1',
    type: 'summary',
    position: { x: 100, y: 100 },
    content: {
      markdown: `# Machine Learning Fundamentals

Machine learning is a subset of artificial intelligence (AI) that focuses on the development of algorithms and statistical models that enable computer systems to improve their performance on a specific task through experience.

## Key Concepts

### Supervised Learning
- **Definition**: Learning with labeled training data
- **Examples**: Classification, regression
- **Common algorithms**: Linear regression, decision trees, neural networks

### Unsupervised Learning
- **Definition**: Finding patterns in data without labels
- **Examples**: Clustering, dimensionality reduction
- **Common algorithms**: K-means, PCA, autoencoders

### Reinforcement Learning
- **Definition**: Learning through interaction with an environment
- **Examples**: Game playing, robotics, autonomous vehicles
- **Key components**: Agent, environment, rewards, actions

## Important Considerations

> "The goal is to turn data into information, and information into insight." - Carly Fiorina

### Data Quality
The quality of your data directly impacts the performance of your machine learning models. Key factors include:

1. **Completeness**: Are there missing values?
2. **Accuracy**: Is the data correct?
3. **Consistency**: Is the data format uniform?
4. **Relevance**: Does the data relate to the problem?

### Model Evaluation
Common metrics for evaluating models:

| Metric | Use Case | Formula |
|--------|----------|---------|
| Accuracy | Classification | (TP + TN) / (TP + TN + FP + FN) |
| Precision | Classification | TP / (TP + FP) |
| Recall | Classification | TP / (TP + FN) |
| F1-Score | Classification | 2 * (Precision * Recall) / (Precision + Recall) |

### Code Example

\`\`\`python
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_squared_error

# Split the data
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2)

# Train the model
model = LinearRegression()
model.fit(X_train, y_train)

# Make predictions
predictions = model.predict(X_test)

# Evaluate
mse = mean_squared_error(y_test, predictions)
print(f"Mean Squared Error: {mse}")
\`\`\`

## Next Steps

To dive deeper into machine learning, consider exploring:

- **Deep Learning**: Neural networks with multiple layers
- **Natural Language Processing**: Working with text data
- **Computer Vision**: Processing and analyzing images
- **MLOps**: Deploying and maintaining ML models in production

*Remember*: Machine learning is an iterative process that requires experimentation and continuous learning.`,
      originalConversationId: 'demo-conversation-1',
    } as SummaryContent,
    connections: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const handleTextHighlight = (text: string, position: { x: number; y: number }, cardId: string) => {
    console.log('Text highlighted:', { text, position, cardId });
    // In a real implementation, this would trigger the FloatingInput component
    alert(`Highlighted text: "${text}"\nPosition: ${position.x}, ${position.y}\nCard: ${cardId}`);
  };

  return (
    <div className="p-8 bg-gray-100 min-h-screen">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">SummaryCard Demo</h1>
      <p className="text-gray-600 mb-6">
        Try highlighting text in the card below to test the text selection functionality.
      </p>
      <div className="flex justify-center">
        <SummaryCard 
          card={mockSummaryCard}
          onTextHighlight={handleTextHighlight}
        />
      </div>
    </div>
  );
};