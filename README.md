# BudgetBuddy

TeamID: 7553
Team Name: BudgetBuddies
Rayner
Josh

## 🧠 Why We Made This App
We created **BudgetBuddy** to help people better manage shared expenses with friends, family, or roommates. Tracking who paid for what and who owes whom can be confusing and time-consuming. We saw a need for a simple, efficient solution that automates expense tracking and payment splitting in a way that is accessible, transparent, and fair.

## 🎯 What It Is For
BudgetBuddy is designed for:
- 🏠 Students sharing rent and bills  
- 🧳 Friends planning trips or events  
- 👨‍👩‍👧‍👦 Families managing household spending  
- 👥 Teams coordinating shared costs  

The app helps reduce misunderstandings and time spent on manual calculations, and provides a central place to track, manage, and settle expenses.

## ✨ Features
- **User Registration and Authentication**: Sign up, log in, and manage profile securely.
- **Group Creation and Management**: Create groups, invite members, manage group settings.
- **Expense Tracking and Split Calculation**: Add expenses, split them equally or by custom percentages.
- **Debt Settling**: Mark debts as paid and automatically update balances.
- **Real-Time Updates**: Instant updates using WebSockets (Appwrite Realtime).
- **Balance Overview and Reports**: Dashboards, summaries, and exportable reports.
- **Notifications**: Alerts for new expenses, payments, and balance changes.

## 🛠️ Tech Stack
- **Frontend**: React Native (via [Expo](https://expo.dev/))
- **Backend**: [Appwrite](https://appwrite.io/) (Authentication, Database, Functions)
- **Real-Time Features**: Appwrite’s Realtime API

## 🧪 Backend Routes

| Endpoint                     | Method | Description                            |
|-----------------------------|--------|----------------------------------------|
| `/register`                 | POST   | Create a new user account              |
| `/login`                    | POST   | Authenticate and return session token  |
| `/groups`                   | GET    | Fetch all groups user is a part of     |
| `/groups`                   | POST   | Create a new group                     |
| `/groups/:id/expenses`      | POST   | Add a new expense to a group           |
| `/groups/:id/expenses`      | GET    | Get all expenses for a group           |
| `/groups/:id/settle`        | POST   | Mark a debt as settled                 |

> Authentication and session management are handled via Appwrite's built-in services. Business logic is managed using Appwrite Functions.

## ⚙️ How It Works
1. Users sign up and log in using Appwrite Authentication.
2. Users can create groups and invite others to join.
3. Expenses are added with either equal or custom splits.
4. The app calculates and updates everyone's balance.
5. Users mark debts as paid and receive real-time updates and notifications.

## 🚀 How to Run the App Locally

### Step 1: Install Expo CLI
```bash
npm install -g expo-cli
```

### Step 2: Clone the Repository
```bash
git clone https://github.com/<repo-owner-username>/budgetbuddy.git or git clone <repo-url>
cd budgetbuddy
```

### Step 3: Install Dependencies
```bash
npx expo install react-native-appwrite react-native-url-polyfill
```

### Step 4: Set Up Environment Variables

Create a `.env` file in the root directory and add:
```env
APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
APPWRITE_PROJECT_ID=your-project-id
APPWRITE_DATABASE_ID=your-database-id
APPWRITE_COLLECTION_ID=your-collection-id
```

### Step 5: Start the Development Server
```bash
npx expo start
```

## Conclusion
BudgetBuddy simplifies the often stressful process of managing shared finances. Whether it’s a group of friends on a trip or roommates splitting rent, our app brings clarity, fairness, and ease to expense tracking.

Built with React Native and Appwrite, this project demonstrates full-stack integration with real-time updates, authentication, and cross-platform support.
### This project is still in development, and we plan to roll out more features in upcoming phases. Stay tuned!
