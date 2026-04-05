import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificar si hay token en localStorage
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    
    if (token) {
      // Redirigir al dashboard si está autenticado
      router.push('/dashboard');
    } else {
      // Redirigir al login si no está autenticado
      router.push('/login');
    }
  }, [router]);

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}>
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>🚀 LiquidPOS 2.0</h1>
          <p>Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>LiquidPOS - Sistema de Gestión Empresarial</title>
        <meta name="description" content="Sistema completo de gestión empresarial con inventario, facturación y más" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div>Redirigiendo...</div>
    </>
  );
}
