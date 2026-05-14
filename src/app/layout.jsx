import './globals.css';

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
      </head>
      <body suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
