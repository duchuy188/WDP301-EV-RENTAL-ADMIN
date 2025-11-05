import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ToastContainer } from 'react-toastify';
import App from './App.tsx';
import './index.css';
import 'react-toastify/dist/ReactToastify.css';
import './styles/toast.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
    <ToastContainer
      position="top-right"
      autoClose={3000}
      hideProgressBar={false}
      newestOnTop={true}
      closeOnClick
      rtl={false}
      pauseOnFocusLoss={false}
      draggable
      pauseOnHover
      theme="colored"
      limit={3}
      style={{
        top: '80px', // Không che header
        zIndex: 9999, // Luôn hiển thị trên modal
      }}
    />
  </StrictMode>
);
