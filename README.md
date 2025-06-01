# BudgetBuddy

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

## 🚀 Running the App

### 1. Install Expo CLI
```bash
npm install -g expo-cli

### 2. Clone the repository
```bash
git clone https://github.com/your-username/budgetbuddy.git
cd budgetbuddy
