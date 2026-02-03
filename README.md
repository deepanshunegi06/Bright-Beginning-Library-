# Bright Beginning Library In/Out System

A complete Next.js 14 application for managing library attendance with GPS-based location verification.

## 🚀 Features

### Core Features
- **GPS Location Verification**: Access restricted to library premises (200m radius)
- **Daily Attendance Tracking**: One IN and one OUT per student per day
- **Smart Yesterday Reminder**: Alerts students who forgot to mark OUT yesterday
- **Mobile-First Responsive Design**: Works perfectly on all devices
- **Admin Dashboard**: Full control with live statistics and management tools

### Student Features
- Single-page registration and login
- Automatic mark IN on registration
- Dashboard showing today's status
- Confirmation dialog before marking OUT
- Prevention of multiple entries per day

### Admin Features
- Secure admin login (username: `owner`, password: `owner123`)
- Live inside count and crowd indicators
- Today's attendance table with search
- Export to CSV functionality
- Force mark OUT capability
- Delete records
- Real-time refresh

## 📋 Prerequisites

Before you begin, ensure you have:
- Node.js 18+ installed
- MongoDB Atlas account (free tier works)
- Library GPS coordinates

## 🔧 Local Development Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Update `.env.local` with your values:

```env
MONGODB_URI=your_mongodb_connection_string
ADMIN_USERNAME=owner
ADMIN_PASSWORD=owner123
LIBRARY_LATITUDE=28.36695925689707
LIBRARY_LONGITUDE=77.06503118002826
LIBRARY_RADIUS_METERS=200
```

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🚀 Deploy to Vercel

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin <your-github-repo-url>
git push -u origin main
```

### 2. Deploy on Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import your GitHub repository
4. Add Environment Variables:
   - `MONGODB_URI`
   - `ADMIN_USERNAME`
   - `ADMIN_PASSWORD`
   - `LIBRARY_LATITUDE`
   - `LIBRARY_LONGITUDE`
   - `LIBRARY_RADIUS_METERS`
5. Click "Deploy"

### 3. Test Location Access

- Visit your deployed URL
- Allow location access when prompted
- Verify access works within library premises

## 📍 How Location Verification Works

- Uses browser Geolocation API (requires HTTPS)
- Checks if user is within specified radius of library coordinates
- Fallback to IP-based check for development
- Updates every 10 seconds automatically

## 🎯 Getting Library Coordinates

1. Open Google Maps
2. Find your library location
3. Right-click on the exact spot
4. Click "Copy coordinates"
5. Paste into environment variables

## 🔒 Security Notes

- Location verification works best on mobile devices
- GPS accuracy: 5-50 meters (indoor/outdoor variation)
- Users must allow location access
- Admin credentials should be changed in production

## 🛠️ Admin Access

- **Login URL**: `/admin/login`
- **Default Username**: `owner`
- **Default Password**: `owner123`
- **Dashboard**: `/admin/dashboard`

## 📱 Testing

### Development Bypass
For testing without location check:
```javascript
localStorage.setItem('wifi_check_bypass', 'true')
```

### Location Check
Visit `/api/network-check?lat=YOUR_LAT&lon=YOUR_LON` to test coordinates

## 🏗️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Database**: MongoDB with Mongoose
- **Styling**: Tailwind CSS
- **Authentication**: bcryptjs
- **Location**: Geolocation API
- Browser extension
- Server-side IP/MAC address validation
- Captive portal integration

## 📱 User Guide

### For Students

1. **First Time Registration**
   - Enter your full name and phone number
   - Click "Register & Enter Library"
   - You'll be automatically marked IN

2. **Daily Login**
   - Enter the same phone number
   - System checks if you forgot to mark OUT yesterday
   - You'll see your dashboard

3. **Mark OUT**
   - Click "Mark Out" button on dashboard
   - Confirm your action
   - You cannot mark IN again today after marking OUT

### For Admins

1. **Login**
   - Go to `/admin/login`
   - Username: `owner`
   - Password: `owner123`

2. **Dashboard Features**
   - View live inside count
   - See crowd status (Low/Medium/High)
   - Search students by name or phone
   - Export today's data to CSV
   - Force mark OUT for students who forgot
   - Delete incorrect records

## 🏗️ Project Structure

```
bright-beginning-library/
├── app/
│   ├── api/
│   │   ├── register/route.ts          # Student registration & login
│   │   ├── markOut/route.ts           # Mark OUT endpoint
│   │   ├── user/status/route.ts       # Get user status
│   │   └── admin/
│   │       ├── login/route.ts         # Admin authentication
│   │       ├── today/route.ts         # Get today's records
│   │       ├── forceOut/route.ts      # Force mark OUT
│   │       └── deleteRecord/route.ts  # Delete attendance record
│   ├── dashboard/page.tsx             # Student dashboard
│   ├── admin/
│   │   ├── login/page.tsx             # Admin login page
│   │   └── dashboard/page.tsx         # Admin dashboard
│   ├── page.tsx                       # Home/registration page
│   ├── layout.tsx                     # Root layout
│   └── globals.css                    # Global styles
├── components/
│   └── WiFiGuard.tsx                  # WiFi access control component
├── lib/
│   ├── db.ts                          # MongoDB connection
│   ├── wifi-check.ts                  # WiFi checking utilities
│   └── utils.ts                       # Helper functions
├── models/
│   ├── User.ts                        # User schema
│   └── Attendance.ts                  # Attendance schema
├── types/
│   └── index.ts                       # TypeScript interfaces
├── .env.local                         # Environment variables
├── package.json
├── tsconfig.json
└── tailwind.config.ts
```

## 🎨 Design System

### Colors
- Primary Blue: `#2563eb`
- Blue Dark: `#1e40af`
- Blue Light: `#3b82f6`
- White backgrounds with subtle gradients
- Clean, modern library aesthetic

