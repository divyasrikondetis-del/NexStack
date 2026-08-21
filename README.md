# 🚀 NexStack — Developer Community & Knowledge Platform

NexStack is a full-stack developer community platform inspired by Stack Overflow. It combines technical Q&A, a developer social feed, reputation management, jobs, subscriptions, multilingual support, authentication security, notifications, and administrator moderation in one platform.

---

## 📌 Project Description

NexStack allows developers to ask and answer technical questions, share technical content, interact with other developers, build reputation, follow community members, discover jobs, purchase premium memberships, manage their security sessions, and use the platform in multiple languages.

The platform is designed as a full-stack web application with a React frontend, Node.js/Express backend, MongoDB database, external services, and cloud deployment.

---

## 🏗️ COMPLETE PROJECT STRUCTURE

NexStack/
│
├── client/                              # Frontend application
│   ├── public/
│   │
│   ├── src/
│   │   ├── api/
│   │   │   └── index.js                 # Central Axios/API configuration
│   │   │
│   │   ├── assets/                      # Images and frontend assets
│   │   │
│   │   ├── components/                  # Reusable React components
│   │   │
│   │   ├── contexts/
│   │   │   └── LanguageContext.jsx      # Language management
│   │   │
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── ForgotPassword.jsx
│   │   │   ├── Home.jsx
│   │   │   ├── Questions.jsx
│   │   │   ├── QuestionDetails.jsx
│   │   │   ├── AskQuestion.jsx
│   │   │   ├── Jobs.jsx
│   │   │   ├── PostJob.jsx
│   │   │   ├── TransferReputation.jsx
│   │   │   ├── Profile.jsx
│   │   │   ├── Notifications.jsx
│   │   │   ├── AdminDashboard.jsx
│   │   │   ├── Subscription.jsx
│   │   │   └── ...
│   │   │
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── styles/
│   │
│   ├── .env
│   ├── package.json
│   └── vite.config.js
│
├── server/                              # Backend application
│   ├── models/
│   │   ├── User.js
│   │   ├── Question.js
│   │   ├── Answer.js
│   │   ├── Post.js
│   │   ├── Job.js
│   │   ├── Notification.js
│   │   ├── Session.js
│   │   ├── Report.js
│   │   ├── ReputationHistory.js
│   │   ├── ReputationTransfer.js
│   │   ├── Subscription.js
│   │   └── ...
│   │
│   ├── routes/
│   │   ├── userRoutes.js
│   │   ├── questionRoutes.js
│   │   ├── answerRoutes.js
│   │   ├── postRoutes.js
│   │   ├── jobRoutes.js
│   │   ├── notificationRoutes.js
│   │   ├── reputationRoutes.js
│   │   ├── adminRoutes.js
│   │   ├── subscriptionRoutes.js
│   │   └── ...
│   │
│   ├── controllers/
│   │   └── ...
│   │
│   ├── middleware/
│   │   ├── auth.js
│   │   ├── admin.js
│   │   └── ...
│   │
│   ├── utils/
│   │   ├── cloudinary.js
│   │   ├── sendEmail.js
│   │   ├── translation.js
│   │   └── ...
│   │
│   ├── server.js
│   ├── package.json
│   ├── .env
│   └── .env.example
│
├── .gitignore
└── README.md

---

# 🛠️ TECHNOLOGIES AND TOOLS USED

NexStack is developed using the following technologies and services:

### Frontend Technologies

- React.js
- Vite
- JavaScript
- JSX
- React Router
- Axios
- React Context API
- CSS
- LocalStorage

### Backend Technologies

- Node.js
- Express.js
- JavaScript
- REST API
- JWT Authentication
- Express Middleware

### Database Technologies

- MongoDB
- Mongoose

### Authentication & Security

- JWT
- OTP verification
- Email verification
- Mobile OTP verification
- Password hashing
- Device/session tracking
- Trusted devices
- Login activity logging

### External Services

