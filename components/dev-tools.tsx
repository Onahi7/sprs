"use client";

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Cog, X } from 'lucide-react';

export function DevTools() {
  const [isOpen, setIsOpen] = useState(false);
  
  if (process.env.NODE_ENV === 'production') {
    return null;
  }
  
  return (
    <div className="fixed bottom-4 right-4 z-50">
      {isOpen ? (
        <div className="bg-white rounded-lg shadow-lg p-4 border w-64">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">Developer Tools</h3>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setIsOpen(false)}
              className="h-6 w-6"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="space-y-2">
            <Link href="/cloudinary-test" className="block">
              <Button variant="outline" size="sm" className="w-full justify-start">
                Cloudinary Test
              </Button>
            </Link>
            <Link href="/register" className="block">
              <Button variant="outline" size="sm" className="w-full justify-start">
                Registration Form
              </Button>
            </Link>
            <Link href="/auth/login" className="block">
              <Button variant="outline" size="sm" className="w-full justify-start">
                Login Page
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <Button 
          onClick={() => setIsOpen(true)} 
          className="rounded-full h-12 w-12 flex items-center justify-center"
        >
          <Cog className="h-6 w-6" />
        </Button>
      )}
    </div>
  );
}
