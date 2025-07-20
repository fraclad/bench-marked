# 🪑 bench-marked!

**Track your bench-sitting adventures**

A Next.js web application for logging and tracking bench locations with GPS coordinates, built with MongoDB and JWT authentication.

## Features

- **Automatic GPS Location Detection** - One-click bench logging with coordinates
- **MongoDB Database** - Secure data storage with full CRUD operations  
- **JWT Authentication** - 30-minute sessions with auto-logout
- **Data Management** - Edit and manage all bench records in a table view
- **Responsive Design** - Works seamlessly on mobile and desktop
- **Animated Background** - Subtle falling chair animations
- **Houston Made** - Crafted with care in Houston, Texas

## Tech Stack

- **Frontend**: Next.js 14, React, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: MongoDB
- **Authentication**: JWT tokens
- **Deployment**: Vercel
- **Geolocation**: Browser APIs with reverse geocoding

## Quick Start

### Prerequisites

- Node.js 18 or higher
- MongoDB database (MongoDB Atlas recommended)

### 1. Clone & Install

```bash
git clone https://github.com/yourusername/bench-marked-app.git
cd bench-marked-app
npm install
```

### 2. Environment Variables

Create a `.env.local` file in the root directory:

```env
# MongoDB Connection
MONGODB_URI=your_mongodb_connection_string

# JWT Secret (use a secure random string)
JWT_SECRET=your_super_secret_jwt_key_make_it_long_and_random

# App URL (use full path including subdirectory for production)
NEXTAUTH_URL=http://localhost:3000
```

### 3. Database Setup

Create these MongoDB collections in your database:

**Collection: `users`**
```javascript
// Sample user documents
{
  username: "",
  password: "" 
}
```

**Collection: `benchdata`**
```javascript
// This collection will be created automatically when you log your first bench
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see your app in action.

## Authentication

The app comes with these demo users:
- **Username**: `rahmat` | **Password**: `toyotacamry`
- **Username**: `chmod` | **Password**: `orangeboyAHHH`

Sessions expire after 30 minutes for security.

## How to Use

1. **Sign In** - Use demo credentials or add your own users to MongoDB
2. **Log Location** - Click the red button to capture your current bench location
3. **View Records** - See your last 3 bench logs on the home page
4. **Manage Data** - Click "see all" to view, edit, or delete all records

## Deployment

### Deploy to Vercel

1. **Push to GitHub**:
```bash
git add .
git commit -m "Initial commit"
git push origin main
```

2. **Connect to Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Add environment variables in Vercel dashboard

3. **Environment Variables in Vercel**:
   ```
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=some whatever lmao
   NEXTAUTH_URL=https://chmod-labs.com/app/bench-marked
   ```

4. **Deploy** - Vercel will automatically deploy on every push

### Subdirectory Deployment

This app is configured to deploy at `chmod-labs.com/app/bench-marked` using Next.js basePath configuration. The `next.config.mjs` file includes:

```javascript
const nextConfig = {
  basePath: '/app/bench-marked',
  trailingSlash: true,
  assetPrefix: '/app/bench-marked/',
};
```

## Database Schema

### Users Collection
```javascript
{
  _id: ObjectId,
  username: String,
  password: String  // Store hashed in production
}
```

### Benchdata Collection
```javascript
{
  _id: ObjectId,
  timestamp: String,      // "2025-01-19 5:30 PM CT"
  location: String,       // "Houston, TX"
  latitude: Number,       // 29.7604
  longitude: Number,      // -95.3698
  loggedBy: String,       // "rahmat"
  userId: ObjectId,       // Reference to user
  dateLogged: Date,       // Parsed date for queries
  createdAt: Date,
  updatedAt: Date,
  accuracy: Number,       // GPS accuracy in meters
  notes: String,          // Optional notes
  tags: [String],         // Optional tags
  isActive: Boolean,      // For soft deletes
  version: Number         // For optimistic locking
}
```

## Security Features

- JWT tokens with 30-minute expiration
- Environment variable protection for secrets
- Input validation on all API endpoints
- CORS protection
- Session monitoring with auto-logout

## Customization

- **Colors**: Edit Tailwind classes in component files
- **Animations**: Modify `FallingChairs.js` component
- **Database**: Add more fields to the schema as needed
- **Authentication**: Extend with OAuth, password hashing, etc.