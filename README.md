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

- Shows the option previously selected by the logged-in user.
- Displays previous selection information based on the server response.
- Allows users to check their past choice through the previous selection button in the result modal.

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

- Frontend: Vercel
- Backend: Render

## Project Structure

    balance-game
    ├── backend
    │   ├── server.js
    │   ├── package.json
    │   └── swagger.js
    ├── public
    │   └── images
    ├── src
    │   ├── components
    │   ├── hooks
    │   ├── App.jsx
    │   └── main.jsx
    ├── package.json
    └── README.md

## How to Run

### 1. Run the Frontend

    npm install
    npm run dev

### 2. Run the Backend

    cd backend
    npm install
    npm run dev

## API Documentation

After running the backend server, the Swagger API documentation can be accessed through the following endpoint:

    /api-docs

Example for local development:

    http://localhost:3001/api-docs

## Main API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | /api/questions | Get all questions |
| POST | /api/questions/:questionId/vote | Submit a vote |
| POST | /api/auth/google | Google login |
| GET | /api/questions/:questionId/comments | Get comments for a question |
| POST | /api/questions/:questionId/comments | Create a comment |
| DELETE | /api/comments/:commentId | Delete a comment |

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
