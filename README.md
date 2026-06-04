# Balance Game

Balance Game is a web application developed as a term project for the Advanced Web Programming course.

Users can sign in with their Google account, choose one option between two choices, and vote on balance game questions. After voting, users can view the voting results, check comments, and see which option they previously selected.

## Main Features

### 1. Balance Game Voting

- Loads questions and options stored in the server database.
- Allows users to vote for one of two options.
- Displays vote counts and percentages after voting.
- Prevents the same user from voting multiple times on the same question.

### 2. Google Login

- Supports Google OAuth login.
- Stores logged-in user information in the backend database.
- Allows only logged-in users to vote and use the comment feature.
- Maintains login state even after page refresh.

### 3. Previous Selection Check

- Shows the user's previously selected option only when it is different from the option currently selected.
- Displays previous selection information based on the server response.
- Allows users to compare their current choice with their past choice through the previous selection button in the result modal.

### 4. Comment Feature

- Allows users to write comments for each question.
- Allows one comment per user for each question.
- Allows users to delete their own comments.

### 5. Random Question Display

- Displays questions in a randomized order.
- Prevents duplicate questions within the same round.
- Maintains the current question state after page refresh.

### 6. Image-Based Options

- Displays each option with an image.
- Uses 15 questions and 30 options stored in the database.

## Tech Stack

### Frontend

- React
- Vite
- JavaScript
- CSS

### Backend

- Node.js
- Express.js

### Database

- MySQL
- phpMyAdmin

### Deployment

- Frontend: Render
- Backend: Render

## Project Structure

    balance-game
    ├── backend
    │   ├── migrations
    │   ├── server.js
    │   ├── swagger.js
    │   └── package.json
    ├── public
    │   ├── images
    │   ├── favicon.svg
    │   └── icons.svg
    ├── src
    │   ├── assets
    │   ├── components
    │   ├── constants
    │   ├── hooks
    │   ├── services
    │   ├── utils
    │   ├── App.jsx
    │   └── main.jsx
    ├── index.html
    ├── package.json
    ├── vite.config.js
    └── README.md

## How to Run

### 1. Run the Backend

    cd backend
    npm install
    npm run dev

### 2. Run the Frontend

Open a new terminal in the project root directory and run:

    npm install
    npm run dev

## Project Links

- Frontend: https://balance-game-frontend.onrender.com
- Backend API: https://balance-game-backend-gihu.onrender.com
- Swagger UI: https://balance-game-backend-gihu.onrender.com/api-docs


## Main API Endpoints

| Method | Endpoint                                 | Description                                                                    |
| ------ | ---------------------------------------- | ------------------------------------------------------------------------------ |
| GET    | `/api/health`                            | Checks backend and database connection status                                  |
| GET    | `/api/questions`                         | Gets all questions with options, vote counts, and image URLs                   |
| POST   | `/api/auth/google`                       | Verifies a Google access token and creates or updates the user in the database |
| POST   | `/api/questions/:questionId/vote`        | Submits or updates a user's vote for a question                                |
| GET    | `/api/questions/:questionId/comments`    | Gets comments for a question, including the user's own comment status          |
| POST   | `/api/questions/:questionId/comments`    | Creates one comment for the logged-in user on a question                       |
| DELETE | `/api/questions/:questionId/comments/me` | Deletes the logged-in user's own comment on a question                         |


## Database Overview

The main database tables are as follows:

| Table | Description |
|---|---|
| users | Stores Google login user information |
| questions | Stores balance game questions |
| options | Stores options for each question |
| responses | Stores user voting records |
| comments | Stores comments for each question |

## Project Highlights

- Implemented a separated frontend and backend architecture.
- Connected voting, comments, login, and user data with the database.
- Used Google OAuth to identify users and prevent duplicate voting.
- Managed questions and options through the database instead of hardcoded frontend data.
- Deployed the frontend and backend separately using Vercel and Render.
- Added Swagger documentation for backend API testing and reference.

## Team Members

- chanwook01
- KIS02
