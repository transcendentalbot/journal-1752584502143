// /app/journal/page.tsx
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import JournalEntry from '@/components/JournalEntry';

export default async function JournalPage() {
  const session = await getServerSession(authOptions);
  const entries = await prisma.journalEntry.findMany({
    where: { userId: session?.user?.id },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="max-w-3xl mx-auto py-8">
      <h1 className="text-3xl font-bold mb-4">My Journal</h1>
      {entries.map((entry) => (
        <JournalEntry key={entry.id} entry={entry} />
      ))}
    </div>
  );
}

// /components/JournalEntry.tsx
import { JournalEntry as JournalEntryType } from '@prisma/client';
import { format } from 'date-fns';

interface JournalEntryProps {
  entry: JournalEntryType;
}

export default function JournalEntry({ entry }: JournalEntryProps) {
  return (
    <div className="border rounded-md p-4 mb-4">
      <h2 className="text-xl font-bold">{entry.title}</h2>
      <p className="text-gray-500">{format(entry.createdAt, 'MMMM d, yyyy')}</p>
      <p>{entry.content}</p>
    </div>
  );
}

// /app/journal/new/page.tsx
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import NewJournalEntryForm from '@/components/NewJournalEntryForm';

export default async function NewJournalEntryPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/api/auth/signin');
  }

  return <NewJournalEntryForm />;
}

// /components/NewJournalEntryForm.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function NewJournalEntryForm() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const response = await fetch('/api/journal', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ title, content }),
    });

    if (response.ok) {
      setTitle('');
      setContent('');
      router.refresh();
    } else {
      console.error('Failed to create journal entry');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto">
      <div className="mb-4">
        <label htmlFor="title" className="block font-bold mb-2">
          Title
        </label>
        <input
          type="text"
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="border rounded-md px-3 py-2 w-full"
          required
        />
      </div>
      <div className="mb-4">
        <label htmlFor="content" className="block font-bold mb-2">
          Content
        </label>
        <textarea
          id="content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="border rounded-md px-3 py-2 w-full"
          rows={5}
          required
        />
      </div>
      <button
        type="submit"
        className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
      >
        Save
      </button>
    </form>
  );
}

// /app/api/journal/route.ts
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { title, content } = await request.json();

  if (!title || !content) {
    return NextResponse.json({ error: 'Title and content are required' }, { status: 400 });
  }

  const entry = await prisma.journalEntry.create({
    data: {
      title,
      content,
      userId: session.user.id,
    },
  });

  return NextResponse.json(entry);
}