- Cloudinary — image storage
- Nodemailer / SMTP — email delivery
- LibreTranslate — translation
- Stripe or Razorpay — subscriptions and payments

### Development Tools

- Visual Studio Code
- PowerShell
- npm
- Git
- GitHub

### Deployment Tools

- Render
- GitHub
- MongoDB cloud database

---

# 🔐 ENVIRONMENT VARIABLES

Sensitive information is stored in environment variables and must not be committed to GitHub.

### Backend environment

PORT=5000
NODE_ENV=production

MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret

CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

EMAIL_USER=your_email
EMAIL_PASS=your_email_password

TRANSLATION_API_URL=https://libretranslate.com/translate
TRANSLATION_API_KEY=your_translation_api_key

STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_webhook_secret

### Frontend environment

For local development:

VITE_API_URL=http://localhost:5000/api

For production:

VITE_API_URL=https://nexstack-3.onrender.com/api

Environment files are excluded using .gitignore.

---

# 👤 USER AUTHENTICATION

NexStack provides secure authentication.

Users can:

- Register
- Login
- Logout
- Use JWT authentication
- Access protected pages
- Verify OTP
- Reset passwords
- Manage login sessions

Authentication flow:

User
  ↓
React frontend
  ↓
Login API
  ↓
Express backend
  ↓
Validate credentials
  ↓
Generate JWT
  ↓
Return token
  ↓
Frontend stores authentication information
  ↓
Axios sends Bearer token with protected requests

---

# 🔑 FORGOT PASSWORD

The platform provides a dedicated Forgot Password page and route.

Users can recover their account using:

- Registered email
- Registered phone number

The feature limits password recovery requests to one request per day.

If the user tries again during the same day:

"You can use this option only one time per day."

A password generator can create a random password containing:

- Uppercase letters
- Lowercase letters

It does not contain:

- Numbers
- Special characters

---

# ❓ TECHNICAL Q&A SYSTEM

NexStack provides Stack Overflow-style question and answer functionality.

Users can:

- Ask questions
- Edit questions
- Delete questions
- Answer questions
- Edit answers
- Delete answers
- Vote on questions
- Vote on answers
- Accept answers
- Search questions
- View question details

The Q&A system is the main knowledge-sharing component of NexStack.

---

# 🌐 COMMUNITY FEED

Users can publish developer-focused content such as:

- Technical updates
- Images
- Code snippets
- Project showcases
- Learning achievements
- Development-related posts

The feed allows users to interact with the community.

---

# ❤️ SOCIAL INTERACTION

Users can:

- Like posts
- Comment
- Reply
- Share
- Bookmark
- Edit their own posts
- Delete their own posts
- Follow other users

Users can follow developers they are interested in to personalize their community experience.

---

# 🔥 TRENDING POSTS

Posts can be ranked according to engagement.

Engagement can include:

- Likes
- Comments
- Shares
- Other interactions

Highly engaged posts can appear in the trending section.

---

# #️⃣ HASHTAGS

Posts support hashtags for content discovery.

Examples:

#React
#JavaScript
#NodeJS
#MongoDB
#AI
#WebDevelopment

Users can discover posts using hashtags.

---

# 🔔 NOTIFICATIONS

The notification system supports:

- Likes
- Comments
- Mentions
- New followers
- Other important account events

Users can:

- View notifications
- Mark notifications as read
- Delete notifications
- View unread notification count

---

# 🚨 REPORTING AND MODERATION

Users can report inappropriate content.

Reports can store:

- Post
- Reporting user
- Reason
- Timestamp
- Report status

Administrators can:

- Review reports
- Remove violating content
- Suspend users
- Monitor repeated violations

---

# 👨‍💼 ADMINISTRATION

Administrators have access to platform moderation and security functions.

Admin functionality includes:

- Admin dashboard
- Report management
- Security logs
- Content moderation
- Content removal
- User suspension
- Login monitoring

---

# 🏆 REPUTATION SYSTEM

NexStack rewards users for meaningful community contributions.

### Reputation rewards

Answer posted:
+5