### Typography
- Inter font family
- Clear hierarchy with proper font weights
- Mobile-optimized text sizes

## 🔒 Security Features

1. **WiFi-Based Access Control**: Only works on library network
2. **Server-Side Time**: All timestamps use server time (cannot be faked)
3. **Admin Authentication**: Simple but secure admin credentials
4. **Session Management**: Uses sessionStorage for temporary data
5. **Input Validation**: All inputs validated on client and server
6. **MongoDB Indexes**: Prevents duplicate entries per day

## 📊 Database Schema

### Users Collection
```javascript
{
  name: String,
  phone: String (unique),
  registeredAt: Date
}
```

### Attendance Collection
```javascript
{
  name: String,
  phone: String,
  date: String (YYYY-MM-DD),
  inTime: String,
  outTime: String | null
}
// Compound index: { phone: 1, date: 1 }
```

## 🚦 Business Rules

### Daily Attendance Rules
1. Each student can mark IN only once per day
2. Each student can mark OUT only once per day
3. After marking OUT, cannot mark IN again same day
4. System blocks all further attempts with clear message

### Yesterday Forgotten Rule
1. If student didn't mark OUT yesterday
2. Show alert banner on next login
3. Admin can force mark OUT the previous day
4. Student can still proceed with today's entry

### Crowd Indicators
- 🟢 Low Crowd: 0-20 students
- 🟡 Medium Crowd: 21-50 students
- 🔴 High Crowd: 50+ students

## 🔄 API Endpoints

### Student APIs
- `POST /api/register` - Register or login student
- `POST /api/markOut` - Mark OUT from library
- `POST /api/user/status` - Get current user status

### Admin APIs
- `POST /api/admin/login` - Admin authentication
- `GET /api/admin/today` - Get all today's records
- `POST /api/admin/forceOut` - Force mark OUT a student
- `POST /api/admin/deleteRecord` - Delete a record

## 🎯 Future Enhancements

The current structure supports easy addition of:

1. **Study Hours Tracking**
   - Calculate time spent per session
   - Weekly/monthly reports
   - Personal study goals

2. **Leaderboard**
   - Most study hours
   - Consistency streaks
   - Weekly/monthly rankings

3. **Seat Availability**
   - Live seat map
   - Seat reservation system
   - Capacity alerts

4. **Analytics Dashboard**
   - Peak hours analysis
   - Popular days
   - Average study duration
   - Monthly trends

5. **Notifications**
   - SMS reminders to mark OUT
   - Daily/weekly reports
   - Custom announcements

## 🐛 Troubleshooting

### Cannot connect to MongoDB
```bash
# Check if MongoDB is running
mongod --version

# Start MongoDB service
# Windows: net start MongoDB
# Mac/Linux: sudo systemctl start mongod
```

### WiFi check not working
```bash
# Enable test mode in browser console
localStorage.setItem('test_wifi_ssid', 'LIBRARY_WIFI')
```

### Port 3000 already in use
```bash
# Use different port
npm run dev -- -p 3001
```

### Build errors
```bash
# Clear cache and reinstall
rm -rf .next node_modules
npm install
npm run dev
```

## 📄 License

This project is built for Bright Beginning Library. All rights reserved.

## 👨‍💻 Development

### Build for Production

```bash
npm run build
npm start
```

### Linting

```bash
npm run lint
```

## 📞 Support

For issues or questions:
1. Check this README thoroughly
2. Review the code comments
3. Check MongoDB connection
4. Verify environment variables

## 🎓 Credits

Built with ❤️ using:
- Next.js 14
- TypeScript
- Tailwind CSS
- MongoDB
- Mongoose

---

**Version**: 1.0.0  
**Last Updated**: February 2026  
**Author**: Bright Beginning Library Development Team
