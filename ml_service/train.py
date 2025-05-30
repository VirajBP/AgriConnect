import json
import numpy as np
import torch
import torch.nn as nn
from torch.utils.data import Dataset, DataLoader
import nltk
from nltk.tokenize import word_tokenize
from nltk.corpus import stopwords
from nltk.stem import WordNetLemmatizer
import string
import pickle

# Download required NLTK data
nltk.download('punkt')
nltk.download('stopwords')
nltk.download('wordnet')

# Initialize lemmatizer and stopwords
lemmatizer = WordNetLemmatizer()
stop_words = set(stopwords.words('english'))

class ChatDataset(Dataset):
    def __init__(self, X_train, y_train):
        self.n_samples = len(X_train)
        self.x_data = X_train
        self.y_data = y_train

    def __getitem__(self, index):
        return self.x_data[index], self.y_data[index]

    def __len__(self):
        return self.n_samples

class NeuralNet(nn.Module):
    def __init__(self, input_size, hidden_size, num_classes):
        super(NeuralNet, self).__init__()
        self.l1 = nn.Linear(input_size, hidden_size)
        self.l2 = nn.Linear(hidden_size, hidden_size)
        self.l3 = nn.Linear(hidden_size, num_classes)
        self.relu = nn.ReLU()

    def forward(self, x):
        out = self.l1(x)
        out = self.relu(out)
        out = self.l2(out)
        out = self.relu(out)
        out = self.l3(out)
        return out

def preprocess_text(text):
    # Tokenize
    tokens = word_tokenize(text.lower())
    
    # Remove punctuation and stopwords, then lemmatize
    tokens = [lemmatizer.lemmatize(token) for token in tokens 
             if token not in string.punctuation and token not in stop_words]
    
    return tokens

def main():
    # Load the training data
    with open('data/agricultural_qa.json', 'r') as f:
        intents = json.load(f)['intents']

    # Prepare training data
    all_words = []
    tags = []
    xy = []

    for intent in intents:
        tag = intent['tag']
        tags.append(tag)
        
        for pattern in intent['patterns']:
            tokens = preprocess_text(pattern)
            all_words.extend(tokens)
            xy.append((tokens, tag))

    # Remove duplicates and sort
    all_words = sorted(set(all_words))
    tags = sorted(set(tags))

    # Create training data
    X_train = []
    y_train = []

    for (pattern_tokens, tag) in xy:
        # Create bag of words
        bag = [1 if word in pattern_tokens else 0 for word in all_words]
        X_train.append(bag)
        
        # Create label
        label = tags.index(tag)
        y_train.append(label)

    X_train = np.array(X_train)
    y_train = np.array(y_train)

    # Create dataset and dataloader
    dataset = ChatDataset(X_train, y_train)
    train_loader = DataLoader(dataset=dataset, batch_size=8, shuffle=True)

    # Initialize model
    input_size = len(X_train[0])
    hidden_size = 8
    output_size = len(tags)
    model = NeuralNet(input_size, hidden_size, output_size)

    # Training parameters
    criterion = nn.CrossEntropyLoss()
    optimizer = torch.optim.Adam(model.parameters(), lr=0.001)
    num_epochs = 1000

    # Training loop
    for epoch in range(num_epochs):
        for (words, labels) in train_loader:
            # Forward pass
            outputs = model(words.float())
            loss = criterion(outputs, labels)
            
            # Backward and optimize
            optimizer.zero_grad()
            loss.backward()
            optimizer.step()
        
        if (epoch + 1) % 100 == 0:
            print(f'Epoch [{epoch+1}/{num_epochs}], Loss: {loss.item():.4f}')

    print(f'Final loss: {loss.item():.4f}')

    # Save the model and training data
    data = {
        "model_state": model.state_dict(),
        "input_size": input_size,
        "hidden_size": hidden_size,
        "output_size": output_size,
        "all_words": all_words,
        "tags": tags
    }

    torch.save(data, "data/model.pth")
    print('Training complete. Model saved to data/model.pth')

if __name__ == "__main__":
    main()