Answer accepted:
+10

Answer receives 5 upvotes:
+5

Question receives 10 upvotes:
+2

Complete mandatory profile:
+10 one-time bonus

### Reputation penalties

Downvote received:
-2

User deletes an answer:
-5

Administrator removes violating content:
-10

---

# 🛡️ REPUTATION PRIVILEGES

Reputation unlocks community privileges.

50 reputation:
Comment without restrictions

100 reputation:
Edit community posts

250 reputation:
Vote to close questions

500 reputation:
Report inappropriate content

---

# 🔄 REPUTATION TRANSFER

Users can transfer reputation to other users.

Rules:

- Sender must have more than 50 reputation
- Maximum 50 points per transaction
- Maximum 100 points per day
- Receiver must be another user
- Reason must be provided
- Every transfer must be recorded

Transfer history contains:

- Sender
- Receiver
- Points
- Reason
- Timestamp

---

# 📜 REPUTATION HISTORY

Every reputation increase or decrease can be recorded in a dedicated activity history.

Example:

+5  Answer posted
+10 Answer accepted
+5  Answer reached 5 upvotes
+2  Question reached 10 upvotes
-2  Downvote received
-5  Answer deleted
-10 Administrator removed content

Users can view reputation activity on their profile.

---

# 🌍 MULTI-LANGUAGE SUPPORT

NexStack supports six languages:

1. English
2. Spanish
3. Hindi
4. Portuguese
5. Chinese
6. French

The language selection is managed through the frontend language context.

---

# 🔐 SECURE LANGUAGE SWITCHING

Language switching requires verification.

For French:

User selects French
  ↓
Email OTP sent
  ↓
User verifies OTP
  ↓
French language applied

For other supported languages:

User selects language
  ↓
Mobile OTP sent
  ↓
User verifies OTP
  ↓
Selected language applied

---

# 📱 ADVANCED LOGIN SECURITY

Every successful login can record:

- Browser
- Operating system
- Device type
- IP address
- Location when available
- Login timestamp

This information allows the system to identify unusual login activity.

---

# 💻 DEVICE AND SESSION MANAGEMENT

Users can view active login sessions.

Users can:

- View devices
- Revoke individual sessions
- Trust devices
- Manage active sessions

Inactive sessions can expire automatically after a configurable period.

Unrecognized devices can require OTP verification.

Trusted devices can be remembered for future logins.

---

# 📧 SECURITY EMAILS

The email system can send notifications for:

- New device login
- OTP verification
- Password recovery
- Language verification
- Subscription confirmation
- Other security events

---

# 💼 JOB SYSTEM

NexStack includes a developer jobs section.

Users can:

- View jobs
- Search jobs
- View job details
- Post jobs
- Delete jobs

A job can contain:

- Job title
- Company
- Location
- Salary
- Description
- Requirements
- Posted user
- Creation date

---

# 💳 SUBSCRIPTION AND PREMIUM MEMBERSHIP

NexStack supports premium plans using Stripe or Razorpay.

### FREE PLAN

₹0/month

- 1 question per day
- Basic search

### BRONZE PLAN

₹99/month

- 5 questions per day
- Bronze profile badge
- Advanced search filters

### SILVER PLAN

₹299/month

- 15 questions per day
- Silver profile badge
- Priority support
- Enhanced profile visibility
- Unlimited bookmarks

### GOLD PLAN

₹999/month

- Unlimited questions
- Gold profile badge
- Highest search priority
- Featured profile visibility
- Priority customer support
- Exclusive community features

---

# 💰 SUBSCRIPTION DASHBOARD

Users can view:

- Active subscription
- Subscription status
- Payment history
- Renewal date
- Billing information
- Invoice information
- Downloadable invoices

Successful payment flow:

Payment
  ↓
Payment verification
  ↓
Subscription activated
  ↓
Invoice generated
  ↓
Confirmation email sent

---

# 🖼️ IMAGE STORAGE

Cloudinary can be used for image uploads.

Upload flow:

