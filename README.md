# Podo - React TypeScript Web Application

A modern, responsive React TypeScript web application built with Vite, featuring three main sections: Library, My Week, and Analytics. Optimized for both mobile and desktop experiences.

## 🚀 Features

- **Mobile-First Responsive Design**: Optimized for phone screens with excellent desktop visibility
- **Three Main Tabs**:
  - **Library**: Manage files, documents, and projects with search functionality
  - **My Week**: Weekly calendar view with event management and quick stats
  - **Analytics**: Performance metrics, charts, and activity tracking
- **Modern UI**: Built with Tailwind CSS for beautiful, consistent styling
- **TypeScript**: Full type safety and better development experience
- **Fast Development**: Powered by Vite for lightning-fast builds and HMR

## 🛠️ Tech Stack

- **React 19** with TypeScript
- **Vite** for build tooling
- **Tailwind CSS** for styling
- **Lucide React** for modern icons
- **ESLint** for code quality

## 📱 Responsive Design

- **Mobile (< 640px)**: Single column layout, touch-friendly buttons, compact navigation
- **Tablet (640px - 1024px)**: Two-column layouts where appropriate
- **Desktop (> 1024px)**: Full multi-column layouts with expanded features

## 🚀 Quick Start

### Prerequisites

- Node.js (version 18 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd podo
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173`

## 📦 Build for Production

```bash
npm run build
```

The built files will be in the `dist` directory, ready for deployment.

## 🌐 Deployment Options

This application can be deployed to various hosting platforms:

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Vercel will automatically detect the Vite configuration
3. Deploy with zero configuration

### Netlify
1. Build the project: `npm run build`
2. Upload the `dist` folder to Netlify
3. Or connect your GitHub repository for automatic deployments

### Traditional Web Hosting
1. Build the project: `npm run build`
2. Upload the contents of the `dist` folder to your web server

### Docker Deployment
Create a `Dockerfile`:
```dockerfile
FROM node:18-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

## 🎨 Customization

### Colors and Theming
The application uses Tailwind CSS. You can customize colors by modifying the `tailwind.config.js` file.

### Adding New Features
1. Create new components in the `src/components` directory
2. Add new tabs by modifying the `tabs` array in `src/App.tsx`
3. Extend the TypeScript interfaces as needed

## 📁 Project Structure

```
src/
├── components/
│   ├── MyObjects.tsx      # Object management interface
│   ├── MyWeek.tsx         # Weekly calendar view
│   └── MyAnalytics.tsx    # Analytics dashboard
├── App.tsx                # Main application component
├── main.tsx              # Application entry point
└── index.css             # Global styles with Tailwind
```

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint

## 📱 Mobile Features

- Touch-friendly interface
- Responsive navigation with icon-only view on small screens
- Optimized layouts for portrait orientation
- Fast loading and smooth animations

## 🖥️ Desktop Features

- Multi-column layouts
- Expanded navigation with full labels
- Hover effects and enhanced interactions
- Optimized for larger screens

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Commit your changes: `git commit -am 'Add new feature'`
4. Push to the branch: `git push origin feature/new-feature`
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support, please open an issue in the GitHub repository or contact the development team.
