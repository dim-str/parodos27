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
        <body className="overscroll-none bg-gray-50 text-slate-800">
        <Header /> {/* Μπαίνει στην κορυφή κάθε σελίδας */}
        <CartDrawer />

        
        <main>{children}</main> {/* Εδώ θα μπαίνει ο κατάλογος κλπ */}
      </body>
      </html>
  );
}