React
  ↓
Backend
  ↓
Cloudinary
  ↓
Image URL
  ↓
MongoDB

The database stores the image reference/URL.

---

# 🌐 TRANSLATION

LibreTranslate can be used to provide translation functionality.

Frontend sends translation request:

React
  ↓
Express API
  ↓
Translation service
  ↓
Translated text
  ↓
React UI

---

# 🔎 SEARCH

The platform supports content discovery through search.

Search can include:

- Questions
- Posts
- Hashtags
- Users
- Jobs

Premium plans can provide advanced search functionality.

---

# ⚡ PAGINATION AND INFINITE SCROLLING

Community content is designed to support server-side pagination.

Instead of loading thousands of posts at once:

Page 1
  ↓
Load posts
  ↓
User scrolls
  ↓
Request Page 2
  ↓
Load more posts
  ↓
Continue

This reduces unnecessary data loading and improves performance.

---

# 🚀 PERFORMANCE

NexStack uses performance-oriented techniques such as:

- Server-side pagination
- Infinite scrolling
- Centralized API configuration
- Optimized API requests
- Database indexing where appropriate
- Efficient React rendering
- Lazy loading where appropriate

---

# 🔗 API ARCHITECTURE

The frontend communicates with the backend through REST APIs.

Architecture:

React
  ↓
Axios
  ↓
Express REST API
  ↓
Routes
  ↓
Controllers
  ↓
Mongoose
  ↓
MongoDB

Production API:

https://nexstack-3.onrender.com/api

Health endpoint:

https://nexstack-3.onrender.com/api/health

---

# 🔐 JWT REQUEST FLOW

Login
  ↓
Backend validates user
  ↓
JWT generated
  ↓
Frontend stores token
  ↓
Axios interceptor reads token
  ↓
Authorization: Bearer <token>
  ↓
Protected API request

If the backend returns HTTP 401:

401
  ↓
Remove token
  ↓
Remove stored user
  ↓
Redirect to login

---

# 🗄️ DATABASE

MongoDB is the primary database.

Mongoose is used as the ODM.

Main data areas include:

- Users
- Questions
- Answers
- Posts
- Jobs
- Notifications
- Sessions
- Reports
- Reputation history
- Reputation transfers
- Subscriptions
- Payments

---

# ☁️ DEPLOYMENT

## GitHub

GitHub is used for:

- Source code
- Version control
- Collaboration
- Deployment source

Repository:

https://github.com/divyasrikondetis-del/NexStack

## Backend

Backend is deployed using Render.

Production backend:

https://nexstack-3.onrender.com

Health endpoint:

https://nexstack-3.onrender.com/api/health

Expected response:

{
  "status": "ok",
  "mongodb": "connected",
  "timestamp": "..."
}

## Frontend

The React/Vite frontend can be deployed separately as a static web service.

Production frontend environment variable:

VITE_API_URL=https://nexstack-3.onrender.com/api

---

# 🔄 GIT WORKFLOW

Development workflow:

Make code changes
  ↓
Test locally
  ↓
git status
  ↓
git add
  ↓
git commit
  ↓
git push
  ↓
GitHub
  ↓
Render deployment

Example:

git add client/src/api/index.js
git add client/src/pages/Jobs.jsx
git add client/src/pages/TransferReputation.jsx

git commit -m "Fix production API URLs"

git push origin master

---

# 🔒 GIT SECURITY

Environment files must not be committed to GitHub.

The .gitignore contains rules for:

.env
.env.*
*.env
server/.env
client/.env
node_modules/
.pnpm-store/
dist/
build/

Secrets such as:

MONGO_URI
JWT_SECRET
CLOUDINARY_API_SECRET
EMAIL_PASS
STRIPE_SECRET_KEY

must be configured through environment variables.

For production, these values should be added through the Render Environment Variables section rather than committed to the repository.

---

# 🧩 COMPLETE TECHNOLOGY STACK

Frontend:
React.js
Vite
JavaScript
JSX
React Router
Axios
Context API
CSS
LocalStorage

