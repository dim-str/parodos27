import './globals.css';
import Header from '../components/Header'; // Φέρνουμε το Header που φτιάξαμε
import CartDrawer from '../components/CartDrawer';
import { Toaster } from 'react-hot-toast';

export const metadata = {
  title: 'Πάροδος 27 | Μαγειρείο',
  description: 'Το καλύτερο μαγειρείο στον Βόλο.',
};

export default function RootLayout({ children }) {
  return (
      <html lang="el">
        <body className="bg-gray-50 text-slate-800">
        <Header /> {/* Μπαίνει στην κορυφή κάθε σελίδας */}
        <CartDrawer />

        {/* ΠΡΟΣΘΗΚΗ: Ο μηχανισμός των ειδοποιήσεων */}
        <Toaster
            position="top-center"
            toastOptions={{
                style: {
                    background: '#2d3819', // olive-900
                    color: '#fff',
                    borderRadius: '16px',
                    fontWeight: 'bold',
                    padding: '16px'
                },
                success: {
                    iconTheme: { primary: '#6b8e23', secondary: '#fff' }, // olive-600
                },
                error: {
                    style: { background: '#fee2e2', color: '#991b1b' }, // Απαλό κόκκινο
                    iconTheme: { primary: '#ef4444', secondary: '#fff' },
                },
            }}
        />
        <main>{children}</main> {/* Εδώ θα μπαίνει ο κατάλογος κλπ */}
      </body>
      </html>
  );
}