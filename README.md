# 🏢 CoZones - Smart Space Booking Platform

[![React](https://img.shields.io/badge/React-19.x-61DAFB?logo=react)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-8.x-646CFF?logo=vite)](https://vitejs.dev/)
[![Express](https://img.shields.io/badge/Express-4.x-000000?logo=express)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16.x-4169E1?logo=postgresql)](https://www.postgresql.org/)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)

## 📋 Overview

**CoZones** is a comprehensive **building space booking platform** that connects property owners with guests. It serves as a centralized system where sellers can list their spaces (offices, halls, meeting rooms, etc.), and guests can discover, favorite, and book these spaces. The platform integrates with other listing platforms like Dafterkhan to maximize visibility.

### 👥 User Roles

| Role | Capabilities |
|------|--------------|
| **Guest** | Browse spaces, view details, book units (account optional) |
| **User/Seller** | List spaces, manage units, handle bookings, track earnings |
| **Admin** | Manage all users, approve listings, platform analytics, dispute resolution |

## ✨ Key Features

- 🔄 **Multi-Platform Publishing** - List spaces on CoZones + partner platforms (Dafterkhan, etc.)
- 📅 **Smart Booking System** - Real-time availability, conflict checking, calendar integration
- ⭐ **Favorites & Wishlists** - Guests can save spaces for future bookings
- 🏘️ **Space & Unit Management** - Sellers can add multiple spaces with detailed unit configurations
- 👥 **Role-Based Access** - Distinct dashboards for Guests, Sellers, and Admins
- 💳 **Booking Workflow** - Instant or pending approval based on seller preferences

## 🛠️ Tech Stack

### Frontend
- **React 19** - UI library
- **React Router DOM 7** - Navigation
- **Vite 8** - Build tool & dev server
- **Axios** - API calls
- **React Icons** - Icon library
- **Swiper** - Image carousels
- **CORS** - Cross-origin resource sharing

### Backend (Assumed)
- **Node.js + Express** - REST API
- **PostgreSQL** - Database

### Dev Tools
- **ESLint** - Code linting
- **Vite Plugin React** - Fast refresh

## 📦 Installation

### Prerequisites
- Node.js (v18 or later)
- npm or yarn
- PostgreSQL (v14 or later)

### Frontend Setup

```bash
# Clone the repository
git clone https://github.com/MuhammadWebDeveloper/CozonesBackend_V2.git
cd cozones

# Install dependencies
npm install

# Create environment file
cp .env.example .env.local

# Start development server
npm run dev