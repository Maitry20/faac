import './globals.css';
import { AppProvider } from '../context/AppContext';

export const metadata = {
  title: 'Food At A Click',
  description: 'Skip the queue, not the flavor',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <script dangerouslySetInnerHTML={{ __html: `
          (function() {
            try {
              const theme = localStorage.getItem('faac_theme') || 'light';
              document.body.className = theme;
            } catch (e) {}
          })()
        ` }} />
      </head>
      <body suppressHydrationWarning className="light">
        <AppProvider>
          {children}
        </AppProvider>
      </body>
    </html>
  );
}
