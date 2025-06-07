'use client'
import Uploader from '../app/components/Uploader'


export default function Dashboard() {
  return (
    <main className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Welcome to Pocket Audit</h1>
      <Uploader/>
    </main>
  );
}