Backend:
Node.js
Express.js
JavaScript
REST API
JWT
Middleware

Database:
MongoDB
Mongoose

Authentication:
JWT
OTP
Email verification
Mobile verification
Password hashing
Session management
Trusted devices

External services:
Cloudinary
Nodemailer / SMTP
LibreTranslate
Stripe / Razorpay

Development:
VS Code
PowerShell
npm
Git
GitHub

Deployment:
Render
MongoDB Cloud

---

# 🎯 COMPLETE SYSTEM ARCHITECTURE

                    ┌──────────────────────┐
                    │        USER          │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │ React + Vite Client  │
                    │                      │
                    │ Pages                │
                    │ Components           │
                    │ Context              │
                    │ Axios                │
                    └──────────┬───────────┘
                               │
                            REST API
                               │
                               ▼
                    ┌──────────────────────┐
                    │ Node.js + Express    │
                    │                      │
                    │ Routes               │
                    │ Controllers          │
                    │ Middleware           │
                    │ JWT Authentication   │
                    └──────────┬───────────┘
                               │
              ┌────────────────┼─────────────────┐
              │                │                 │
              ▼                ▼                 ▼
       ┌────────────┐   ┌────────────┐   ┌──────────────┐
       │  MongoDB   │   │ Cloudinary │   │ Email / OTP  │
       │            │   │            │   │              │
       │ Users      │   │ Images     │   │ Verification │
       │ Questions  │   │ Files      │   │ Notifications│
       │ Answers    │   └────────────┘   └──────────────┘
       │ Posts      │
       │ Jobs       │
       │ Reputation │
       │ Sessions   │
       │ Reports    │
       │ Payments   │
       └────────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │ External Services    │
                    │                      │
                    │ Stripe / Razorpay    │
                    │ LibreTranslate       │
                    └──────────────────────┘

---

# 📊 FEATURE SUMMARY

| Module | Main Features |
|---|---|
| Authentication | Register, login, logout, JWT, OTP |
| Forgot Password | Email/phone recovery, daily request limit, password generator |
| Q&A | Questions, answers, voting, accepted answers |
| Community Feed | Technical posts, images, code, projects, achievements |
| Social | Likes, comments, replies, shares, bookmarks, follows |
| Trending | Engagement-based ranking |
| Hashtags | Content discovery |
| Notifications | Likes, comments, mentions, followers |
| Moderation | Reports, content removal, suspension |
| Reputation | Earn, lose, transfer, history |
| Privileges | Reputation-based permissions |
| Languages | English, Spanish, Hindi, Portuguese, Chinese, French |
| Security | Devices, sessions, IP, browser, OTP |
| Jobs | Job posting and discovery |
| Subscription | Free, Bronze, Silver, Gold |
| Payments | Stripe/Razorpay |
| Invoices | Payment history and downloadable invoices |
| Email | OTP, security, payment notifications |
| Images | Cloudinary |
| Translation | LibreTranslate |
| Database | MongoDB + Mongoose |
| Frontend | React + Vite |
| Backend | Node.js + Express |
| API | REST + Axios |
| Deployment | Render |
| Version Control | Git + GitHub |

---

# 🏁 FINAL PROJECT GOAL

NexStack combines several developer-platform concepts into one application:

Stack Overflow
+
Developer Community
+
Social Feed
+
Reputation System
+
Jobs Platform
+
Premium Membership
+
Secure Authentication
+
Multilingual Platform
+
Admin Moderation

The goal is to provide developers with a single platform where they can:

Learn
Ask
Answer
Share
Connect
Build Reputation
Discover Jobs
Follow Developers
Manage Security
Upgrade Membership
And participate in a technical community.

---

# 👩‍💻 PROJECT

NexStack

Developer Community & Knowledge Platform

Built with React, Vite, Node.js, Express, MongoDB, Mongoose, JWT, Axios, Cloudinary, email/OTP services, translation services, Stripe/Razorpay, GitHub, and Render.
