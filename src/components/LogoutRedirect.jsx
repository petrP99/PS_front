import { useEffect } from 'react';

export default function LogoutRedirect() {
  useEffect(() => {
    window.location.href = 'http://localhost:9091/logout';
  }, []);
  return null;
}